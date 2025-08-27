// ===============================
// Wallet detection and management utilities
// ===============================

// Wallet types
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

// Wallet display names
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

// ==========================================
// Wallet Detection
// ==========================================

// Detect EVM wallet type (MetaMask, Trust, Coinbase, Brave, Exodus, Phantom)
export function detectWalletType() {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	) {
		return null;
	}

	const ethereum = window.ethereum;
	const providers = ethereum.providers || [
		ethereum,
	];

	for (const provider of providers) {
		if (provider.isPhantom)
			return WALLET_TYPES.PHANTOM;
		if (provider.isExodus)
			return WALLET_TYPES.EXODUS;
		if (
			provider.isTrust ||
			provider.trust ||
			provider.isTrustWallet
		)
			return WALLET_TYPES.TRUST_WALLET;
		if (provider.isBraveWallet)
			return WALLET_TYPES.BRAVE;
		if (provider.isCoinbaseWallet)
			return WALLET_TYPES.COINBASE;
		if (provider.isMetaMask)
			return WALLET_TYPES.METAMASK;
	}

	return WALLET_TYPES.UNKNOWN;
}

// ==========================================
// Wallet Info Helpers
// ==========================================

export function getWalletName(walletType) {
	return walletType
		? WALLET_NAMES[walletType] ||
				WALLET_NAMES[WALLET_TYPES.UNKNOWN]
		: WALLET_NAMES[WALLET_TYPES.UNKNOWN];
}

export function getAllAvailableWallets() {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	)
		return [];

	const ethereum = window.ethereum;
	const providers = ethereum.providers || [
		ethereum,
	];

	const detected = providers.map((p) => {
		if (p.isPhantom) return WALLET_TYPES.PHANTOM;
		if (p.isExodus) return WALLET_TYPES.EXODUS;
		if (p.isTrust || p.trust || p.isTrustWallet)
			return WALLET_TYPES.TRUST_WALLET;
		if (p.isBraveWallet)
			return WALLET_TYPES.BRAVE;
		if (p.isCoinbaseWallet)
			return WALLET_TYPES.COINBASE;
		if (p.isMetaMask)
			return WALLET_TYPES.METAMASK;
		return WALLET_TYPES.UNKNOWN;
	});

	return [...new Set(detected)];
}

export function getBestAvailableWallet() {
	const available = getAllAvailableWallets();
	const priority = [
		WALLET_TYPES.TRUST_WALLET,
		WALLET_TYPES.METAMASK,
		WALLET_TYPES.COINBASE,
		WALLET_TYPES.BRAVE,
		WALLET_TYPES.EXODUS,
		WALLET_TYPES.PHANTOM,
	];

	for (const w of priority) {
		if (available.includes(w)) return w;
	}
	return available[0] || null;
}

// ==========================================
// Wallet Installation & Icons
// ==========================================

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

// ==========================================
// Validation & Provider Management
// ==========================================

export async function validateWalletSupport(
	provider
) {
	try {
		if (!provider?.request)
			throw new Error(
				"Provider does not support request method"
			);
		return true;
	} catch (e) {
		console.error("Wallet validation failed:", e);
		return false;
	}
}

export function isAnyWalletInstalled() {
	return (
		typeof window !== "undefined" &&
		!!window.ethereum
	);
}

export function isTrustWalletInstalled() {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	)
		return false;
	const ethereum = window.ethereum;
	return !!(
		ethereum.isTrust ||
		ethereum.trust ||
		ethereum.isTrustWallet ||
		ethereum.providers?.some(
			(p) =>
				p.isTrust || p.trust || p.isTrustWallet
		)
	);
}

// Get the correct provider for a specific wallet type
export function getProviderForWallet(walletType) {
	if (
		typeof window === "undefined" ||
		!window.ethereum
	)
		return null;

	const ethereum = window.ethereum;
	const providers = ethereum.providers || [
		ethereum,
	];

	switch (walletType) {
		case WALLET_TYPES.TRUST_WALLET:
			return (
				providers.find(
					(p) =>
						p.isTrust ||
						p.trust ||
						p.isTrustWallet
				) || ethereum
			);
		case WALLET_TYPES.METAMASK:
			return (
				providers.find(
					(p) =>
						p.isMetaMask &&
						!p.isBraveWallet &&
						!p.isCoinbaseWallet &&
						!p.isTrust
				) || ethereum
			);
		case WALLET_TYPES.BRAVE:
			return (
				providers.find((p) => p.isBraveWallet) ||
				ethereum
			);
		case WALLET_TYPES.COINBASE:
			return (
				providers.find(
					(p) => p.isCoinbaseWallet
				) || ethereum
			);
		case WALLET_TYPES.PHANTOM:
			return (
				providers.find((p) => p.isPhantom) ||
				ethereum
			);
		case WALLET_TYPES.EXODUS:
			return (
				providers.find((p) => p.isExodus) ||
				ethereum
			);
		default:
			return ethereum;
	}
}
