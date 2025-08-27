import {
	Paper,
	Stack,
	Text,
	Group,
	Badge,
	Loader,
} from "@mantine/core";

export function BridgeQuoteDisplay({
	quote,
	isGettingQuote,
	gasFeePaymentMethod,
	destinationTokenSymbol,
}) {
	if (!quote && !isGettingQuote) {
		return null;
	}

	return (
		<Paper
			p="md"
			withBorder
			style={{
				backgroundColor: "#0a1a0a",
				borderColor: "#1a4d1a",
				color: "#ffffff",
			}}
		>
			<Stack gap="xs">
				<Text
					size="sm"
					fw={500}
					style={{ color: "#4dcc4d" }}
				>
					Bridge Quote
				</Text>

				{isGettingQuote && (
					<Group gap="xs">
						<Loader
							size="xs"
							color="#4dcc4d"
						/>
						<Text
							size="xs"
							style={{ color: "#ffffff" }}
						>
							Getting quote...
						</Text>
					</Group>
				)}

				{quote && (
					<>
						<Group gap="xs">
							<Text
								size="xs"
								style={{ color: "#ffffff" }}
							>
								You will receive:
							</Text>
							<Badge
								variant="light"
								color="green"
								size="lg"
								style={{
									backgroundColor: "#2d662d",
									color: "#ffffff",
								}}
							>
								{gasFeePaymentMethod ===
									"stablecoin" &&
								quote.quote?.gasFeeStablecoin
									? (
											parseFloat(
												quote.quote.toAmount
											) -
											parseFloat(
												quote.quote
													.gasFeeStablecoin
											)
									  ).toFixed(6)
									: quote.quote?.toAmount ||
									  "N/A"}{" "}
								{destinationTokenSymbol || "USDT"}
							</Badge>
						</Group>

						{gasFeePaymentMethod ===
							"stablecoin" &&
							quote.quote?.gasFeeStablecoin && (
								<Group gap="xs">
									<Text
										size="xs"
										style={{ color: "#ffffff" }}
									>
										(Original:{" "}
										{quote.quote.toAmount} USDT -
										Fee:{" "}
										{quote.quote.gasFeeStablecoin}{" "}
										USDT)
									</Text>
								</Group>
							)}

						{/* Gas Fee Display */}
						<Group gap="xs">
							<Text
								size="xs"
								style={{ color: "#ffffff" }}
							>
								Gas fee (
								{gasFeePaymentMethod === "native"
									? "ETH"
									: "USDT"}
								):
							</Text>
							<Badge
								variant="light"
								color={
									gasFeePaymentMethod === "native"
										? "orange"
										: "purple"
								}
								style={{
									backgroundColor:
										gasFeePaymentMethod ===
										"native"
											? "#ff8800"
											: "#8800ff",
									color: "#000000",
								}}
							>
								{gasFeePaymentMethod === "native"
									? `${
											quote.quote?.gasFee || "N/A"
									  } ETH`
									: `${
											quote.quote
												?.gasFeeStablecoin ||
											"N/A"
									  } USDT`}
							</Badge>
						</Group>

						{quote.quote?.transferTime && (
							<Group gap="xs">
								<Text
									size="xs"
									style={{ color: "#ffffff" }}
								>
									Estimated time:
								</Text>
								<Badge
									variant="light"
									color="blue"
									style={{
										backgroundColor: "#0088ff",
										color: "#ffffff",
									}}
								>
									{quote.quote.transferTime}
								</Badge>
							</Group>
						)}

						<Group gap="xs">
							<Text
								size="xs"
								style={{ color: "#ffffff" }}
							>
								Route:
							</Text>
							<Badge
								variant="light"
								color="gray"
								style={{
									backgroundColor: "#444444",
									color: "#ffffff",
								}}
							>
								{quote.quote?.route ||
									"Ethereum → Tron"}
							</Badge>
						</Group>
					</>
				)}
			</Stack>
		</Paper>
	);
}
