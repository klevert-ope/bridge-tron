import { ChainSymbol } from "@allbridge/bridge-core-sdk";

/**
 * Format token amount with proper decimals
 * @param {string|number} amount - The amount to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted amount
 */
export function formatTokenAmount(
	amount,
	decimals = 6
) {
	if (!amount) return "0";
	const num = parseFloat(amount);
	return num.toFixed(decimals);
}

/**
 * Validate Tron address format
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid Tron address
 */
export function isValidTronAddress(address) {
	if (!address) return false;
	// Tron addresses start with T and are 34 characters long
	return /^T[A-Za-z1-9]{33}$/.test(address);
}

/**
 * Shorten address for display
 * @param {string} address - The address to shorten
 * @param {number} chars - Number of characters to show on each side
 * @returns {string} Shortened address
 */
export function shortenAddress(
	address,
	chars = 6
) {
	if (!address) return "";
	if (address.length <= chars * 2) return address;
	return `${address.slice(
		0,
		chars
	)}...${address.slice(-chars)}`;
}

/**
 * Get chain display name
 * @param {string} chainSymbol - Chain symbol from SDK
 * @returns {string} Display name
 */
export function getChainDisplayName(chainSymbol) {
	const chainNames = {
		[ChainSymbol.ETH]: "Ethereum",
		[ChainSymbol.TRX]: "Tron",
		[ChainSymbol.POL]: "Polygon",
		[ChainSymbol.BSC]: "BNB Chain",
		[ChainSymbol.AVAX]: "Avalanche",
		[ChainSymbol.ARB]: "Arbitrum",
		[ChainSymbol.OP]: "Optimism",
	};
	return chainNames[chainSymbol] || chainSymbol;
}

/**
 * Calculate estimated transfer time
 * @param {string} sourceChain - Source chain symbol
 * @param {string} destinationChain - Destination chain symbol
 * @returns {number} Estimated time in minutes
 */
export function getEstimatedTransferTime(
	sourceChain,
	destinationChain
) {
	// Base times for different chain combinations
	const baseTimes = {
		[`${ChainSymbol.ETH}-${ChainSymbol.TRX}`]: 10, // Ethereum to Tron
		[`${ChainSymbol.TRX}-${ChainSymbol.ETH}`]: 10, // Tron to Ethereum
		default: 15,
	};

	const key = `${sourceChain}-${destinationChain}`;
	return baseTimes[key] || baseTimes.default;
}

/**
 * Format gas fee for display
 * @param {Object} gasFee - Gas fee object from SDK
 * @returns {Object} Formatted gas fee information
 */
export function formatGasFee(gasFee) {
	if (!gasFee) return null;

	return {
		native: gasFee.native
			? {
					...gasFee.native,
					formatted: `${gasFee.native.float} ETH`,
			  }
			: null,
		stablecoin: gasFee.stablecoin
			? {
					...gasFee.stablecoin,
					formatted: `${gasFee.stablecoin.float} USDT`,
			  }
			: null,
	};
}

/**
 * Get transaction explorer URL
 * @param {string} txHash - Transaction hash
 * @param {string} chain - Chain symbol
 * @returns {string} Explorer URL
 */
export function getExplorerUrl(txHash, chain) {
	const explorers = {
		[ChainSymbol.ETH]: `https://etherscan.io/tx/${txHash}`,
		[ChainSymbol.TRX]: `https://tronscan.org/#/transaction/${txHash}`,
		[ChainSymbol.POL]: `https://polygonscan.com/tx/${txHash}`,
		[ChainSymbol.BSC]: `https://bscscan.com/tx/${txHash}`,
	};
	return (
		explorers[chain] ||
		`https://etherscan.io/tx/${txHash}`
	);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		console.error(
			"Failed to copy to clipboard:",
			error
		);
		return false;
	}
}
