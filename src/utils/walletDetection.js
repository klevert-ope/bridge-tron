// Wallet detection and management utilities
export const WALLET_TYPES = {
	METAMASK: "metamask",
	TRUST_WALLET: "trustwallet",
	EXODUS: "exodus",
	BRAVE: "brave",
	COINBASE: "coinbase",
	PHANTOM: "phantom",
	TRONLINK: "tronlink",
	TRONWALLET: "tronwallet",
	UNKNOWN: "unknown",
};

export const WALLET_NAMES = {
	[WALLET_TYPES.METAMASK]: "MetaMask",
	[WALLET_TYPES.TRUST_WALLET]: "Trust Wallet",
	[WALLET_TYPES.EXODUS]: "Exodus",
	[WALLET_TYPES.BRAVE]: "Brave Wallet",
	[WALLET_TYPES.COINBASE]: "Coinbase Wallet",
	[WALLET_TYPES.PHANTOM]: "Phantom",
	[WALLET_TYPES.TRONLINK]: "TronLink",
	[WALLET_TYPES.TRONWALLET]: "TronWallet",
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

	// Enhanced detection with better priority order and additional checks

	// 1. Check for Phantom (most specific)
	if (ethereum.isPhantom) {
		return WALLET_TYPES.PHANTOM;
	}

	// 2. Check for Exodus
	if (ethereum.isExodus) {
		return WALLET_TYPES.EXODUS;
	}

	// 3. Check for Trust Wallet (multiple detection methods)
	if (
		ethereum.isTrust ||
		ethereum.trust ||
		ethereum.isTrustWallet
	) {
		return WALLET_TYPES.TRUST_WALLET;
	}

	// 4. Check for Brave Wallet (which also has isMetaMask = true)
	if (ethereum.isBraveWallet) {
		return WALLET_TYPES.BRAVE;
	}

	// 5. Check for Coinbase Wallet (which also has isMetaMask = true)
	if (ethereum.isCoinbaseWallet) {
		return WALLET_TYPES.COINBASE;
	}

	// 6. Check for MetaMask (after checking other wallets that also set isMetaMask)
	if (ethereum.isMetaMask) {
		// Additional checks for wallets that might set isMetaMask = true
		if (navigator.userAgent.includes("Brave")) {
			return WALLET_TYPES.BRAVE;
		}

		// Check for Trust Wallet by additional properties (prioritize Trust Wallet over MetaMask)
		if (
			ethereum.isTrust ||
			ethereum.trust ||
			ethereum.isTrustWallet
		) {
			return WALLET_TYPES.TRUST_WALLET;
		}

		// Check for Coinbase Wallet by additional properties
		if (
			ethereum.providers &&
			ethereum.providers.length > 0
		) {
			const coinbaseProvider =
				ethereum.providers.find(
					(p) => p.isCoinbaseWallet
				);
			if (coinbaseProvider) {
				return WALLET_TYPES.COINBASE;
			}
		}

		return WALLET_TYPES.METAMASK;
	}

	// 7. Check for multiple providers (some wallets inject multiple providers)
	if (
		ethereum.providers &&
		ethereum.providers.length > 0
	) {
		// Find the first active provider
		for (const provider of ethereum.providers) {
			// Check for Trust Wallet first in providers
			if (
				provider.isTrust ||
				provider.trust ||
				provider.isTrustWallet
			) {
				return WALLET_TYPES.TRUST_WALLET;
			}
			if (provider.isMetaMask) {
				if (provider.isBraveWallet)
					return WALLET_TYPES.BRAVE;
				if (provider.isCoinbaseWallet)
					return WALLET_TYPES.COINBASE;
				if (
					provider.isTrust ||
					provider.trust ||
					provider.isTrustWallet
				)
					return WALLET_TYPES.TRUST_WALLET;
				return WALLET_TYPES.METAMASK;
			}
			if (provider.isPhantom)
				return WALLET_TYPES.PHANTOM;
			if (provider.isExodus)
				return WALLET_TYPES.EXODUS;
		}
	}

	// 8. Fallback for other Web3 wallets
	return WALLET_TYPES.UNKNOWN;
}

