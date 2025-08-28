import { useState, useEffect } from "react";
import {
	Container,
	Title,
	Stack,
	Box,
} from "@mantine/core";
import { WalletConnector } from "./WalletConnector";
import { BridgeForm } from "./BridgeForm";
import { BridgeStatus } from "./BridgeStatus";
import { useWallet } from "../hooks/useWallet";
import { useBridgeSDK } from "../hooks/useBridgeSDK";
import {
	UnifiedLoadingState,
	ErrorState,
	WalletConnectionState,
} from "./LoadingStates";

export function BridgeApp() {
	const {
		account,
		network,
		error,
		connect,
		disconnect,
		isConnecting,
		isTrustWalletInstalled,
		isWeb3WalletInstalled,
		walletType,
		walletName,
	} = useWallet();
	const {
		sdk,
		isLoading: sdkLoading,
		error: sdkError,
	} = useBridgeSDK();
	const [transferStatus, setTransferStatus] =
		useState(null);

	// Reset transfer status when account changes
	useEffect(() => {
		setTransferStatus(null);
	}, [account]);

	if (sdkLoading) {
		return (
			<UnifiedLoadingState
				message="Initializing bridge SDK..."
				color="#00ff88"
			/>
		);
	}

	if (sdkError) {
		return (
			<ErrorState
				title="SDK Error"
				message={`Failed to initialize bridge SDK: ${sdkError.message}`}
				onRetry={() => window.location.reload()}
			/>
		);
	}

	return (
		<Box
			mih="100vh"
			w="100%"
			style={{
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Wallet Connector - Top Right */}
			<Box
				pos="absolute"
				top="1.5rem"
				right="1.5rem"
				style={{ zIndex: 100 }}
			>
				<WalletConnector
					account={account}
					network={network}
					error={error}
					onConnect={connect}
					onDisconnect={disconnect}
					isConnecting={isConnecting}
					isTrustWalletInstalled={
						isTrustWalletInstalled
					}
					isWeb3WalletInstalled={
						isWeb3WalletInstalled
					}
					walletType={walletType}
					walletName={walletName}
				/>
			</Box>

			{/* Fixed Header */}
			<Box
				pt="5rem"
				pb="1rem"
				px="md"
				style={{ flexShrink: 0 }}
			>
				<Title
					order={1}
					align="center"
					style={{
						color: "#ffffff",
						background:
							"linear-gradient(45deg, #00ff88, #00ccff)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
					}}
				>
					BRIDGE TRON
				</Title>
			</Box>

			{/* Scrollable Content */}
			<Box
				style={{
					flex: 1,
					overflow: "auto",
					padding: "0 1rem 1rem 1rem",
				}}
			>
				<Container
					size="sm"
					w="100%"
					maw={500}
					mx="auto"
					px="md"
				>
					<Stack
						gap="xl"
						w="100%"
					>
						{/* Bridge Form */}
						{account ? (
							<BridgeForm
								sdk={sdk}
								account={account}
								onTransferStatus={
									setTransferStatus
								}
							/>
						) : (
							<WalletConnectionState />
						)}

						{/* Transfer Status */}
						{transferStatus && (
							<BridgeStatus
								status={transferStatus}
								onClose={() =>
									setTransferStatus(null)
								}
							/>
						)}
					</Stack>
				</Container>
			</Box>
		</Box>
	);
}
