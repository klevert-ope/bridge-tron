import {
	Select,
	NumberInput,
	TextInput,
	Button,
	Group,
	Stack,
	Text,
	Alert,
	Loader,
	Card,
	Radio,
	RadioGroup,
	CheckIcon,
} from "@mantine/core";
import {
	IconAlertCircle,
	IconArrowRight,
	IconWallet,
} from "@tabler/icons-react";
import { FeePaymentMethod } from "@allbridge/bridge-core-sdk";
import { useBridgeForm } from "../hooks/useBridgeForm";
import { BridgeQuoteDisplay } from "./BridgeQuoteDisplay";
import { FeeInformationDisplay } from "./FeeInformationDisplay";
import { validateTronAddress } from "../utils/bridgeUtils.js";

export function BridgeForm({
	sdk,
	account,
	onTransferStatus,
}) {
	const {
		isLoading,
		isLoadingTokens,
		isApproving,
		needsApproval,
		tokens,
		gasFee,
		quote,
		isGettingQuote,
		form,
		handleApproval,
		handleSubmit,
		handlePaymentMethodChange,
	} = useBridgeForm(
		sdk,
		account,
		onTransferStatus
	);

	// Ensure form value is valid
	const currentFormValue =
		form.values.sourceToken;
	const validOptions =
		tokens.source
			?.map((token) => ({
				value:
					token.tokenAddress ||
					token.address ||
					"",
				label: `${token.symbol || ""} - ${
					token.name || ""
				}`,
			}))
			.filter((option) => {
				if (
					!option.value ||
					!option.label ||
					option.value === "" ||
					option.label === ""
				) {
					console.warn("Invalid option:", option);
					return false;
				}
				return true;
			}) || [];

	const hasValidValue =
		currentFormValue &&
		validOptions.some(
			(option) =>
				option.value === currentFormValue
		);

	if (isLoadingTokens) {
		return (
			<Group
				justify="center"
				py="xl"
			>
				<Loader
					size="lg"
					color="#00ff88"
				/>
				<Text style={{ color: "#ffffff" }}>
					Loading available tokens...
				</Text>
			</Group>
		);
	}

	if (
		!tokens.source ||
		tokens.source.length === 0
	) {
		return (
			<Alert
				icon={<IconAlertCircle size="1rem" />}
				title="No Tokens Found"
				color="yellow"
				my="md"
			>
				<Text size="sm">
					No tokens are available for bridging.
					Please check your connection and try
					again.
				</Text>
			</Alert>
		);
	}

	// Check if we have any valid options after filtering
	if (validOptions.length === 0) {
		return (
			<Alert
				icon={<IconAlertCircle size="1rem" />}
				title="No Tokens Available"
				color="yellow"
				my="md"
			>
				<Text size="sm">
					No valid tokens found. Please try
					refreshing the page or check your
					connection.
				</Text>
			</Alert>
		);
	}

	return (
		<Card
			shadow="sm"
			padding="sm"
			radius="md"
			withBorder
			style={{
				backgroundColor: "#111111",
				borderColor: "#333333",
				color: "#ffffff",
			}}
		>
			<Stack gap="lg">
				<form
					onSubmit={form.onSubmit(handleSubmit)}
				>
					<Stack gap="md">
						{/* Source Token Selection */}
						<Select
							label="Source Token (Ethereum)"
							placeholder="Select token to bridge"
							data={validOptions}
							value={
								hasValidValue
									? currentFormValue
									: ""
							}
							onChange={(value) =>
								form.setFieldValue(
									"sourceToken",
									value
								)
							}
							error={form.errors.sourceToken}
							required
							disabled={isLoading}
							styles={{
								input: {
									backgroundColor: "#222222",
									borderColor: "#444444",
									color: "#ffffff",
									fontSize: "16px",
								},
								label: {
									color: "#ffffff",
								},
								item: {
									backgroundColor: "#222222",
									color: "#ffffff",
									"&:hover": {
										backgroundColor: "#333333",
									},
								},
								dropdown: {
									backgroundColor: "#222222",
									borderColor: "#444444",
								},
							}}
						/>

						{/* Amount Input */}
						<NumberInput
							label="Amount"
							placeholder="Enter amount to bridge"
							min={0}
							precision={6}
							thousandSeparator
							hideControls
							step={0.1}
							disabled={isLoading}
							{...form.getInputProps("amount")}
							styles={{
								input: {
									backgroundColor: "#222222",
									borderColor: "#444444",
									color: "#ffffff",
									fontSize: "16px",
								},
								label: {
									color: "#ffffff",
								},
							}}
						/>

						{/* Destination Address */}
						<TextInput
							label="Destination Address (Tron)"
							placeholder="T..."
							description={
								form.values.destinationAddress
									? validateTronAddress(
											form.values
												.destinationAddress
									  ).isValid
										? "✅ Valid Tron address"
										: "❌ " +
										  validateTronAddress(
												form.values
													.destinationAddress
										  ).error
									: "Enter your Tron wallet address (starts with T)"
							}
							disabled={isLoading}
							leftSection={
								<IconWallet
									size="1rem"
									style={{
										color:
											form.values
												.destinationAddress &&
											validateTronAddress(
												form.values
													.destinationAddress
											).isValid
												? "#00ff88"
												: "#666666",
									}}
								/>
							}
							{...form.getInputProps(
								"destinationAddress"
							)}
							styles={{
								input: {
									backgroundColor: "#222222",
									borderColor:
										form.values
											.destinationAddress &&
										validateTronAddress(
											form.values
												.destinationAddress
										).isValid
											? "#00ff88"
											: form.values
													.destinationAddress
											? "#ff4444"
											: "#444444",
									color: "#ffffff",
									fontSize: "16px",
								},
								label: {
									color: "#ffffff",
								},
								description: {
									color:
										form.values
											.destinationAddress &&
										validateTronAddress(
											form.values
												.destinationAddress
										).isValid
											? "#00ff88"
											: form.values
													.destinationAddress
											? "#ff4444"
											: "#ffffff",
								},
							}}
						/>

						{/* Gas Fee Payment Method */}
						<RadioGroup
							label="Gas Fee Payment Method"
							description="Choose how to pay for gas fees"
							value={
								form.values.gasFeePaymentMethod
							}
							onChange={handlePaymentMethodChange}
							required
							mb="md"
							styles={{
								label: {
									color: "#ffffff",
									marginBottom: "8px",
								},
								description: {
									color: "#ffffff",
									marginBottom: "16px",
								},
							}}
						>
							<Stack gap="lg">
								<Radio
									value={
										FeePaymentMethod.WITH_NATIVE_CURRENCY
									}
									label="Pay with ETH"
									styles={{
										label: {
											color: "#ffffff",
										},
									}}
									icon={CheckIcon}
								/>
								<Radio
									value={
										FeePaymentMethod.WITH_STABLECOIN
									}
									label="Pay with USDT"
									styles={{
										label: {
											color: "#ffffff",
										},
									}}
									icon={CheckIcon}
								/>
							</Stack>
						</RadioGroup>

						{/* Bridge Quote Display */}
						<BridgeQuoteDisplay
							quote={quote}
							isGettingQuote={isGettingQuote}
							gasFeePaymentMethod={
								form.values.gasFeePaymentMethod
							}
							destinationTokenSymbol={
								tokens.destination?.symbol
							}
						/>

						{/* Fee Information Display */}
						<FeeInformationDisplay
							gasFee={gasFee}
						/>

						{/* Action Buttons */}
						<Group
							justify="center"
							mt="md"
						>
							{needsApproval ? (
								<Button
									onClick={handleApproval}
									size="lg"
									loading={isApproving}
									disabled={!form.isValid()}
									leftSection={
										<IconWallet size="1rem" />
									}
									style={{
										backgroundColor: "#ff8800",
										color: "#ffffff",
										"&:hover": {
											backgroundColor: "#cc6600",
										},
										"&:disabled": {
											backgroundColor: "#444444",
											color: "#888888",
										},
									}}
								>
									{isApproving
										? "Approving..."
										: "Approve Tokens"}
								</Button>
							) : (
								<Button
									type="submit"
									size="lg"
									loading={isLoading}
									disabled={!form.isValid()}
									leftSection={
										<IconArrowRight size="1rem" />
									}
									style={{
										backgroundColor: "#2d662d",
										color: "#ffffff",
										"&:hover": {
											backgroundColor: "#1a4d1a",
										},
										"&:disabled": {
											backgroundColor: "#444444",
											color: "#888888",
										},
									}}
								>
									{isLoading
										? "Sending..."
										: "Bridge Tokens"}
								</Button>
							)}
						</Group>
					</Stack>
				</form>
			</Stack>
		</Card>
	);
}
