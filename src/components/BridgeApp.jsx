import { useState, useEffect } from "react";
import {
	Container,
	Paper,
	Title,
	Text,
	Group,
	Stack,
	Alert,
	Loader,
	Box,
	Center,
	ThemeIcon,
	useMantineTheme,
} from "@mantine/core";
import {
	IconAlertCircle,
	IconWallet,
} from "@tabler/icons-react";
import { WalletConnector } from "./WalletConnector";
import { BridgeForm } from "./BridgeForm";
import { BridgeStatus } from "./BridgeStatus";
import { useWallet } from "../hooks/useWallet";
import { useBridgeSDK } from "../hooks/useBridgeSDK";

export function BridgeApp() {
	const theme = useMantineTheme();
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
			<Box
				style={{
					background:
						"linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
				}}
			>
				<Center h="100%">
					<Paper
						p="xl"
						radius="lg"
						withBorder
						style={{
							backgroundColor:
								"rgba(17, 17, 17, 0.8)",
							borderColor: theme.colors.teal[7],
							backdropFilter: "blur(10px)",
						}}
					>
						<Group justify="center">
							<Loader
								size="lg"
								color={theme.colors.teal[5]}
							/>
							<Text style={{ color: "#ffffff" }}>
								Initializing bridge SDK...
							</Text>
						</Group>
					</Paper>
				</Center>
			</Box>
		);
	}

	if (sdkError) {
		return (
			<Box
				h="100vh"
				w="100%"
				style={{
					background:
						"linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
				}}
			>
				<Center h="100%">
					<Alert
						icon={
							<IconAlertCircle size="1.5rem" />
						}
						title="SDK Error"
						color="red"
						variant="filled"
						radius="lg"
						style={{
							backgroundColor:
								"rgba(120, 0, 0, 0.8)",
							border: "1px solid #ff4444",
							color: "#ffffff",
							maxWidth: "500px",
							backdropFilter: "blur(10px)",
						}}
					>
						Failed to initialize bridge SDK:{" "}
						{sdkError.message}
					</Alert>
				</Center>
			</Box>
		);
	}

	return (
		<Box
			h="100vh"
			w="100%"
			style={{
				background:
					"linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
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
							<Paper
								p="xl"
								radius="lg"
								withBorder
								style={{
									backgroundColor:
										"rgba(17, 17, 17, 0.8)",
									borderColor: "#333333",
									color: "#ffffff",
									backdropFilter: "blur(10px)",
								}}
							>
								<Stack
									gap="md"
									align="center"
								>
									<ThemeIcon
										size="xl"
										radius="xl"
										variant="light"
										color="gray"
										style={{
											backgroundColor:
												"rgba(100, 100, 100, 0.3)",
										}}
									>
										<IconWallet size="3rem" />
									</ThemeIcon>
									<Title
										order={2}
										ta="center"
										style={{ color: "#ffffff" }}
									>
										Connect Your Wallet
									</Title>
									<Text
										style={{ color: "#ffffff" }}
										ta="center"
									>
										Please connect your wallet to
										start bridging tokens
									</Text>
								</Stack>
							</Paper>
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
