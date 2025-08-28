import {
	ChainSymbol,
	Messenger,
	FeePaymentMethod,
} from "@allbridge/bridge-core-sdk";
import { validateTronAddress } from "./bridgeUtils.js";

// Transaction handling functions
export const sendRawTransaction = async (
	rawTransaction
) => {
	const formattedTx = {
		from: rawTransaction.from,
		to: rawTransaction.to,
		data: rawTransaction.data,
		value: rawTransaction.value
			? `0x${parseInt(
					rawTransaction.value
			  ).toString(16)}`
			: "0x0",
	};
	const txHash = await window.ethereum.request({
		method: "eth_sendTransaction",
		params: [formattedTx],
	});

	return { transactionHash: txHash };
};

export const checkTokenBalance = async (
	sourceToken,
	account,
	amount
) => {
	try {
		if (window.ethers) {
			const provider =
				new window.ethers.BrowserProvider(
					window.ethereum
				);
			const tokenContract =
				new window.ethers.Contract(
					sourceToken.tokenAddress ||
						sourceToken.address,
					[
						{
							constant: true,
							inputs: [
								{
									name: "_owner",
									type: "address",
								},
							],
							name: "balanceOf",
							outputs: [
								{
									name: "balance",
									type: "uint256",
								},
							],
							type: "function",
						},
					],
					provider
				);

			const balance =
				await tokenContract.balanceOf(account);
			const balanceInTokens =
				parseFloat(balance) /
				Math.pow(10, sourceToken.decimals || 6);

			if (balanceInTokens < parseFloat(amount)) {
				throw new Error(
					`Insufficient ${
						sourceToken.symbol
					} balance. You have ${balanceInTokens.toFixed(
						6
					)} but need ${amount}`
				);
			}
		}
	} catch (error) {
		// Continue anyway, the transaction will fail if balance is insufficient
		console.warn(
			"Balance check failed:",
			error.message
		);
	}
};

// Token management functions
export const loadAvailableTokens = async (
	sdk
) => {
	try {
		const chains = await sdk.chainDetailsMap();
		const ethTokens =
			chains[ChainSymbol.ETH]?.tokens || [];
		const tronTokens =
			chains[ChainSymbol.TRX]?.tokens || [];

		// Filter for USDC and USDT on Ethereum
		const sourceTokens = ethTokens.filter(
			(token) =>
				token.symbol === "USDC" ||
				token.symbol === "USDT"
		);

		// Filter for USDT on Tron
		const destinationTokens = tronTokens.filter(
			(token) => token.symbol === "USDT"
		);

		return {
			source: sourceTokens,
			destination: destinationTokens[0], // USDT on Tron
		};
	} catch (error) {
		console.error(
			"Failed to load tokens:",
			error
		);
		throw new Error(
			"Failed to load available tokens"
		);
	}
};

export const findSourceToken = (
	tokens,
	tokenAddress
) => {
	return tokens.source.find((token) => {
		const tokenAddr =
			token.tokenAddress || token.address;
		return tokenAddr === tokenAddress;
	});
};

// Slippage Protection Configuration
const SLIPPAGE_CONFIG = {
	DEFAULT_TOLERANCE: 0.5, // 0.5%
	MAX_TOLERANCE: 2.0, // 2%
	MIN_TOLERANCE: 0.1, // 0.1%
	DEADLINE_MINUTES: 5, // 5 minutes
};

