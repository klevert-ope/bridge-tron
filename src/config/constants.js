// Application constants and configuration

export const APP_CONFIG = {
	NAME: "Bridge USDC/USDT to Tron",
	VERSION: "1.0.0",
	DESCRIPTION:
		"Bridge your stablecoins from Ethereum to Tron using Allbridge Core",
};

// Supported tokens configuration
export const SUPPORTED_TOKENS = {
	SOURCE: ["USDC", "USDT"], // Ethereum tokens
	DESTINATION: ["USDT"], // Tron tokens
};

// Network configuration
export const NETWORKS = {
	SOURCE: "ETH", // Ethereum
	DESTINATION: "TRX", // Tron
};

// UI constants
export const UI_CONSTANTS = {
	MAX_AMOUNT_DECIMALS: 6,
	ADDRESS_SHORTEN_LENGTH: 6,
	ESTIMATED_TRANSFER_TIME: 10, // minutes
	APPROVAL_WAIT_TIME: 5000, // milliseconds
};

// Error messages
export const ERROR_MESSAGES = {
	TRUST_WALLET_NOT_INSTALLED:
		"Please install Trust Wallet to use this bridge!",
	WALLET_CONNECTION_FAILED:
		"Failed to connect wallet",
	INSUFFICIENT_BALANCE: "Insufficient balance",
	INVALID_TRON_ADDRESS:
		"Please enter a valid Tron address",
	TRANSACTION_FAILED: "Transaction failed",
	APPROVAL_FAILED: "Approval failed",
	SDK_INITIALIZATION_FAILED:
		"Failed to initialize bridge SDK",
};

// Success messages
export const SUCCESS_MESSAGES = {
	WALLET_CONNECTED:
		"Wallet connected successfully",
	APPROVAL_SUCCESSFUL:
		"Token approval successful",
	TRANSFER_INITIATED:
		"Transfer initiated successfully",
	COPIED_TO_CLIPBOARD: "Copied to clipboard",
};

// Links
export const LINKS = {
	TRUST_WALLET_DOWNLOAD:
		"https://trustwallet.com/browser-extension",
	ALLBRIDGE_DOCS:
		"https://docs-core.allbridge.io/",
	ALLBRIDGE_SDK:
		"https://bridge-core-sdk.web.app/index.html",
	ETHERSCAN: "https://etherscan.io",
	TRONSCAN: "https://tronscan.org",
};

// Transfer status
export const TRANSFER_STATUS = {
	PENDING: "pending",
	COMPLETED: "completed",
	FAILED: "failed",
	CANCELLED: "cancelled",
};

// Validation patterns
export const VALIDATION_PATTERNS = {
	TRON_ADDRESS: /^T[A-Za-z1-9]{33}$/,
	ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
	AMOUNT: /^\d+(\.\d+)?$/,
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
	DURATION: 5000, // 5 seconds
	POSITION: "top-right",
};
