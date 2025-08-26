import {
	useState,
	useEffect,
	useCallback,
} from "react";
import { ethers } from "ethers";
import {
	detectWalletType,
	getWalletName,
	getDetectedWalletInfo,
	getAllAvailableWallets,
	getBestAvailableWallet,
	isAnyWalletInstalled,
	validateWalletSupport,
	WALLET_TYPES,
} from "../utils/walletDetection.js";

export function useWallet() {
	const [account, setAccount] = useState(null);
	const [isConnecting, setIsConnecting] =
		useState(false);
	const [provider, setProvider] = useState(null);
	const [network, setNetwork] = useState(null);
	const [error, setError] = useState(null);

	// Check if Trust Wallet is installed
	const isTrustWalletInstalled = () => {
		return isWalletInstalled(
			WALLET_TYPES.TRUST_WALLET
		);
	};

	// Check if any Web3 wallet is installed
	const isWeb3WalletInstalled = () => {
		return isAnyWalletInstalled();
	};

	// Check if specific wallet is installed
	const isWalletInstalled = (walletType) => {
		const detectedType = detectWalletType();
		return detectedType === walletType;
	};

	// Get the best available provider and detect wallet type
	const getProvider = () => {
		if (typeof window === "undefined")
			return null;

		if (window.ethereum) {
			return window.ethereum;
		}

		return null;
	};

	// Validate network (ensure we're on Ethereum mainnet)
	const validateNetwork = async (
		ethereumProvider
	) => {
		try {
			const chainId =
				await ethereumProvider.request({
					method: "eth_chainId",
				});

			// Ethereum mainnet chain ID is 0x1
			if (chainId !== "0x1") {
				throw new Error(
					"Please switch to Ethereum mainnet. Current network is not supported."
				);
			}

			setNetwork("Ethereum Mainnet");
			return true;
		} catch (error) {
			console.error(
				"Network validation failed:",
				error
			);
			setError(
				"Network validation failed: " +
					error.message
			);
			return false;
		}
	};

	// Connect to wallet
	const connect = useCallback(async () => {
		// Clear any previous errors
		setError(null);

		// Prevent multiple simultaneous connection attempts
		if (isConnecting) {
			return;
		}

		const ethereumProvider = getProvider();

		if (!ethereumProvider) {
			setError(
				"Please install a Web3 wallet to use this bridge!"
			);
			return;
		}

		setIsConnecting(true);
		try {
			// Get all available wallets and the best one
			const allWallets = getAllAvailableWallets();
			const bestWallet = getBestAvailableWallet();
			const walletName =
				getWalletName(bestWallet);

			console.log(
				`Available wallets: ${allWallets
					.map((w) => getWalletName(w))
					.join(", ")}`
			);
			console.log(
				`Attempting to connect to ${walletName}...`
			);

			// Validate wallet support first
			const isWalletValid =
				await validateWalletSupport(
					ethereumProvider
				);
			if (!isWalletValid) {
				setError(
					"This wallet doesn't support the required features"
				);
				return;
			}

			// Validate network
			const isNetworkValid =
				await validateNetwork(ethereumProvider);
			if (!isNetworkValid) {
				return;
			}

			// Check if already connected first
			const currentAccounts =
				await ethereumProvider.request({
					method: "eth_accounts",
				});

			if (currentAccounts.length > 0) {
				// Already connected, just update state
				const ethersProvider =
					new ethers.BrowserProvider(
						ethereumProvider
					);
				setProvider(ethersProvider);
				setAccount(currentAccounts[0]);
				console.log(
					`Already connected to ${walletName}`
				);
				return;
			}

			// Request account access with timeout
			const accounts = await Promise.race([
				ethereumProvider.request({
					method: "eth_requestAccounts",
				}),
				new Promise((_, reject) =>
					setTimeout(
						() =>
							reject(
								new Error("Connection timeout")
							),
						30000
					)
				),
			]);

			if (accounts.length > 0) {
				const ethersProvider =
					new ethers.BrowserProvider(
						ethereumProvider
					);
				setProvider(ethersProvider);
				setAccount(accounts[0]);
				console.log(
					`Successfully connected to ${walletName}`
				);
			}
		} catch (error) {
			// Handle specific error cases
			let errorMessage = error.message;
			if (
				error.message.includes(
					"Already processing"
				)
			) {
				errorMessage =
					"Connection already in progress. Please wait a moment and try again.";
			} else if (
				error.message.includes("User rejected")
			) {
				errorMessage =
					"Connection was rejected. Please approve the connection in your wallet.";
			} else if (
				error.message.includes("timeout")
			) {
				errorMessage =
					"Connection timed out. Please try again.";
			} else if (
				error.message.includes(
					"Network validation failed"
				)
			) {
				errorMessage = error.message;
			}

			setError(
				"Failed to connect wallet: " +
					errorMessage
			);
		} finally {
			setIsConnecting(false);
		}
	}, [isConnecting]);

	// Disconnect wallet
	const disconnect = useCallback(() => {
		setAccount(null);
		setProvider(null);
		setNetwork(null);
		setError(null);
	}, []);

	// Handle account changes
	useEffect(() => {
		const ethereumProvider = getProvider();
		if (!ethereumProvider) return;

		const handleAccountsChanged = (accounts) => {
			if (accounts.length === 0) {
				// Wallet is locked or the user has no accounts
				disconnect();
			} else if (accounts[0] !== account) {
				setAccount(accounts[0]);
			}
		};

		const handleChainChanged = async () => {
			// Validate the new network
			const isNetworkValid =
				await validateNetwork(ethereumProvider);
			if (!isNetworkValid) {
				disconnect();
				return;
			}

			// Reload the page when chain changes to ensure everything is in sync
			window.location.reload();
		};

		ethereumProvider.on(
			"accountsChanged",
			handleAccountsChanged
		);
		ethereumProvider.on(
			"chainChanged",
			handleChainChanged
		);

		return () => {
			ethereumProvider.removeListener(
				"accountsChanged",
				handleAccountsChanged
			);
			ethereumProvider.removeListener(
				"chainChanged",
				handleChainChanged
			);
		};
	}, [account, disconnect]);

	// Auto-connect if already connected
	useEffect(() => {
		const autoConnect = async () => {
			const ethereumProvider = getProvider();
			if (!ethereumProvider) {
				console.log("No wallet provider found");
				return;
			}

			// Get all available wallets and the best one
			const allWallets = getAllAvailableWallets();
			const bestWallet = getBestAvailableWallet();
			const walletInfo = getDetectedWalletInfo();

			console.log(
				`Available wallets: ${allWallets
					.map((w) => getWalletName(w))
					.join(", ")}`
			);
			console.log(
				`Best wallet: ${getWalletName(
					bestWallet
				)}`
			);
			console.log(
				`Detected wallet: ${walletInfo.name}`
			);

			try {
				// Check if already connected first (faster)
				const accounts =
					await ethereumProvider.request({
						method: "eth_accounts",
					});

				if (accounts.length > 0) {
					// Validate network after finding accounts
					const isNetworkValid =
						await validateNetwork(
							ethereumProvider
						);
					if (!isNetworkValid) {
						return;
					}

					const ethersProvider =
						new ethers.BrowserProvider(
							ethereumProvider
						);
					setProvider(ethersProvider);
					setAccount(accounts[0]);
					console.log(
						`Auto-connected to ${walletInfo.name}`
					);
				} else {
					console.log(
						`Wallet ${walletInfo.name} found but not connected`
					);
				}
			} catch (error) {
				console.log(
					"Auto-connect failed:",
					error.message
				);
			}
		};

		// Add a small delay to ensure wallet is ready
		const timer = setTimeout(autoConnect, 100);
		return () => clearTimeout(timer);
	}, []);

	const walletInfo = getDetectedWalletInfo();
	const allWallets = getAllAvailableWallets();
	const bestWallet = getBestAvailableWallet();

	return {
		account,
		provider,
		network,
		error,
		connect,
		disconnect,
		isConnecting,
		walletType: walletInfo.type,
		walletName: walletInfo.name,
		allAvailableWallets: allWallets,
		bestWallet: bestWallet,
		isTrustWalletInstalled:
			isTrustWalletInstalled(),
		isWeb3WalletInstalled:
			isWeb3WalletInstalled(),
	};
}