// Detect Tron wallet type
export function detectTronWalletType() {
	if (typeof window === "undefined") {
		return null;
	}

	// Check for TronLink
	if (window.tronWeb && window.tronWeb.ready) {
		return WALLET_TYPES.TRONLINK;
	}

	// Check for TronWallet
	if (window.tronWallet) {
		return WALLET_TYPES.TRONWALLET;
	}

	// Check for other Tron wallets that might inject tronWeb
	if (window.tronWeb) {
		return WALLET_TYPES.TRONLINK; // Default to TronLink
	}

	return null;
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

// Get all available wallets (for multiple wallet detection)
export function getAllAvailableWallets() {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	) {
		return [];
	}

	const availableWallets = [];
	const ethereum = window.ethereum;

	// Check for multiple providers
	if (
		ethereum.providers &&
		ethereum.providers.length > 0
	) {
		ethereum.providers.forEach((provider) => {
			if (provider.isMetaMask) {
				if (provider.isBraveWallet) {
					availableWallets.push(
						WALLET_TYPES.BRAVE
					);
				} else if (provider.isCoinbaseWallet) {
					availableWallets.push(
						WALLET_TYPES.COINBASE
					);
				} else if (provider.isTrust) {
					availableWallets.push(
						WALLET_TYPES.TRUST_WALLET
					);
				} else {
					availableWallets.push(
						WALLET_TYPES.METAMASK
					);
				}
			} else if (provider.isPhantom) {
				availableWallets.push(
					WALLET_TYPES.PHANTOM
				);
			} else if (provider.isExodus) {
				availableWallets.push(
					WALLET_TYPES.EXODUS
				);
			}
		});
	} else {
		// Single provider detection
		const walletType = detectWalletType();
		if (walletType) {
			availableWallets.push(walletType);
		}
	}

	// Remove duplicates and return
	return [...new Set(availableWallets)];
}

// Get the best available wallet (prioritized)
export function getBestAvailableWallet() {
	const availableWallets =
		getAllAvailableWallets();

	// Priority order: Trust Wallet first (since user is having issues), then MetaMask, Coinbase, Brave, Exodus, Phantom
	const priorityOrder = [
		WALLET_TYPES.TRUST_WALLET,
		WALLET_TYPES.METAMASK,
		WALLET_TYPES.COINBASE,
		WALLET_TYPES.BRAVE,
		WALLET_TYPES.EXODUS,
		WALLET_TYPES.PHANTOM,
	];

	// Return the first available wallet in priority order
	for (const priorityWallet of priorityOrder) {
		if (
			availableWallets.includes(priorityWallet)
		) {
			return priorityWallet;
		}
	}

	// Return the first available wallet if none match priority
	return availableWallets[0] || null;
}

