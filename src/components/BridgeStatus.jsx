import {
	Paper,
	Stack,
	Group,
	Text,
	Badge,
	Button,
	Code,
	Alert,
} from "@mantine/core";
import {
	IconClock,
	IconCheck,
	IconX,
	IconExternalLink,
	IconCopy,
} from "@tabler/icons-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

export function BridgeStatus({ status }) {
	const [copied, setCopied] = useState(false);

	const copyToClipboard = async (text) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			notifications.show({
				title: "Copied!",
				message:
					"Transaction hash copied to clipboard",
				color: "green",
			});
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "pending":
				return "yellow";
			case "completed":
				return "green";
			case "failed":
				return "red";
			default:
				return "gray";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "pending":
				return <IconClock size="1rem" />;
			case "completed":
				return <IconCheck size="1rem" />;
			case "failed":
				return <IconX size="1rem" />;
			default:
				return null;
		}
	};

	const getStatusText = (status) => {
		switch (status) {
			case "pending":
				return "Transfer in Progress";
			case "completed":
				return "Transfer Completed";
			case "failed":
				return "Transfer Failed";
			default:
				return "Unknown Status";
		}
	};

	return (
		<Paper
			p="md"
			withBorder
		>
			<Stack gap="md">
				{/* Status Header */}
				<Group justify="space-between">
					<Group>
						{getStatusIcon(status.status)}
						<Text fw={500}>
							{getStatusText(status.status)}
						</Text>
						<Badge
							color={getStatusColor(
								status.status
							)}
							variant="light"
						>
							{status.status.toUpperCase()}
						</Badge>
					</Group>
				</Group>

				{/* Transfer Details */}
				<Stack gap="xs">
					<Group gap="xs">
						<Text
							size="sm"
							c="dimmed"
						>
							Amount:
						</Text>
						<Text
							size="sm"
							fw={500}
						>
							{status.amount} {status.sourceToken}
						</Text>
					</Group>

					<Group gap="xs">
						<Text
							size="sm"
							c="dimmed"
						>
							To:
						</Text>
						<Text
							size="sm"
							fw={500}
						>
							{status.destinationToken} on Tron
						</Text>
					</Group>

					<Group gap="xs">
						<Text
							size="sm"
							c="dimmed"
						>
							Destination:
						</Text>
						<Code size="xs">
							{status.destinationAddress}
						</Code>
					</Group>
				</Stack>

				{/* Transaction Hash */}
				{status.txHash && (
					<Stack gap="xs">
						<Text
							size="sm"
							fw={500}
						>
							Transaction Hash:
						</Text>
						<Stack gap="xs">
							<Code
								size="xs"
								style={{
									wordBreak: "break-all",
									overflowWrap: "break-word",
									maxWidth: "100%",
									whiteSpace: "normal",
								}}
							>
								{status.txHash}
							</Code>
							<Group gap="xs">
								<Button
									variant="light"
									size="xs"
									onClick={() =>
										copyToClipboard(status.txHash)
									}
									leftSection={
										<IconCopy size="0.8rem" />
									}
								>
									{copied ? "Copied!" : "Copy"}
								</Button>
								<Button
									variant="light"
									size="xs"
									onClick={() =>
										window.open(
											`https://etherscan.io/tx/${status.txHash}`,
											"_blank"
										)
									}
									leftSection={
										<IconExternalLink size="0.8rem" />
									}
								>
									View
								</Button>
							</Group>
						</Stack>
					</Stack>
				)}

				{status.status === "completed" && (
					<Alert
						icon={<IconCheck size="1rem" />}
						title="Transfer Completed"
						color="green"
						variant="light"
					>
						<Text size="sm">
							Your tokens have been successfully
							transferred to Tron. You should see
							them in your Tron wallet shortly.
						</Text>
					</Alert>
				)}

				{status.status === "failed" && (
					<Alert
						icon={<IconX size="1rem" />}
						title="Transfer Failed"
						color="red"
						variant="light"
					>
						<Text size="sm">
							The transfer failed. Please check
							the transaction details and try
							again. If the problem persists,
							contact support.
						</Text>
					</Alert>
				)}
			</Stack>
		</Paper>
	);
}
