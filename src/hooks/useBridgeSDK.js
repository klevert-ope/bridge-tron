import { useState, useEffect } from "react";
import {
	AllbridgeCoreSdk,
	nodeRpcUrlsDefault,
} from "@allbridge/bridge-core-sdk";

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

				const bridgeSDK = new AllbridgeCoreSdk({
					...nodeRpcUrlsDefault,
					ETH: "https://eth.llamarpc.com",
					TRX: "https://api.trongrid.io",
				});

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
	}, []);

	return { sdk, isLoading, error };
}
