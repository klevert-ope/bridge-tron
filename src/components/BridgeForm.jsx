import { useState, useEffect } from "react";
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
	Paper,
	Badge,
	Card,
	Radio,
	RadioGroup,
	CheckIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
	IconAlertCircle,
	IconArrowRight,
	IconSend,
	IconWallet,
} from "@tabler/icons-react";
import {
	ChainSymbol,
	Messenger,
} from "@allbridge/bridge-core-sdk";

// Helper function to send raw transactions (following official docs)
const sendRawTransaction = async (
	rawTransaction
) => {
	// Ensure the transaction has the correct format
	const formattedTx = {
		from: rawTransaction.from,
		to: rawTransaction.to,
		data: rawTransaction.data,
		value: rawTransaction.value
			? `0x${parseInt(
					rawTransaction.value
			  ).toString(16)}`
			: "0x0",
	};

	const txHash = await window.ethereum.request({
		method: "eth_sendTransaction",
		params: [formattedTx],
	});
	return { transactionHash: txHash };
};

export function BridgeForm({
	sdk,
	account,
	onTransferStatus,
}) {
	const [isLoading, setIsLoading] =
		useState(false);
	const [isLoadingTokens, setIsLoadingTokens] =
		useState(false);
	const [isApproving, setIsApproving] =
		useState(false);
	const [needsApproval, setNeedsApproval] =
		useState(false);
	const [tokens, setTokens] = useState({
		source: [],
		destination: null,
	});
	const [gasFee, setGasFee] = useState(null);
	const [quote, setQuote] = useState(null);
	const [isGettingQuote, setIsGettingQuote] =
		useState(false);

	const form = useForm({
		initialValues: {
			sourceToken: "",
			amount: "",
			destinationAddress: "",
			gasFeePaymentMethod: "native",
		},
		validate: {
			sourceToken: (value) =>
				!value
					? "Please select a source token"
					: null,
			amount: (value) => {
				if (!value)
					return "Please enter an amount";
				if (parseFloat(value) <= 0)
					return "Amount must be greater than 0";
				return null;
			},
			destinationAddress: (value) => {
				if (!value)
					return "Please enter destination address";
				// Basic Tron address validation (starts with T and 34 characters)
				if (!/^T[A-Za-z1-9]{33}$/.test(value)) {
					return "Please enter a valid Tron address";
				}
				return null;
			},
			gasFeePaymentMethod: (value) => {
				if (!value)
					return "Please select a gas fee payment method";
				return null;
			},
		},
	});

	// Load available tokens
	useEffect(() => {
		async function loadTokens() {
			setIsLoadingTokens(true);
			try {
				const chains =
					await sdk.chainDetailsMap();
				const ethTokens =
					chains[ChainSymbol.ETH]?.tokens || [];
				const tronTokens =
					chains[ChainSymbol.TRX]?.tokens || [];

				// Filter for USDC and USDT on Ethereum
				const sourceTokens = ethTokens.filter(
					(token) =>
						token.symbol === "USDC" ||
						token.symbol === "USDT"
				);

				// Filter for USDT on Tron
				const destinationTokens =
					tronTokens.filter(
						(token) => token.symbol === "USDT"
					);

				setTokens({
					source: sourceTokens,
					destination: destinationTokens[0], // USDT on Tron
				});

				// Set default source token
				if (sourceTokens.length > 0) {
					const tokenAddress =
						sourceTokens[0].tokenAddress ||
						sourceTokens[0].address;
					form.setFieldValue(
						"sourceToken",
						tokenAddress
					);
				} else {
					// Clear the form value if no tokens are available
					form.setFieldValue("sourceToken", "");
				}
			} catch (error) {
				console.error(
					"Failed to load tokens:",
					error
				);
				notifications.show({
					title: "Error",
					message:
						"Failed to load available tokens",
					color: "red",
				});
				// Reset tokens to empty state on error
				setTokens({
					source: [],
					destination: null,
				});
			} finally {
				setIsLoadingTokens(false);
			}
		}

		if (sdk) {
			loadTokens();
		}
	}, [sdk]);

	// Get quote function
	const getQuote = async () => {
		const {
			sourceToken: tokenAddress,
			amount,
			destinationAddress,
		} = form.values;

		if (
			!tokenAddress ||
			!amount ||
			!destinationAddress ||
			parseFloat(amount) <= 0
		) {
			setQuote(null);
			return;
		}

		setIsGettingQuote(true);
		try {
			const sourceToken = tokens.source.find(
				(token) => {
					const tokenAddr =
						token.tokenAddress || token.address;
					return tokenAddr === tokenAddress;
				}
			);

			if (!sourceToken || !tokens.destination) {
				console.warn(
					"❌ Source or destination token not found"
				);
				setQuote(null);
				return;
			}

			const amountToBeReceived =
				await sdk.getAmountToBeReceived(
					amount,
					sourceToken,
					tokens.destination
				);

			const gasFeeOptions =
				await sdk.getGasFeeOptions(
					sourceToken,
					tokens.destination,
					Messenger.ALLBRIDGE
				);

			const transferTimeMs =
				sdk.getAverageTransferTime(
					sourceToken,
					tokens.destination,
					Messenger.ALLBRIDGE
				);

			// Convert transfer time to human readable format
			const transferTimeMinutes = Math.ceil(
				transferTimeMs / (1000 * 60)
			);

			const quoteResult = {
				success: true,
				quote: {
					fromToken: sourceToken,
					toToken: tokens.destination,
					fromAmount: amount,
					toAmount: amountToBeReceived,
					gasFee:
						gasFeeOptions.native?.float ||
						gasFeeOptions.native?.int,
					gasFeeStablecoin:
						gasFeeOptions.stablecoin?.float ||
						gasFeeOptions.stablecoin?.int,
					transferTime: `${transferTimeMinutes} minutes`,
					messenger: "Allbridge",
					route: `${sourceToken.symbol} (Ethereum) → ${tokens.destination.symbol} (Tron)`,
				},
				provider: "allbridge",
				sourceChain: ChainSymbol.ETH,
				destinationChain: ChainSymbol.TRX,
			};

			setQuote(quoteResult);

			// Also set gas fee for compatibility
			setGasFee(gasFeeOptions);
		} catch (error) {
			console.error(
				"❌ Error getting bridge quote:",
				error
			);
			setQuote(null);
			notifications.show({
				title: "Quote Error",
				message: `Failed to get bridge quote: ${error.message}`,
				color: "red",
			});
		} finally {
			setIsGettingQuote(false);
		}
	};

	// Get quote when form values change
	useEffect(() => {
		getQuote();
		// Reset approval state when form values change
		setNeedsApproval(false);
	}, [
		form.values.sourceToken,
		form.values.amount,
		form.values.destinationAddress,
		tokens.source,
		tokens.destination,
		sdk,
	]);

	// Send tokens
	const handleSend = async () => {
		const {
			sourceToken: tokenAddress,
			amount,
			destinationAddress,
		} = form.values;
		if (
			!tokenAddress ||
			!amount ||
			!destinationAddress
		) {
			return;
		}

		setIsLoading(true);
		try {
			// Check if wallet is connected
			if (!window.ethereum) {
				throw new Error(
					"No wallet detected. Please install MetaMask or another wallet."
				);
			}

			if (
				!tokens.source ||
				tokens.source.length === 0
			) {
				notifications.show({
					title: "Error",
					message: "No tokens available",
					color: "red",
				});
				return;
			}

			const sourceToken = tokens.source.find(
				(token) => {
					const tokenAddr =
						token.tokenAddress || token.address;
					return tokenAddr === tokenAddress;
				}
			);

			if (!sourceToken) {
				throw new Error("Source token not found");
			}

			// Check token balance using ethers.js instead of web3
			try {
				// Use ethers.js if available, otherwise skip balance check
				if (window.ethers) {
					const provider =
						new window.ethers.BrowserProvider(
							window.ethereum
						);
					const tokenContract =
						new window.ethers.Contract(
							sourceToken.tokenAddress ||
								sourceToken.address,
							[
								{
									constant: true,
									inputs: [
										{
											name: "_owner",
											type: "address",
										},
									],
									name: "balanceOf",
									outputs: [
										{
											name: "balance",
											type: "uint256",
										},
									],
									type: "function",
								},
							],
							provider
						);

					const balance =
						await tokenContract.balanceOf(
							account
						);
					const balanceInTokens =
						parseFloat(balance) /
						Math.pow(
							10,
							sourceToken.decimals || 6
						);

					if (
						balanceInTokens < parseFloat(amount)
					) {
						throw new Error(
							`Insufficient ${
								sourceToken.symbol
							} balance. You have ${balanceInTokens.toFixed(
								6
							)} but need ${amount}`
						);
					}
				}
			} catch {
				// Continue anyway, the transaction will fail if balance is insufficient
			}

			// Check if approval is needed first (following official docs)
			const allowanceCheck =
				await sdk.bridge.checkAllowance({
					token: sourceToken,
					owner: account,
					gasFeePaymentMethod:
						form.values.gasFeePaymentMethod,
					amount: amount,
				});

			if (!allowanceCheck) {
				setNeedsApproval(true);
				notifications.show({
					title: "Approval Required",
					message:
						"Please approve the bridge to spend your tokens first",
					color: "yellow",
				});
				return;
			}

			// Build bridge transaction
			let bridgeRawTx = null;
			try {
				bridgeRawTx =
					await sdk.bridge.rawTxBuilder.send({
						amount: amount,
						fromAccountAddress: account,
						toAccountAddress: destinationAddress,
						sourceToken: sourceToken,
						destinationToken: tokens.destination,
						messenger: Messenger.ALLBRIDGE,
						gasFeePaymentMethod:
							form.values.gasFeePaymentMethod,
					});
			} catch (txError) {
				throw new Error(
					`Failed to build transaction: ${txError.message}`
				);
			}

			// Basic validation
			if (!bridgeRawTx) {
				throw new Error(
					"Failed to build bridge transaction"
				);
			}

			// Send bridge transaction (following official docs)
			const txReceipt = await sendRawTransaction(
				bridgeRawTx
			);

			notifications.show({
				title: "Transfer Initiated",
				message: `Transaction hash: ${txReceipt.transactionHash}`,
				color: "green",
				icon: <IconSend size="1rem" />,
			});

			// Update transfer status with quote information
			onTransferStatus({
				status: "pending",
				txHash: txReceipt.transactionHash,
				amount,
				sourceToken: sourceToken.symbol,
				destinationToken:
					tokens.destination.symbol,
				destinationAddress,
				amountToReceive: quote?.quote?.toAmount,
				estimatedTime: quote?.quote?.transferTime,
				route: quote?.quote?.route,
			});
		} catch (error) {
			console.error("Transfer failed:", error);
			console.error("Error details:", {
				code: error.code,
				message: error.message,
				data: error.data,
			});

			// Provide more specific error messages
			let errorMessage = error.message;
			if (error.code === 4001) {
				errorMessage =
					"Transaction was rejected by user";
			} else if (error.code === -32603) {
				if (
					error.message.includes(
						"insufficient funds"
					)
				) {
					errorMessage =
						"Insufficient ETH balance for gas fees. Please add more ETH to your wallet.";
				} else if (
					error.message.includes(
						"execution reverted"
					)
				) {
					errorMessage =
						"Transaction failed - contract execution reverted. This might be due to insufficient token balance or contract issues.";
				} else {
					errorMessage =
						"Transaction failed - RPC error. This might be due to network congestion or contract issues. Please try again.";
				}
			} else if (
				error.message.includes(
					"insufficient funds"
				)
			) {
				errorMessage =
					"Insufficient ETH balance for gas fees. Please add more ETH to your wallet.";
			} else if (error.message.includes("gas")) {
				errorMessage =
					"Gas estimation failed. Please try again or increase gas limit.";
			} else if (
				error.message.includes(
					"execution reverted"
				)
			) {
				errorMessage =
					"Transaction failed - contract execution reverted. Please check your token balance and try again.";
			}

			notifications.show({
				title: "Transfer Failed",
				message: errorMessage,
				color: "red",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Handle approval
	const handleApproval = async () => {
		const { sourceToken: tokenAddress, amount } =
			form.values;

		if (!tokenAddress || !amount) {
			notifications.show({
				title: "Error",
				message:
					"Please fill in token and amount first",
				color: "red",
			});
			return;
		}

		const sourceToken = tokens.source.find(
			(token) => {
				const tokenAddr =
					token.tokenAddress || token.address;
				return tokenAddr === tokenAddress;
			}
		);

		if (!sourceToken) {
			notifications.show({
				title: "Error",
				message: "Source token not found",
				color: "red",
			});
			return;
		}

		setIsApproving(true);
		try {
			// Build approval transaction (following official docs)
			const approveRawTx =
				await sdk.bridge.rawTxBuilder.approve({
					token: sourceToken,
					owner: account,
				});

			// Send approval transaction (following official docs)
			const approveTxReceipt =
				await sendRawTransaction(approveRawTx);

			notifications.show({
				title: "Approval Sent",
				message: `Approval transaction hash: ${approveTxReceipt.transactionHash}`,
				color: "blue",
			});

			// Reset approval state
			setNeedsApproval(false);
		} catch (error) {
			console.error("Approval failed:", error);
			notifications.show({
				title: "Approval Failed",
				message: error.message,
				color: "red",
			});
		} finally {
			setIsApproving(false);
		}
	};

	const handleSubmit = async () => {
		// Get the source token
		const sourceToken = tokens.source.find(
			(token) => {
				const tokenAddr =
					token.tokenAddress || token.address;
				return (
					tokenAddr === form.values.sourceToken
				);
			}
		);

		if (!sourceToken) {
			console.error("Source token not found");
			return;
		}

		// Proceed with bridge transaction
		await handleSend();
	};

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
							description="Enter your Tron wallet address (starts with T)"
							disabled={isLoading}
							leftSection={
								<IconWallet
									size="1rem"
									style={{ color: "#00ff88" }}
								/>
							}
							{...form.getInputProps(
								"destinationAddress"
							)}
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
								description: {
									color: "#ffffff",
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
							onChange={(value) => {
								form.setFieldValue(
									"gasFeePaymentMethod",
									value
								);
							}}
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
									value="native"
									label="Pay with ETH"
									styles={{
										label: {
											color: "#ffffff",
										},
									}}
									icon={CheckIcon}
								/>
								<Radio
									value="stablecoin"
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

						{/* Bridge Quote */}
						{(quote || isGettingQuote) && (
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
												style={{
													color: "#ffffff",
												}}
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
													style={{
														color: "#ffffff",
													}}
												>
													You will receive:
												</Text>
												<Badge
													variant="light"
													color="green"
													size="lg"
													style={{
														backgroundColor:
															"#2d662d",
														color: "#ffffff",
													}}
												>
													{form.values
														.gasFeePaymentMethod ===
														"stablecoin" &&
													quote.quote
														?.gasFeeStablecoin
														? (
																parseFloat(
																	quote.quote
																		.toAmount
																) -
																parseFloat(
																	quote.quote
																		.gasFeeStablecoin
																)
														  ).toFixed(6)
														: quote.quote
																?.toAmount ||
														  "N/A"}{" "}
													{tokens.destination
														?.symbol || "USDT"}
												</Badge>
											</Group>
											{form.values
												.gasFeePaymentMethod ===
												"stablecoin" &&
												quote.quote
													?.gasFeeStablecoin && (
													<Group gap="xs">
														<Text
															size="xs"
															style={{
																color: "#ffffff",
															}}
														>
															(Original:{" "}
															{
																quote.quote
																	.toAmount
															}{" "}
															USDT - Fee:{" "}
															{
																quote.quote
																	.gasFeeStablecoin
															}{" "}
															USDT)
														</Text>
													</Group>
												)}
											{/* Gas Fee Display */}
											<Group gap="xs">
												<Text
													size="xs"
													style={{
														color: "#ffffff",
													}}
												>
													Gas fee (
													{form.values
														.gasFeePaymentMethod ===
													"native"
														? "ETH"
														: "USDT"}
													):
												</Text>
												<Badge
													variant="light"
													color={
														form.values
															.gasFeePaymentMethod ===
														"native"
															? "orange"
															: "purple"
													}
													style={{
														backgroundColor:
															form.values
																.gasFeePaymentMethod ===
															"native"
																? "#ff8800"
																: "#8800ff",
														color: "#000000",
													}}
												>
													{form.values
														.gasFeePaymentMethod ===
													"native"
														? `${
																quote.quote
																	?.gasFee ||
																"N/A"
														  } ETH`
														: `${
																quote.quote
																	?.gasFeeStablecoin ||
																"N/A"
														  } USDT`}
												</Badge>
											</Group>
											{quote.quote
												?.transferTime && (
												<Group gap="xs">
													<Text
														size="xs"
														style={{
															color: "#ffffff",
														}}
													>
														Estimated time:
													</Text>
													<Badge
														variant="light"
														color="blue"
														style={{
															backgroundColor:
																"#0088ff",
															color: "#ffffff",
														}}
													>
														{
															quote.quote
																.transferTime
														}
													</Badge>
												</Group>
											)}
											<Group gap="xs">
												<Text
													size="xs"
													style={{
														color: "#ffffff",
													}}
												>
													Route:
												</Text>
												<Badge
													variant="light"
													color="gray"
													style={{
														backgroundColor:
															"#444444",
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
						)}

						{/* Fee Information */}
						{gasFee && (
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
												backgroundColor:
													"#0088ff",
												color: "#ffffff",
											}}
										>
											{gasFee.native?.float ||
												"N/A"}{" "}
											ETH
										</Badge>
									</Group>
									{gasFee.stablecoin && (
										<Group gap="xs">
											<Text
												size="xs"
												style={{
													color: "#ffffff",
												}}
											>
												Or pay with:
											</Text>
											<Badge
												variant="light"
												color="green"
												style={{
													backgroundColor:
														"#2d662d",
													color: "#ffffff",
												}}
											>
												{gasFee.stablecoin.float}{" "}
												USDT
											</Badge>
										</Group>
									)}
								</Stack>
							</Paper>
						)}

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
