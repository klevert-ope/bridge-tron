import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { FeePaymentMethod } from "@allbridge/bridge-core-sdk";
import {
	loadAvailableTokens,
	findSourceToken,
	getBridgeQuote,
	validateForm,
	forceStateReset,
	clearCachedData,
	handleTransactionError,
	buildBridgeTransaction,
	buildApprovalTransaction,
	sendRawTransaction,
	checkTokenBalance,
} from "../utils/bridgeHelpers";

export const useBridgeForm = (
	sdk,
	account,
	onTransferStatus
) => {
	const [isLoading, setIsLoading] =
		useState(false);
	const [isLoadingTokens, setIsLoadingTokens] =
		useState(false);
	const [isApproving, setIsApproving] =
		useState(false);
	const [needsApproval, setNeedsApproval] =
		useState(false);
	const [tokens, setTokens] = useState({
		source: [],
		destination: null,
	});
	const [gasFee, setGasFee] = useState(null);
	const [quote, setQuote] = useState(null);
	const [isGettingQuote, setIsGettingQuote] =
		useState(false);

	const form = useForm({
		initialValues: {
			sourceToken: "",
			amount: "",
			destinationAddress: "",
			gasFeePaymentMethod:
				FeePaymentMethod.WITH_NATIVE_CURRENCY,
		},
		validate: validateForm,
	});

	// Load available tokens
	useEffect(() => {
		async function loadTokens() {
			setIsLoadingTokens(true);
			try {
				const tokenData =
					await loadAvailableTokens(sdk);
				setTokens(tokenData);

				// Set default source token
				if (tokenData.source.length > 0) {
					const tokenAddress =
						tokenData.source[0].tokenAddress ||
						tokenData.source[0].address;
					form.setFieldValue(
						"sourceToken",
						tokenAddress
					);
				} else {
					form.setFieldValue("sourceToken", "");
				}
			} catch (error) {
				console.error(
					"Failed to load tokens:",
					error
				);
				notifications.show({
					title: "Error",
					message:
						"Failed to load available tokens",
					color: "red",
				});
				setTokens({
					source: [],
					destination: null,
				});
			} finally {
				setIsLoadingTokens(false);
			}
		}

		if (sdk) {
			loadTokens();
		}
	}, [sdk]);

	// Reset form and quote
	const resetFormAndQuote = () => {
		form.reset();
		forceStateReset();

		// Set default source token if available
		if (tokens.source.length > 0) {
			const tokenAddress =
				tokens.source[0].tokenAddress ||
				tokens.source[0].address;
			form.setFieldValue(
				"sourceToken",
				tokenAddress
			);
		}
	};

	// Get quote function
	const getQuote = async () => {
		const formValues = form.values;

		if (
			!formValues.sourceToken ||
			!formValues.amount ||
			!formValues.destinationAddress ||
			parseFloat(formValues.amount) <= 0 ||
			!formValues.gasFeePaymentMethod
		) {
			setQuote(null);
			window.bridgeQuote = null;
			return;
		}

		setIsGettingQuote(true);
		try {
			const quoteResult = await getBridgeQuote(
				sdk,
				formValues,
				tokens
			);

			if (quoteResult) {
				setQuote(quoteResult);
				window.bridgeQuote = quoteResult;
				// Extract gas fee options from the quote structure
				const gasFeeOptions = {
					native: {
						float: quoteResult.quote.gasFee,
					},
					stablecoin: quoteResult.quote
						.gasFeeStablecoin
						? {
								float:
									quoteResult.quote
										.gasFeeStablecoin,
						  }
						: null,
				};
				setGasFee(gasFeeOptions);
			} else {
				setQuote(null);
				window.bridgeQuote = null;
			}
		} catch (error) {
			console.error(
				"❌ Error getting bridge quote:",
				error
			);
			setQuote(null);
			window.bridgeQuote = null;
			notifications.show({
				title: "Quote Error",
				message: `Failed to get bridge quote: ${error.message}`,
				color: "red",
			});
		} finally {
			setIsGettingQuote(false);
		}
	};

	// Get quote when form values change
	useEffect(() => {
		if (
			form.values.sourceToken &&
			form.values.amount &&
			form.values.destinationAddress &&
			form.values.gasFeePaymentMethod &&
			parseFloat(form.values.amount) > 0
		) {
			getQuote();
		} else {
			setQuote(null);
			window.bridgeQuote = null;
			setGasFee(null);
		}

		setNeedsApproval(false);
		window.bridgeQuote = null;
	}, [
		form.values,
		tokens.source,
		tokens.destination,
		sdk,
	]);

	// Clear cached data when payment method changes
	useEffect(() => {
		if (
			form.values.sourceToken &&
			form.values.amount &&
			account
		) {
			clearCachedData();
		}
	}, [form.values.gasFeePaymentMethod, account]);

	// Handle approval
	const handleApproval = async () => {
		const { sourceToken: tokenAddress, amount } =
			form.values;

		if (!tokenAddress || !amount) {
			notifications.show({
				title: "Error",
				message:
					"Please fill in token and amount first",
				color: "red",
			});
			return;
		}

		const sourceToken = findSourceToken(
			tokens,
			tokenAddress
		);
		if (!sourceToken) {
			notifications.show({
				title: "Error",
				message: "Source token not found",
				color: "red",
			});
			return;
		}

		setIsApproving(true);
		try {
			const approveRawTx =
				await buildApprovalTransaction(
					sdk,
					sourceToken,
					account
				);
			const approveTxReceipt =
				await sendRawTransaction(approveRawTx);

			notifications.show({
				title: "Approval Sent",
				message: `Approval transaction hash: ${approveTxReceipt.transactionHash}`,
				color: "blue",
			});

			setNeedsApproval(false);
			resetFormAndQuote();
		} catch (error) {
			console.error("Approval failed:", error);
			notifications.show({
				title: "Approval Failed",
				message: error.message,
				color: "red",
			});
			resetFormAndQuote();
		} finally {
			setIsApproving(false);
		}
	};

	// Handle send tokens
	const handleSend = async () => {
		const {
			sourceToken: tokenAddress,
			amount,
			destinationAddress,
		} = form.values;

		if (
			!tokenAddress ||
			!amount ||
			!destinationAddress
		) {
			return;
		}

		setIsLoading(true);
		try {
			// Check if wallet is connected
			if (!window.ethereum) {
				throw new Error(
					"No wallet detected. Please install MetaMask or another wallet."
				);
			}

			if (
				!tokens.source ||
				tokens.source.length === 0
			) {
				notifications.show({
					title: "Error",
					message: "No tokens available",
					color: "red",
				});
				return;
			}

			const sourceToken = findSourceToken(
				tokens,
				tokenAddress
			);
			if (!sourceToken) {
				throw new Error("Source token not found");
			}

			// Validate quote
			if (!quote || !quote.quote) {
				console.warn(
					"No valid quote available, getting fresh quote..."
				);
				await getQuote();
				if (!quote || !quote.quote) {
					throw new Error(
						"Failed to get valid quote. Please try again."
					);
				}
			}

			// Validate quote payment method
			if (
				quote &&
				quote.quote?.paymentMethod !==
					form.values.gasFeePaymentMethod
			) {
				console.warn(
					"Quote payment method mismatch, recalculating..."
				);
				setQuote(null);
				window.bridgeQuote = null;
				await getQuote();
				if (!quote || !quote.quote) {
					throw new Error(
						"Failed to get valid quote for selected payment method"
					);
				}
			}

			// Check token balance
			await checkTokenBalance(
				sourceToken,
				account,
				amount
			);

			// Check if approval is needed
			const allowanceCheck =
				await sdk.bridge.checkAllowance({
					token: sourceToken,
					owner: account,
					gasFeePaymentMethod:
						form.values.gasFeePaymentMethod,
					amount: amount,
				});

			if (!allowanceCheck) {
				setNeedsApproval(true);
				notifications.show({
					title: "Approval Required",
					message:
						"Please approve the bridge to spend your tokens first",
					color: "yellow",
				});
				return;
			}

			// Build and send bridge transaction
			const bridgeRawTx =
				await buildBridgeTransaction(
					sdk,
					{ ...form.values, account },
					tokens,
					sourceToken
				);

			if (!bridgeRawTx) {
				throw new Error(
					"Failed to build bridge transaction"
				);
			}

			const txReceipt = await sendRawTransaction(
				bridgeRawTx
			);

			notifications.show({
				title: "Transfer Initiated",
				message: `Transaction hash: ${txReceipt.transactionHash}`,
				color: "green",
			});

			// Update transfer status
			onTransferStatus({
				status: "pending",
				txHash: txReceipt.transactionHash,
				amount,
				sourceToken: sourceToken.symbol,
				destinationToken:
					tokens.destination.symbol,
				destinationAddress,
				amountToReceive: quote?.quote?.toAmount,
				estimatedTime: quote?.quote?.transferTime,
				route: quote?.quote?.route,
			});

			resetFormAndQuote();
		} catch (error) {
			console.error(
				"Bridge transfer failed:",
				error
			);

			const errorMessage =
				handleTransactionError(error);
			notifications.show({
				title: "Transfer Failed",
				message: errorMessage,
				color: "red",
			});

			// Reset form for any transaction failure
			resetFormAndQuote();
		} finally {
			setIsLoading(false);
		}
	};

	// Handle form submission
	const handleSubmit = async () => {
		if (!quote || !quote.quote) {
			console.warn(
				"❌ No valid quote available, cannot proceed"
			);
			notifications.show({
				title: "Quote Required",
				message:
					"Please wait for the quote to be calculated before proceeding",
				color: "yellow",
			});
			return;
		}

		const sourceToken = findSourceToken(
			tokens,
			form.values.sourceToken
		);
		if (!sourceToken) {
			console.error("Source token not found");
			return;
		}

		await handleSend();
	};

	// Handle payment method change
	const handlePaymentMethodChange = (value) => {
		if (isLoading || isApproving) {
			notifications.show({
				title: "Please Wait",
				message:
					"Please wait for the current operation to complete",
				color: "yellow",
			});
			return;
		}

		forceStateReset();

		// Clear SDK cache if available
		if (sdk && sdk.clearCache) {
			try {
				sdk.clearCache();
			} catch (e) {
				console.log(
					"⚠️ Could not clear SDK cache:",
					e
				);
			}
		}

		// Clear storage
		try {
			Object.keys(localStorage).forEach((key) => {
				if (
					key.includes("bridge") ||
					key.includes("quote") ||
					key.includes("gas")
				) {
					localStorage.removeItem(key);
				}
			});

			Object.keys(sessionStorage).forEach(
				(key) => {
					if (
						key.includes("bridge") ||
						key.includes("quote") ||
						key.includes("gas")
					) {
						sessionStorage.removeItem(key);
					}
				}
			);
		} catch (e) {
			console.log(
				"⚠️ Could not clear storage:",
				e
			);
		}

		form.setFieldValue(
			"gasFeePaymentMethod",
			value
		);

		notifications.show({
			title: "Payment Method Changed",
			message: `Recalculating quote for ${
				value ===
				FeePaymentMethod.WITH_NATIVE_CURRENCY
					? "ETH"
					: "USDT"
			} payment.`,
			color: "blue",
		});
	};

	return {
		// State
		isLoading,
		isLoadingTokens,
		isApproving,
		needsApproval,
		tokens,
		gasFee,
		quote,
		isGettingQuote,
		form,

		// Actions
		handleApproval,
		handleSubmit,
		handlePaymentMethodChange,
		resetFormAndQuote,
	};
};
