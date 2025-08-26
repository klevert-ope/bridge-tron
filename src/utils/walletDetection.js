// Wallet detection and management utilities
export const WALLET_TYPES = {
	METAMASK: "metamask",
	TRUST_WALLET: "trustwallet",
	EXODUS: "exodus",
	BRAVE: "brave",
	COINBASE: "coinbase",
	PHANTOM: "phantom",
	UNKNOWN: "unknown",
};

export const WALLET_NAMES = {
	[WALLET_TYPES.METAMASK]: "MetaMask",
	[WALLET_TYPES.TRUST_WALLET]: "Trust Wallet",
	[WALLET_TYPES.EXODUS]: "Exodus",
	[WALLET_TYPES.BRAVE]: "Brave Wallet",
	[WALLET_TYPES.COINBASE]: "Coinbase Wallet",
	[WALLET_TYPES.PHANTOM]: "Phantom",
	[WALLET_TYPES.UNKNOWN]: "Web3 Wallet",
};

// Detect wallet type based on window.ethereum properties
export function detectWalletType() {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	) {
		return null;
	}

	const ethereum = window.ethereum;

	// Check for specific wallet identifiers first (most specific to least specific)
	if (ethereum.isPhantom) {
		return WALLET_TYPES.PHANTOM;
	}

	if (ethereum.isExodus) {
		return WALLET_TYPES.EXODUS;
	}

	if (ethereum.isTrust) {
		return WALLET_TYPES.TRUST_WALLET;
	}

	// Check for Brave Wallet (which also has isMetaMask = true)
	if (ethereum.isBraveWallet) {
		return WALLET_TYPES.BRAVE;
	}

	// Check for Coinbase Wallet (which also has isMetaMask = true)
	if (ethereum.isCoinbaseWallet) {
		return WALLET_TYPES.COINBASE;
	}

	// Check for MetaMask (after checking other wallets that also set isMetaMask)
	if (ethereum.isMetaMask) {
		// Additional check for Brave Wallet using user agent
		if (navigator.userAgent.includes("Brave")) {
			return WALLET_TYPES.BRAVE;
		}
		return WALLET_TYPES.METAMASK;
	}

	// Fallback for other Web3 wallets
	return WALLET_TYPES.UNKNOWN;
}

// Get wallet name for display
export function getWalletName(walletType) {
	if (!walletType) {
		return "Web3 Wallet";
	}
	return (
		WALLET_NAMES[walletType] ||
		WALLET_NAMES[WALLET_TYPES.UNKNOWN]
	);
}

// Get detected wallet info
export function getDetectedWalletInfo() {
	const walletType = detectWalletType();
	return {
		type: walletType,
		name: getWalletName(walletType),
		isInstalled: !!walletType,
	};
}

// Check if any wallet is installed
export function isAnyWalletInstalled() {
	return (
		typeof window !== "undefined" &&
		!!window.ethereum
	);
}

// Check if specific wallet is installed
export function isWalletInstalled(walletType) {
	const detectedType = detectWalletType();
	return detectedType === walletType;
}

// Get wallet installation URLs
export const WALLET_INSTALL_URLS = {
	[WALLET_TYPES.METAMASK]:
		"https://metamask.io/download/",
	[WALLET_TYPES.TRUST_WALLET]:
		"https://trustwallet.com/browser-extension",
	[WALLET_TYPES.EXODUS]:
		"https://exodus.com/download/",
	[WALLET_TYPES.BRAVE]:
		"https://brave.com/wallet/",
	[WALLET_TYPES.COINBASE]:
		"https://wallet.coinbase.com/",
	[WALLET_TYPES.PHANTOM]: "https://phantom.app/",
};

// Get recommended wallet installation URL
export function getRecommendedWalletUrl() {
	const detectedType = detectWalletType();
	if (
		detectedType &&
		WALLET_INSTALL_URLS[detectedType]
	) {
		return WALLET_INSTALL_URLS[detectedType];
	}
	// Default to MetaMask if no specific wallet detected
	return WALLET_INSTALL_URLS[
		WALLET_TYPES.METAMASK
	];
}

// Get wallet icon (you can replace these with actual icon imports)
export function getWalletIcon(walletType) {
	const iconMap = {
		[WALLET_TYPES.METAMASK]: "🦊",
		[WALLET_TYPES.TRUST_WALLET]: "🛡️",
		[WALLET_TYPES.EXODUS]: "📱",
		[WALLET_TYPES.BRAVE]: "🦁",
		[WALLET_TYPES.COINBASE]: "🪙",
		[WALLET_TYPES.PHANTOM]: "👻",
		[WALLET_TYPES.UNKNOWN]: "💳",
	};
	return (
		iconMap[walletType] ||
		iconMap[WALLET_TYPES.UNKNOWN]
	);
}

// Validate if the wallet supports required features
export async function validateWalletSupport(
	ethereumProvider
) {
	try {
		// Check if provider supports basic Ethereum methods
		if (!ethereumProvider.request) {
			throw new Error(
				"Provider does not support request method"
			);
		}

		return true;
	} catch (error) {
		console.error(
			"Wallet validation failed:",
			error
		);
		return false;
	}
}
