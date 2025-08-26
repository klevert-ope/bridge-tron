import {
	useState,
	useEffect,
	useCallback,
} from "react";
import { ethers } from "ethers";
import {
	getWalletName,
	getBestAvailableWallet,
	getProviderForWallet,
	isAnyWalletInstalled,
	isTrustWalletInstalled,
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

	// Check if Trust Wallet is installed - using enhanced detection
	const checkTrustWalletInstalled = () => {
		return isTrustWalletInstalled();
	};

	// Check if any Web3 wallet is installed
	const isWeb3WalletInstalled = () => {
		return isAnyWalletInstalled();
	};

	// Get the best available provider and detect wallet type
	const getProvider = () => {
		if (typeof window === "undefined")
			return null;

		if (window.ethereum) {
			// Get the best wallet type and use the correct provider for it
			const bestWallet = getBestAvailableWallet();
			if (bestWallet) {
				const correctProvider =
					getProviderForWallet(bestWallet);
				return correctProvider;
			}
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
				// Try to switch to Ethereum mainnet with multiple RPC options
				const rpcOptions = [
					{
						chainId: "0x1",
						chainName: "Ethereum Mainnet",
						nativeCurrency: {
							name: "Ether",
							symbol: "ETH",
							decimals: 18,
						},
						rpcUrls: [
							"https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
							"https://ethereum.publicnode.com",
							"https://rpc.ankr.com/eth",
							"https://eth-mainnet.g.alchemy.com/v2/demo",
							"https://cloudflare-eth.com",
							"https://api.securerpc.com/v1",
						],
						blockExplorerUrls: [
							"https://etherscan.io",
						],
					},
				];

				// Try to switch first
				try {
					await ethereumProvider.request({
						method: "wallet_switchEthereumChain",
						params: [{ chainId: "0x1" }],
					});
					setNetwork("Ethereum Mainnet");
					return true;
				} catch (switchError) {
					// If switch fails (chain not added), try to add it
					if (switchError.code === 4902) {
						// Try each RPC option until one works
						for (const rpcOption of rpcOptions) {
							try {
								await ethereumProvider.request({
									method:
										"wallet_addEthereumChain",
									params: [rpcOption],
								});
								setNetwork("Ethereum Mainnet");
								console.log(
									"Successfully added Ethereum mainnet with RPC:",
									rpcOption.rpcUrls[0]
								);
								return true;
							} catch (addError) {
								console.log(
									`Failed to add with RPC ${rpcOption.rpcUrls[0]}:`,
									addError.message
								);
								continue; // Try next RPC option
							}
						}

						// If all RPC options fail, throw error
						throw new Error(
							"Unable to add Ethereum mainnet. Please add it manually to your wallet."
						);
					} else {
						throw new Error(
							"Please switch to Ethereum mainnet. Current network is not supported."
						);
					}
				}
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
			// Get the best available wallet
			const bestWallet = getBestAvailableWallet();
			const walletName =
				getWalletName(bestWallet);

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

	const bestWallet = getBestAvailableWallet();
	const walletInfo = {
		type: bestWallet,
		name: getWalletName(bestWallet),
		isInstalled: !!bestWallet,
	};

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
		bestWallet: bestWallet,
		isTrustWalletInstalled:
			checkTrustWalletInstalled(),
		isWeb3WalletInstalled:
			isWeb3WalletInstalled(),
	};
}