// Quote management functions
export const getBridgeQuote = async (
	sdk,
	formValues,
	tokens
) => {
	const {
		sourceToken: tokenAddress,
		amount,
		destinationAddress,
		gasFeePaymentMethod,
	} = formValues;

	if (
		!tokenAddress ||
		!amount ||
		!destinationAddress ||
		parseFloat(amount) <= 0 ||
		!gasFeePaymentMethod
	) {
		return null;
	}

	const sourceToken = findSourceToken(
		tokens,
		tokenAddress
	);
	if (!sourceToken || !tokens.destination) {
		console.warn(
			"❌ Source or destination token not found"
		);
		return null;
	}

	const amountToBeReceived =
		await sdk.getAmountToBeReceived(
			amount,
			sourceToken,
			tokens.destination
		);

	// Calculate slippage protection values
	const slippageTolerance =
		SLIPPAGE_CONFIG.DEFAULT_TOLERANCE;
	const minAmountToReceive =
		amountToBeReceived *
		(1 - slippageTolerance / 100);
	const deadline =
		Math.floor(Date.now() / 1000) +
		SLIPPAGE_CONFIG.DEADLINE_MINUTES * 60;

	let gasFeeOptions;
	let transferTimeMs;

	try {
		gasFeeOptions = await sdk.getGasFeeOptions(
			sourceToken,
			tokens.destination,
			Messenger.ALLBRIDGE
		);
		transferTimeMs = sdk.getAverageTransferTime(
			sourceToken,
			tokens.destination,
			Messenger.ALLBRIDGE
		);
	} catch {
		gasFeeOptions = await sdk.getGasFeeOptions(
			sourceToken,
			tokens.destination,
			Messenger.CCTP
		);
		transferTimeMs = sdk.getAverageTransferTime(
			sourceToken,
			tokens.destination,
			Messenger.CCTP
		);
	}

	// Convert transfer time to human readable format
	const transferTimeMinutes = Math.ceil(
		transferTimeMs / (1000 * 60)
	);

	return {
		success: true,
		quote: {
			fromToken: sourceToken,
			toToken: tokens.destination,
			fromAmount: amount,
			toAmount: amountToBeReceived,
			minAmountToReceive: minAmountToReceive,
			slippageTolerance: slippageTolerance,
			deadline: deadline,
			gasFee:
				gasFeeOptions.native?.float ||
				gasFeeOptions.native?.int,
			gasFeeStablecoin:
				gasFeeOptions.stablecoin?.float ||
				gasFeeOptions.stablecoin?.int,
			transferTime: `${transferTimeMinutes} minutes`,
			messenger: "Allbridge",
			route: `${sourceToken.symbol} (Ethereum) → ${tokens.destination.symbol} (Tron)`,
			paymentMethod: gasFeePaymentMethod,
		},
		provider: "allbridge",
		sourceChain: ChainSymbol.ETH,
		destinationChain: ChainSymbol.TRX,
	};
};

// Form validation functions
export const validateForm = {
	sourceToken: (value) =>
		!value
			? "Please select a source token"
			: null,

	amount: (value) => {
		if (!value) return "Please enter an amount";
		if (parseFloat(value) <= 0)
			return "Amount must be greater than 0";
		return null;
	},

	destinationAddress: (value) => {
		if (!value)
			return "Please enter destination address";

		const validation = validateTronAddress(value);
		if (!validation.isValid) {
			return validation.error;
		}
		return null;
	},

	gasFeePaymentMethod: (value) => {
		if (!value)
			return "Please select a gas fee payment method";
		if (
			value !==
				FeePaymentMethod.WITH_NATIVE_CURRENCY &&
			value !== FeePaymentMethod.WITH_STABLECOIN
		) {
			return "Please select a valid gas fee payment method";
		}
		return null;
	},
};

// State management functions
export const forceStateReset = () => {
	// Clear any cached data
	try {
		// Clear storage
		Object.keys(localStorage).forEach((key) => {
			if (
				key.includes("bridge") ||
				key.includes("quote") ||
				key.includes("gas")
			) {
				localStorage.removeItem(key);
			}
		});

		Object.keys(sessionStorage).forEach((key) => {
			if (
				key.includes("bridge") ||
				key.includes("quote") ||
				key.includes("gas")
			) {
				sessionStorage.removeItem(key);
			}
		});
	} catch (e) {
		console.log(
			"⚠️ Error during state reset:",
			e
		);
	}
};

export const clearCachedData = () => {
	try {
		// Clear storage only - no global variables
		Object.keys(localStorage).forEach((key) => {
			if (
				key.includes("bridge") ||
				key.includes("quote") ||
				key.includes("gas")
			) {
				localStorage.removeItem(key);
			}
		});

		Object.keys(sessionStorage).forEach((key) => {
			if (
				key.includes("bridge") ||
				key.includes("quote") ||
				key.includes("gas")
			) {
				sessionStorage.removeItem(key);
			}
		});
	} catch (e) {
		console.log("⚠️ Could not clear storage:", e);
	}
};

