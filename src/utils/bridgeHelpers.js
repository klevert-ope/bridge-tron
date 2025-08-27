import {
	ChainSymbol,
	Messenger,
	FeePaymentMethod,
} from "@allbridge/bridge-core-sdk";

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
		// Basic Tron address validation (starts with T and 34 characters)
		if (!/^T[A-Za-z1-9]{33}$/.test(value)) {
			return "Please enter a valid Tron address";
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
		if (window.bridgeQuote)
			delete window.bridgeQuote;
		if (window.lastQuote) delete window.lastQuote;
		if (window.lastGasFee)
			delete window.lastGasFee;

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
		// Clear any global variables that might be cached
		if (window.bridgeQuote)
			delete window.bridgeQuote;
		if (window.lastQuote) delete window.lastQuote;
		if (window.lastGasFee)
			delete window.lastGasFee;
	} catch (e) {
		console.log(
			"⚠️ Could not clear global variables:",
			e
		);
	}
};

// Error handling functions
export const handleTransactionError = (error) => {
	let errorMessage = error.message;

	if (error.code === 4001) {
		errorMessage =
			"Transaction was rejected by user";
	} else if (error.code === -32603) {
		if (
			error.message.includes("insufficient funds")
		) {
			errorMessage =
				"Insufficient ETH balance for gas fees. Please add more ETH to your wallet.";
		} else if (
			error.message.includes("execution reverted")
		) {
			errorMessage =
				"Transaction failed - contract execution reverted. This might be due to insufficient token balance or contract issues.";
		} else {
			errorMessage =
				"Transaction failed - RPC error. This might be due to network congestion or contract issues. Please try again.";
		}
	} else if (
		error.message.includes("insufficient funds")
	) {
		errorMessage =
			"Insufficient ETH balance for gas fees. Please add more ETH to your wallet.";
	} else if (error.message.includes("gas")) {
		errorMessage =
			"Gas estimation failed. Please try again or increase gas limit.";
	} else if (
		error.message.includes("execution reverted")
	) {
		errorMessage =
			"Transaction failed - contract execution reverted. Please check your token balance and try again.";
	}

	return errorMessage;
};

// Bridge transaction building
export const buildBridgeTransaction = async (
	sdk,
	formValues,
	tokens,
	sourceToken
) => {
	const {
		amount,
		destinationAddress,
		gasFeePaymentMethod,
	} = formValues;

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

	// Prepare transaction parameters
	const txParams = {
		amount: amount,
		fromAccountAddress: formValues.account,
		toAccountAddress: destinationAddress,
		sourceToken: sourceToken,
		destinationToken: tokens.destination,
		messenger: Messenger.ALLBRIDGE,
		gasFeePaymentMethod: gasFeePaymentMethod,
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
