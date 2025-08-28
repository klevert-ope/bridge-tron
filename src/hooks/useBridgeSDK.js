import { useState, useEffect } from "react";
import {
	AllbridgeCoreSdk,
	nodeRpcUrlsDefault,
} from "@allbridge/bridge-core-sdk";

// SDK Security Configuration
const SDK_SECURITY_CONFIG = {
	ALLOWED_RPC_ENDPOINTS: {
		ETH: [
			"https://eth.llamarpc.com",
			"https://ethereum.publicnode.com",
			"https://rpc.ankr.com/eth",
			"https://cloudflare-eth.com",
			"https://rpc.builder0x69.io",
		],
		TRX: [
			"https://api.trongrid.io",
			"https://api.nileex.io",
			"https://nile.trongrid.io",
		],
	},
};

// SDK Validation
const validateSDK = () => {
	try {
		// Check if SDK constructor exists and is callable
		if (typeof AllbridgeCoreSdk !== "function") {
			throw new Error(
				"SDK constructor not available"
			);
		}

		// Check if SDK has expected methods by creating a test instance
		const testSdk = new AllbridgeCoreSdk({
			...nodeRpcUrlsDefault,
			ETH: "https://eth.llamarpc.com",
			TRX: "https://api.trongrid.io",
		});

		// Validate that SDK has required methods
		const requiredMethods = [
			"chainDetailsMap",
			"getAmountToBeReceived",
			"getGasFeeOptions",
			"getAverageTransferTime",
			"bridge",
		];

		for (const method of requiredMethods) {
			if (
				typeof testSdk[method] !== "function" &&
				typeof testSdk[method] !== "object"
			) {
				throw new Error(
					`SDK missing required method: ${method}`
				);
			}
		}

		// Check bridge methods specifically
		if (
			!testSdk.bridge ||
			typeof testSdk.bridge.rawTxBuilder !==
				"object"
		) {
			throw new Error(
				"SDK bridge functionality not available"
			);
		}

		return true;
	} catch (error) {
		console.error(
			"SDK validation failed:",
			error
		);
		throw error;
	}
};

// RPC Endpoint Validation
const validateRpcEndpoint = async (
	url,
	chain
) => {
	try {
		const allowedEndpoints =
			SDK_SECURITY_CONFIG.ALLOWED_RPC_ENDPOINTS[
				chain
			];
		if (!allowedEndpoints.includes(url)) {
			throw new Error(
				`Unauthorized RPC endpoint for ${chain}: ${url}`
			);
		}

		// Basic connectivity test with different methods for different chains
		let response;

		if (chain === "ETH") {
			// Ethereum RPC endpoints use JSON-RPC
			response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					method: "eth_blockNumber",
					params: [],
					id: 1,
				}),
				signal: AbortSignal.timeout(5000), // 5 second timeout
			});
		} else if (chain === "TRX") {
			// Tron endpoints use REST API
			response = await fetch(
				`${url}/wallet/getnowblock`,
				{
					method: "GET",
					headers: {
						Accept: "application/json",
					},
					signal: AbortSignal.timeout(5000), // 5 second timeout
				}
			);
		}

		if (!response.ok) {
			throw new Error(
				`RPC endpoint ${url} is not responding (${response.status})`
			);
		}

		const data = await response.json();

		// Check for errors in response
		if (data.error) {
			throw new Error(
				`RPC endpoint ${url} returned error: ${data.error.message}`
			);
		}

		// Validate response structure
		if (chain === "ETH" && !data.result) {
			throw new Error(
				`Invalid Ethereum RPC response from ${url}`
			);
		}

		if (chain === "TRX" && !data.block_header) {
			throw new Error(
				`Invalid Tron API response from ${url}`
			);
		}

		return true;
	} catch (error) {
		console.error(
			`RPC endpoint validation failed for ${url}:`,
			error
		);
		throw error;
	}
};

export function useBridgeSDK() {
	const [sdk, setSdk] = useState(null);
	const [isLoading, setIsLoading] =
		useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function initializeSDK() {
			try {
				setIsLoading(true);
				setError(null);

				// Validate SDK functionality first
				validateSDK();

				// Validate and select reliable RPC endpoints
				const ethEndpoints =
					SDK_SECURITY_CONFIG
						.ALLOWED_RPC_ENDPOINTS.ETH;
				const trxEndpoints =
					SDK_SECURITY_CONFIG
						.ALLOWED_RPC_ENDPOINTS.TRX;

				let ethEndpoint = null;
				let trxEndpoint = null;

				// Try to find working Ethereum endpoint
				for (const endpoint of ethEndpoints) {
					try {
						await validateRpcEndpoint(
							endpoint,
							"ETH"
						);
						ethEndpoint = endpoint;
						break;
					} catch (error) {
						console.warn(
							`Ethereum endpoint ${endpoint} failed:`,
							error.message
						);
						continue;
					}
				}

				// Try to find working Tron endpoint
				for (const endpoint of trxEndpoints) {
					try {
						await validateRpcEndpoint(
							endpoint,
							"TRX"
						);
						trxEndpoint = endpoint;
						break;
					} catch (error) {
						console.warn(
							`Tron endpoint ${endpoint} failed:`,
							error.message
						);
						continue;
					}
				}

				// Check if we found working endpoints
				if (!ethEndpoint) {
					throw new Error(
						"No working Ethereum RPC endpoint found"
					);
				}
				if (!trxEndpoint) {
					throw new Error(
						"No working Tron RPC endpoint found"
					);
				}

				const bridgeSDK = new AllbridgeCoreSdk({
					...nodeRpcUrlsDefault,
					ETH: ethEndpoint,
					TRX: trxEndpoint,
				});

				setSdk(bridgeSDK);
			} catch (err) {
				console.error(
					"Failed to initialize bridge SDK:",
					err
				);
				// Sanitize error for user display
				const sanitizedError = new Error(
					"Bridge service initialization failed. Please refresh the page and try again."
				);
				setError(sanitizedError);
			} finally {
				setIsLoading(false);
			}
		}

		initializeSDK();
	}, []);

	return { sdk, isLoading, error };
}
