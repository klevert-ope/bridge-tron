import { useState, useEffect } from "react";
import { AllbridgeCoreSdk } from "@allbridge/bridge-core-sdk";

export function useBridgeSDK(provider = null) {
	const [sdk, setSdk] = useState(null);
	const [isLoading, setIsLoading] =
		useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function initializeSDK() {
			try {
				setIsLoading(true);
				setError(null);

				// Use reliable RPC endpoints with fallbacks
				const nodeUrls = {
					ETH: "https://eth.llamarpc.com", // Primary - more reliable
					TRX: "https://api.trongrid.io",
					BSC: "https://bsc-dataseed1.binance.org/",
					POL: "https://polygon-rpc.com",
					SOL: "https://api.mainnet-beta.solana.com",
					AVAX: "https://avalanche.public-rpc.com",
					ARB: "https://arb1.arbitrum.io/rpc",
					OP: "https://mainnet.optimism.io",
					FTM: "https://rpc.ftm.tools/",
					CELO: "https://forno.celo.org",
				};

				const bridgeSDK = new AllbridgeCoreSdk(
					nodeUrls
				);

				// Set the provider if available
				if (provider) {
					// Try multiple approaches to set the provider
					try {
						// Method 1: Try setting provider directly
						if (bridgeSDK.setProvider) {
							await bridgeSDK.setProvider(
								provider
							);
						}
					} catch {
						// Method 2: Try setting provider for specific chain
						try {
							if (bridgeSDK.setChainProvider) {
								await bridgeSDK.setChainProvider(
									"ETH",
									provider
								);
							}
						} catch {
							// Method 3: Try setting provider on bridge service
							if (
								bridgeSDK.bridge &&
								bridgeSDK.bridge.setProvider
							) {
								await bridgeSDK.bridge.setProvider(
									provider
								);
							}
						}

						// Method 4: Try setting provider on the chain service directly
						try {
							if (
								bridgeSDK.service &&
								bridgeSDK.service.setProvider
							) {
								await bridgeSDK.service.setProvider(
									"ETH",
									provider
								);
							}
						} catch {
							// Provider setting failed, continue without it
						}
					}
				}

				setSdk(bridgeSDK);
			} catch (err) {
				console.error(
					"Failed to initialize bridge SDK:",
					err
				);
				setError(err);
			} finally {
				setIsLoading(false);
			}
		}

		initializeSDK();
	}, [provider]);

	return { sdk, isLoading, error };
}
