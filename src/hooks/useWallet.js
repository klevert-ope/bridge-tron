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
	const [walletType, setWalletType] =
		useState(null);

	// -------------------------------
	// Provider getter (uses best wallet)
	// -------------------------------
	const getProvider = useCallback(() => {
		if (
			typeof window === "undefined" ||
			!window.ethereum
		)
			return null;

		const bestWallet = getBestAvailableWallet();
		if (!bestWallet) return window.ethereum;

		setWalletType(bestWallet);
		return getProviderForWallet(bestWallet);
	}, []);

	// -------------------------------
	// Validate Ethereum network (force Mainnet)
	// -------------------------------
	const validateNetwork = async (
		ethereumProvider
	) => {
		try {
			const chainId =
				await ethereumProvider.request({
					method: "eth_chainId",
				});

			if (chainId !== "0x1") {
				try {
					// Try to switch first
					await ethereumProvider.request({
						method: "wallet_switchEthereumChain",
						params: [{ chainId: "0x1" }],
					});
					setNetwork("Ethereum Mainnet");
					return true;
				} catch (switchError) {
					if (switchError.code === 4902) {
						// Try adding Ethereum Mainnet
						try {
							await ethereumProvider.request({
								method: "wallet_addEthereumChain",
								params: [
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
										],
										blockExplorerUrls: [
											"https://etherscan.io",
										],
									},
								],
							});
							setNetwork("Ethereum Mainnet");
							return true;
						} catch {
							throw new Error(
								"Unable to add Ethereum mainnet. Please add it manually."
							);
						}
					} else {
						throw new Error(
							"Please switch to Ethereum mainnet."
						);
					}
				}
			}

			setNetwork("Ethereum Mainnet");
			return true;
		} catch (err) {
			console.error(
				"Network validation failed:",
				err
			);
			setError(
				"Network validation failed: " +
					err.message
			);
			return false;
		}
	};

	// -------------------------------
	// Connect Wallet
	// -------------------------------
	const connect = useCallback(async () => {
		setError(null);
		if (isConnecting) return;

		const ethereumProvider = getProvider();
		if (!ethereumProvider) {
			setError(
				"Please install a Web3 wallet to use this bridge!"
			);
			return;
		}

		setIsConnecting(true);
		try {
			const isWalletValid =
				await validateWalletSupport(
					ethereumProvider
				);
			if (!isWalletValid) {
				setError(
					"This wallet doesn't support the required features."
				);
				return;
			}

			const isNetworkValid =
				await validateNetwork(ethereumProvider);
			if (!isNetworkValid) return;

			// Check existing connection
			const currentAccounts =
				await ethereumProvider.request({
					method: "eth_accounts",
				});
			if (currentAccounts.length > 0) {
				setProvider(
					new ethers.BrowserProvider(
						ethereumProvider
					)
				);
				setAccount(currentAccounts[0]);
				console.log(
					`Already connected to ${getWalletName(
						walletType
					)}`
				);
				return;
			}

			// Request connection
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
				setProvider(
					new ethers.BrowserProvider(
						ethereumProvider
					)
				);
				setAccount(accounts[0]);
				console.log(
					`Connected to ${getWalletName(
						walletType
					)}`
				);
			}
		} catch (err) {
			let msg = err.message;
			if (msg.includes("Already processing"))
				msg =
					"Connection already in progress. Please wait.";
			if (msg.includes("User rejected"))
				msg =
					"Connection rejected. Please approve in your wallet.";
			if (msg.includes("timeout"))
				msg =
					"Connection timed out. Please try again.";

			setError(
				"Failed to connect wallet: " + msg
			);
		} finally {
			setIsConnecting(false);
		}
	}, [isConnecting, getProvider, walletType]);

	// -------------------------------
	// Disconnect
	// -------------------------------
	const disconnect = useCallback(() => {
		setAccount(null);
		setProvider(null);
		setNetwork(null);
		setError(null);
		setWalletType(null);
	}, []);

	// -------------------------------
	// Handle wallet events
	// -------------------------------
	useEffect(() => {
		const ethereumProvider = getProvider();
		if (!ethereumProvider) return;

		const handleAccountsChanged = (accounts) => {
			if (accounts.length === 0) disconnect();
			else if (accounts[0] !== account)
				setAccount(accounts[0]);
		};

		const handleChainChanged = async () => {
			const valid = await validateNetwork(
				ethereumProvider
			);
			if (!valid) disconnect();
			else window.location.reload();
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
	}, [account, disconnect, getProvider]);

	// -------------------------------
	// Auto-connect if already connected
	// -------------------------------
	useEffect(() => {
		const autoConnect = async () => {
			const ethereumProvider = getProvider();
			if (!ethereumProvider) return;

			try {
				const accounts =
					await ethereumProvider.request({
						method: "eth_accounts",
					});
				if (accounts.length > 0) {
					const isNetworkValid =
						await validateNetwork(
							ethereumProvider
						);
					if (!isNetworkValid) return;

					setProvider(
						new ethers.BrowserProvider(
							ethereumProvider
						)
					);
					setAccount(accounts[0]);
				}
			} catch (err) {
				console.log(
					"Auto-connect failed:",
					err.message
				);
			}
		};

		const timer = setTimeout(autoConnect, 100);
		return () => clearTimeout(timer);
	}, [getProvider]);

	// -------------------------------
	// Wallet Info
	// -------------------------------
	const walletInfo = {
		type: walletType,
		name: getWalletName(walletType),
		isInstalled: !!walletType,
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
		isTrustWalletInstalled:
			isTrustWalletInstalled(),
		isWeb3WalletInstalled: isAnyWalletInstalled(),
	};
}
