import {
	Button,
	Group,
	Text,
	Alert,
	Code,
	Stack,
	Badge,
	Modal,
	ActionIcon,
	Tooltip,
	SimpleGrid,
} from "@mantine/core";
import {
	IconWallet,
	IconPlug,
	IconPlugOff,
	IconAlertCircle,
	IconUser,
	IconExternalLink,
} from "@tabler/icons-react";
import { useState } from "react";
import {
	getWalletIcon,
	WALLET_INSTALL_URLS,
	WALLET_TYPES,
} from "../utils/walletDetection.js";

export function WalletConnector({
	account,
	network,
	error,
	onConnect,
	onDisconnect,
	isConnecting,
	isTrustWalletInstalled,
	isWeb3WalletInstalled,
	walletName,
}) {
	const [modalOpened, setModalOpened] =
		useState(false);

	// Minimal button for top right
	if (account) {
		return (
			<>
				<Tooltip label="Wallet Settings">
					<ActionIcon
						variant="light"
						size="lg"
						style={{
							backgroundColor: "#00ff88",
							color: "#000000",
							borderColor: "#00ff88",
						}}
						onClick={() => setModalOpened(true)}
					>
						<IconUser size="1.2rem" />
					</ActionIcon>
				</Tooltip>

				<Modal
					opened={modalOpened}
					onClose={() => setModalOpened(false)}
					title="Wallet Connected"
					size="sm"
					styles={{
						header: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						content: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						body: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						title: {
							color: "#ffffff",
						},
					}}
				>
					<Stack gap="md">
						<Group>
							<IconWallet
								size="1.5rem"
								style={{ color: "#00ff88" }}
							/>
							<Text
								fw={500}
								style={{ color: "#ffffff" }}
							>
								Connected
							</Text>
							<Badge
								color="green"
								variant="light"
								style={{
									backgroundColor: "#00ff88",
									color: "#000000",
								}}
							>
								{walletName || "Web3 Wallet"}
							</Badge>
							{network && (
								<Badge
									color="blue"
									variant="light"
									style={{
										backgroundColor: "#0088ff",
										color: "#ffffff",
									}}
								>
									{network}
								</Badge>
							)}
						</Group>
						<Code
							block
							style={{
								backgroundColor: "#222222",
								color: "#00ff88",
								borderColor: "#444444",
							}}
						>
							{account}
						</Code>

						<Button
							variant="light"
							color="red"
							leftSection={
								<IconPlugOff size="1rem" />
							}
							onClick={() => {
								onDisconnect();
								setModalOpened(false);
							}}
							style={{
								backgroundColor: "#ff4444",
								color: "#ffffff",
								borderColor: "#ff4444",
							}}
						>
							Disconnect
						</Button>
					</Stack>
				</Modal>
			</>
		);
	}

	// Show error in modal if there is one
	if (error) {
		return (
			<>
				<Tooltip label="Connection Error">
					<ActionIcon
						variant="light"
						size="lg"
						style={{
							backgroundColor: "#ff4444",
							color: "#ffffff",
							borderColor: "#ff4444",
						}}
						onClick={() => setModalOpened(true)}
					>
						<IconAlertCircle size="1.2rem" />
					</ActionIcon>
				</Tooltip>

				<Modal
					opened={modalOpened}
					onClose={() => setModalOpened(false)}
					title="Connection Error"
					size="sm"
					styles={{
						header: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						content: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						body: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						title: {
							color: "#ffffff",
						},
					}}
				>
					<Stack gap="md">
						<Alert
							icon={
								<IconAlertCircle size="1rem" />
							}
							title="Connection Error"
							color="red"
							variant="light"
							style={{
								backgroundColor: "#1a0000",
								borderColor: "#ff4444",
								color: "#ffffff",
							}}
						>
							<Text
								size="sm"
								style={{ color: "#ffffff" }}
							>
								{error}
							</Text>
						</Alert>
						<Button
							variant="light"
							onClick={() => {
								onConnect();
								setModalOpened(false);
							}}
							loading={isConnecting}
							style={{
								backgroundColor: "#00ff88",
								color: "#000000",
								borderColor: "#00ff88",
							}}
						>
							Try Again
						</Button>
					</Stack>
				</Modal>
			</>
		);
	}

	// No wallet installed
	if (
		!isTrustWalletInstalled &&
		!isWeb3WalletInstalled
	) {
		return (
			<>
				<Tooltip label="Install Wallet">
					<ActionIcon
						variant="light"
						size="lg"
						style={{
							backgroundColor: "#ff8800",
							color: "#ffffff",
							borderColor: "#ff8800",
						}}
						onClick={() => setModalOpened(true)}
					>
						<IconWallet size="1.2rem" />
					</ActionIcon>
				</Tooltip>

				<Modal
					opened={modalOpened}
					onClose={() => setModalOpened(false)}
					title="Wallet Required"
					size="sm"
					styles={{
						header: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						content: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						body: {
							backgroundColor: "#111111",
							color: "#ffffff",
						},
						title: {
							color: "#ffffff",
						},
					}}
				>
					<Stack gap="md">
						<Alert
							icon={<IconWallet size="1rem" />}
							title="Wallet Required"
							color="blue"
							variant="light"
							style={{
								backgroundColor: "#001a1a",
								borderColor: "#0088ff",
								color: "#ffffff",
							}}
						>
							<Text
								size="sm"
								style={{ color: "#ffffff" }}
							>
								Please install a Web3 wallet to
								use this bridge application. We
								recommend MetaMask:
							</Text>
						</Alert>

						<Button
							variant="light"
							onClick={() =>
								window.open(
									WALLET_INSTALL_URLS[
										WALLET_TYPES.METAMASK
									],
									"_blank"
								)
							}
							leftSection={
								<span>
									{getWalletIcon(
										WALLET_TYPES.METAMASK
									)}
								</span>
							}
							size="lg"
							style={{
								backgroundColor: "#00ff88",
								color: "#000000",
								borderColor: "#00ff88",
							}}
						>
							Install MetaMask
						</Button>
					</Stack>
				</Modal>
			</>
		);
	}

	// Connect button
	return (
		<>
			<Tooltip label="Connect Wallet">
				<ActionIcon
					variant="light"
					size="lg"
					style={{
						backgroundColor: "#0088ff",
						color: "#ffffff",
						borderColor: "#0088ff",
					}}
					onClick={() => setModalOpened(true)}
				>
					<IconPlug size="1.2rem" />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				title="Connect Wallet"
				size="sm"
				styles={{
					header: {
						backgroundColor: "#111111",
						color: "#ffffff",
					},
					content: {
						backgroundColor: "#111111",
						color: "#ffffff",
					},
					body: {
						backgroundColor: "#111111",
						color: "#ffffff",
					},
					title: {
						color: "#ffffff",
					},
				}}
			>
				<Stack gap="md">
					<Text
						size="sm"
						style={{ color: "#ffffff" }}
					>
						Connect your{" "}
						{walletName || "Web3 wallet"} to start
						bridging tokens
					</Text>
					<Button
						leftSection={<IconPlug size="1rem" />}
						onClick={() => {
							onConnect();
							setModalOpened(false);
						}}
						loading={isConnecting}
						size="lg"
						style={{
							backgroundColor: "#00ff88",
							color: "#000000",
							borderColor: "#00ff88",
						}}
					>
						{isConnecting
							? "Connecting..."
							: `Connect ${
									walletName || "Wallet"
							  }`}
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
