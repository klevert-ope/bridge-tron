import {
	Box,
	Center,
	Paper,
	Group,
	Text,
	Loader,
	Alert,
	Stack,
	useMantineTheme,
} from "@mantine/core";
import {
	IconAlertCircle,
	IconWallet,
} from "@tabler/icons-react";

// Unified Loading Component
export function UnifiedLoadingState({
	message = "Loading...",
	size = "lg",
	color = "#00ff88",
	showBackground = true,
}) {
	const theme = useMantineTheme();

	const content = (
		<Group
			justify="center"
			gap="md"
		>
			<Loader
				size={size}
				color={color}
			/>
			<Text
				style={{
					color: "#ffffff",
					fontSize: "1.1rem",
				}}
			>
				{message}
			</Text>
		</Group>
	);

	if (showBackground) {
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
					<Paper
						p="xl"
						radius="lg"
						withBorder
						style={{
							backgroundColor:
								"rgba(17, 17, 17, 0.8)",
							borderColor: theme.colors.teal[7],
							backdropFilter: "blur(10px)",
							maxWidth: "400px",
							width: "90%",
						}}
					>
						{content}
					</Paper>
				</Center>
			</Box>
		);
	}

	return (
		<Center py="xl">
			<Paper
				p="lg"
				radius="md"
				withBorder
				style={{
					backgroundColor:
						"rgba(17, 17, 17, 0.8)",
					borderColor: theme.colors.teal[7],
					backdropFilter: "blur(10px)",
					maxWidth: "350px",
					width: "100%",
				}}
			>
				{content}
			</Paper>
		</Center>
	);
}

// Error State Component
export function ErrorState({
	title = "Error",
	message,
	showBackground = true,
	onRetry,
}) {
	const content = (
		<Stack
			gap="md"
			align="center"
		>
			<IconAlertCircle
				size="2rem"
				color="#ff4444"
			/>
			<Text
				fw={600}
				size="lg"
				style={{ color: "#ffffff" }}
			>
				{title}
			</Text>
			<Text
				size="sm"
				style={{
					color: "#cccccc",
					textAlign: "center",
				}}
			>
				{message}
			</Text>
			{onRetry && (
				<Text
					size="sm"
					style={{
						color: "#00ff88",
						cursor: "pointer",
						textDecoration: "underline",
					}}
					onClick={onRetry}
				>
					Click to retry
				</Text>
			)}
		</Stack>
	);

	if (showBackground) {
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
					<Paper
						p="xl"
						radius="lg"
						withBorder
						style={{
							backgroundColor:
								"rgba(120, 0, 0, 0.8)",
							border: "1px solid #ff4444",
							color: "#ffffff",
							maxWidth: "450px",
							width: "90%",
							backdropFilter: "blur(10px)",
						}}
					>
						{content}
					</Paper>
				</Center>
			</Box>
		);
	}

	return (
		<Alert
			icon={<IconAlertCircle size="1rem" />}
			title={title}
			color="red"
			variant="filled"
			radius="md"
			style={{
				backgroundColor: "rgba(120, 0, 0, 0.8)",
				border: "1px solid #ff4444",
				color: "#ffffff",
			}}
		>
			<Text
				size="sm"
				style={{ color: "#ffffff" }}
			>
				{message}
			</Text>
		</Alert>
	);
}

// Wallet Connection State
export function WalletConnectionState() {
	return (
		<Paper
			p="xl"
			radius="lg"
			withBorder
			style={{
				backgroundColor: "rgba(17, 17, 17, 0.8)",
				borderColor: "#333333",
				color: "#ffffff",
				backdropFilter: "blur(10px)",
			}}
		>
			<Stack
				gap="lg"
				align="center"
			>
				<IconWallet
					size="3rem"
					style={{ color: "#666666" }}
				/>
				<Stack
					gap="xs"
					align="center"
				>
					<Text
						fw={600}
						size="lg"
						style={{ color: "#ffffff" }}
					>
						Connect Your Wallet
					</Text>
					<Text
						size="sm"
						style={{
							color: "#cccccc",
							textAlign: "center",
						}}
					>
						Please connect your wallet to start
						bridging tokens
					</Text>
				</Stack>
			</Stack>
		</Paper>
	);
}
