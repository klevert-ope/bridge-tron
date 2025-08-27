import {
	Paper,
	Stack,
	Text,
	Group,
	Badge,
} from "@mantine/core";

export function FeeInformationDisplay({
	gasFee,
}) {
	if (!gasFee) {
		return null;
	}

	return (
		<Paper
			p="md"
			withBorder
			style={{
				backgroundColor: "#1a1a1a",
				borderColor: "#444444",
				color: "#ffffff",
			}}
		>
			<Stack gap="xs">
				<Text
					size="sm"
					fw={500}
					style={{ color: "#ffffff" }}
				>
					Fee Information
				</Text>
				<Group gap="xs">
					<Text
						size="xs"
						style={{ color: "#ffffff" }}
					>
						Gas Fee:
					</Text>
					<Badge
						variant="light"
						color="blue"
						style={{
							backgroundColor: "#0088ff",
							color: "#ffffff",
						}}
					>
						{gasFee.native?.float || "N/A"} ETH
					</Badge>
				</Group>
				{gasFee.stablecoin && (
					<Group gap="xs">
						<Text
							size="xs"
							style={{ color: "#ffffff" }}
						>
							Or pay with:
						</Text>
						<Badge
							variant="light"
							color="green"
							style={{
								backgroundColor: "#2d662d",
								color: "#ffffff",
							}}
						>
							{gasFee.stablecoin.float} USDT
						</Badge>
					</Group>
				)}
			</Stack>
		</Paper>
	);
}