// Get detected Tron wallet info
export function getDetectedTronWalletInfo() {
	const tronWalletType = detectTronWalletType();
	return {
		type: tronWalletType,
		name: getWalletName(tronWalletType),
		isInstalled: !!tronWalletType,
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

// Enhanced Trust Wallet detection
export function isTrustWalletInstalled() {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	) {
		return false;
	}

	const ethereum = window.ethereum;

	// Check multiple Trust Wallet identifiers
	return !!(
		ethereum.isTrust ||
		ethereum.trust ||
		ethereum.isTrustWallet ||
		(ethereum.providers &&
			ethereum.providers.some(
				(p) =>
					p.isTrust || p.trust || p.isTrustWallet
			))
	);
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
	[WALLET_TYPES.TRONLINK]:
		"https://www.tronlink.org/",
	[WALLET_TYPES.TRONWALLET]:
		"https://www.tronwallet.me/",
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
		[WALLET_TYPES.TRONLINK]: "🔗",
		[WALLET_TYPES.TRONWALLET]: "🔗",
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

// Validate Tron wallet support
export async function validateTronWalletSupport() {
	try {
		if (!window.tronWeb) {
			throw new Error("Tron wallet not found");
		}

		// Check if tronWeb is ready
		if (!window.tronWeb.ready) {
			throw new Error("Tron wallet not ready");
		}

		// Check if we have a default address
		if (
			!window.tronWeb.defaultAddress ||
			!window.tronWeb.defaultAddress.base58
		) {
			throw new Error(
				"Tron wallet not connected"
			);
		}

		return true;
	} catch (error) {
		console.error(
			"Tron wallet validation failed:",
			error
		);
		return false;
	}
}

// Get Tron address from wallet
export async function getTronAddress() {
	try {
		if (
			!window.tronWeb ||
			!window.tronWeb.ready
		) {
			throw new Error(
				"Tron wallet not available"
			);
		}

		const address =
			window.tronWeb.defaultAddress.base58;
		if (!address) {
			throw new Error("No Tron address found");
		}

		return address;
	} catch (error) {
		console.error(
			"Failed to get Tron address:",
			error
		);
		throw error;
	}
}

// Connect to Tron wallet
export async function connectTronWallet() {
	try {
		if (!window.tronWeb) {
			throw new Error(
				"Tron wallet not installed"
			);
		}

		// Check if wallet is ready first
		if (!window.tronWeb.ready) {
			throw new Error(
				"Tron wallet not ready. Please unlock your wallet and try again."
			);
		}

		// Try to get the current address first
		if (
			window.tronWeb.defaultAddress &&
			window.tronWeb.defaultAddress.base58
		) {
			return window.tronWeb.defaultAddress.base58;
		}

		// Request account access if no address is available
		try {
			const address =
				await window.tronWeb.request({
					method: "tron_requestAccounts",
				});

			if (address && address.length > 0) {
				return address[0];
			}
		} catch (requestError) {
			// If request fails, try alternative method
			console.log(
				"Tron request failed, trying alternative method:",
				requestError
			);
		}

		// Alternative: try to get address from tronWeb directly
		if (
			window.tronWeb.defaultAddress &&
			window.tronWeb.defaultAddress.base58
		) {
			return window.tronWeb.defaultAddress.base58;
		}

		throw new Error(
			"No Tron address available. Please unlock your wallet and try again."
		);
	} catch (error) {
		console.error(
			"Failed to connect Tron wallet:",
			error
		);
		throw error;
	}
}

// Check if Tron wallet is installed
export function isTronWalletInstalled() {
	return (
		typeof window !== "undefined" &&
		!!window.tronWeb
	);
}

// Get Tron wallet status
export function getTronWalletStatus() {
	if (!isTronWalletInstalled()) {
		return { installed: false, ready: false };
	}

	return {
		installed: true,
		ready: window.tronWeb.ready || false,
		address:
			window.tronWeb.defaultAddress?.base58 ||
			null,
	};
}

// Get the correct provider for a specific wallet type
export function getProviderForWallet(walletType) {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	) {
		return null;
	}

	const ethereum = window.ethereum;

	// If it's a single provider setup
	if (
		!ethereum.providers ||
		ethereum.providers.length === 0
	) {
		return ethereum;
	}

	// For multi-provider setups, find the correct provider
	switch (walletType) {
		case WALLET_TYPES.TRUST_WALLET:
			return (
				ethereum.providers.find(
					(p) =>
						p.isTrust ||
						p.trust ||
						p.isTrustWallet
				) || ethereum
			);
		case WALLET_TYPES.METAMASK:
			return (
				ethereum.providers.find(
					(p) =>
						p.isMetaMask &&
						!p.isBraveWallet &&
						!p.isCoinbaseWallet &&
						!p.isTrust
				) || ethereum
			);
		case WALLET_TYPES.BRAVE:
			return (
				ethereum.providers.find(
					(p) => p.isBraveWallet
				) || ethereum
			);
		case WALLET_TYPES.COINBASE:
			return (
				ethereum.providers.find(
					(p) => p.isCoinbaseWallet
				) || ethereum
			);
		case WALLET_TYPES.PHANTOM:
			return (
				ethereum.providers.find(
					(p) => p.isPhantom
				) || ethereum
			);
		case WALLET_TYPES.EXODUS:
			return (
				ethereum.providers.find(
					(p) => p.isExodus
				) || ethereum
			);
		default:
			return ethereum;
	}
}