// Error handling functions
export const handleTransactionError = (error) => {
	// Sanitize error messages to prevent information leakage
	const sanitizeError = (err) => {
		const message = err.message || err.toString();

		// Define safe error messages
		const safeMessages = {
			// User actions
			"user rejected":
				"Transaction was cancelled by user",
			"user denied":
				"Transaction was denied by user",
			"user cancelled":
				"Transaction was cancelled by user",

			// Balance issues
			"insufficient funds":
				"Insufficient balance for transaction",
			"insufficient balance":
				"Insufficient balance for transaction",
			"balance too low":
				"Insufficient balance for transaction",

			// Gas issues
			gas: "Gas estimation failed. Please try again",
			"gas limit":
				"Gas limit exceeded. Please try again",
			"gas price":
				"Gas price issue. Please try again",

			// Network issues
			network:
				"Network connection issue. Please try again",
			timeout:
				"Request timed out. Please try again",
			connection:
				"Connection issue. Please try again",

			// Contract issues
			"execution reverted":
				"Transaction failed. Please check your inputs and try again",
			contract:
				"Contract interaction failed. Please try again",

			// SDK issues
			sdk: "Bridge service temporarily unavailable. Please try again",
			quote:
				"Unable to get quote. Please try again",
			bridge:
				"Bridge service temporarily unavailable. Please try again",
		};

		// Check for specific error codes
		if (err.code === 4001) {
			return "Transaction was cancelled by user";
		}
		if (err.code === -32603) {
			return "Network error. Please try again";
		}
		if (err.code === -32000) {
			return "Network busy. Please try again";
		}

		// Check for known error patterns
		for (const [
			pattern,
			safeMessage,
		] of Object.entries(safeMessages)) {
			if (
				message
					.toLowerCase()
					.includes(pattern.toLowerCase())
			) {
				return safeMessage;
			}
		}

		// Default safe message
		return "Transaction failed. Please try again";
	};

	return sanitizeError(error);
};

// Bridge transaction building
export const buildBridgeTransaction = async (
	sdk,
	formValues,
	tokens,
	sourceToken,
	quote
) => {
	const {
		amount,
		destinationAddress,
		gasFeePaymentMethod,
	} = formValues;

	// Validate quote and slippage protection
	if (!quote) {
		throw new Error(
			"Quote is required for transaction building"
		);
	}

	// Handle both quote formats: direct quote object or { success, quote } structure
	const quoteData = quote.quote || quote;

	if (
		!quoteData ||
		!quoteData.minAmountToReceive ||
		!quoteData.deadline
	) {
		throw new Error(
			"Valid quote with slippage protection data required for transaction building"
		);
	}

	const {
		minAmountToReceive,
		deadline,
		slippageTolerance,
	} = quoteData;

	// Check if current time exceeds deadline
	const currentTime = Math.floor(
		Date.now() / 1000
	);
	if (currentTime > deadline) {
		throw new Error(
			"Quote has expired. Please get a new quote."
		);
	}

	let gasFeeOptions;
	try {
		gasFeeOptions = await sdk.getGasFeeOptions(
			sourceToken,
			tokens.destination,
			Messenger.ALLBRIDGE
		);
	} catch {
		gasFeeOptions = await sdk.getGasFeeOptions(
			sourceToken,
			tokens.destination,
			Messenger.CCTP
		);
	}

	// Prepare transaction parameters with slippage protection
	const txParams = {
		amount: amount,
		fromAccountAddress: formValues.account,
		toAccountAddress: destinationAddress,
		sourceToken: sourceToken,
		destinationToken: tokens.destination,
		messenger: Messenger.ALLBRIDGE,
		gasFeePaymentMethod: gasFeePaymentMethod,
		// Add slippage protection
		minAmountToReceive: minAmountToReceive,
		deadline: deadline,
		slippageTolerance: slippageTolerance,
	};

	const allbridgeSourceToken = {
		...sourceToken,
		bridgeAddress: sourceToken.bridgeAddress,
	};

	txParams.sourceToken = allbridgeSourceToken;
	txParams.messenger = Messenger.ALLBRIDGE;

	// Add fee parameter if using stablecoin payment method
	if (
		gasFeePaymentMethod ===
		FeePaymentMethod.WITH_STABLECOIN
	) {
		txParams.fee = gasFeeOptions.stablecoin?.int;
	}

	return await sdk.bridge.rawTxBuilder.send(
		txParams
	);
};

// Approval transaction building
export const buildApprovalTransaction = async (
	sdk,
	sourceToken,
	account
) => {
	return await sdk.bridge.rawTxBuilder.approve({
		token: sourceToken,
		owner: account,
	});
};
