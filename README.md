# 🌉 Bridge USDC/USDT to Tron

A modern web application for bridging USDC and USDT tokens from Ethereum to Tron using the Allbridge Core SDK.

## Features

- 🔗 **Multi-Wallet Support**: Connect to MetaMask, Trust Wallet, Exodus, Coinbase Wallet, Brave Wallet, and other Web3 wallets
- 💰 **Token Bridging**: Bridge USDC and USDT from Ethereum to Tron
- 📊 **Real-time Fees**: Calculate gas fees and amount to receive
- 📱 **Modern UI**: Beautiful interface built with Mantine UI
- 🔄 **Transaction Status**: Track transfer progress and status
- 📋 **Copy & View**: Easy access to transaction hashes and block explorers

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- Any Web3 wallet browser extension (MetaMask, Trust Wallet, Exodus, Coinbase Wallet, Brave Wallet, etc.)
- Ethereum wallet with USDC/USDT tokens
- Tron wallet address for receiving tokens

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd bridge-tron
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### 1. Connect Wallet

- Click "Connect Wallet" to connect your preferred Web3 wallet
- The app automatically detects and supports MetaMask, Trust Wallet, Exodus, Coinbase Wallet, Brave Wallet, and other Web3 wallets
- Ensure you're connected to the Ethereum mainnet

### 2. Select Token

- Choose between USDC or USDT as your source token
- Enter the amount you want to bridge

### 3. Enter Destination

- Provide your Tron wallet address (starts with "T")
- The application validates the address format

### 4. Review & Bridge

- Review the gas fees and amount you'll receive
- Click "Bridge Tokens" to start the process
- Approve the token spending if required

### 5. Track Progress

- Monitor the transfer status in real-time
- Use the transaction hash to track on Etherscan
- Wait for completion (typically 5-15 minutes)

## Technology Stack

- **Frontend**: React 19 with Vite
- **UI Framework**: Mantine UI
- **Blockchain**: Allbridge Core SDK
- **Wallet**: Multi-wallet support with ethers.js (MetaMask, Trust Wallet, Exodus, Coinbase Wallet, Brave Wallet, etc.)
- **Icons**: Tabler Icons

## Supported Networks

- **Source**: Ethereum Mainnet
- **Destination**: Tron Mainnet
- **Tokens**: USDC, USDT (Ethereum) → USDT (Tron)

## Configuration

The application uses default RPC URLs from the Allbridge Core SDK. This ensures:

1. No additional API keys or RPC endpoints required
2. Reliable connection to supported networks
3. Automatic fallback to official endpoints

## Security Considerations

- Always verify transaction details before confirming
- Double-check destination addresses
- Keep your private keys secure
- Use hardware wallets for large amounts

## Troubleshooting

### Common Issues

1. **MetaMask not detected**

   - Ensure MetaMask is installed and unlocked
   - Refresh the page and try again

2. **Transaction fails**

   - Check if you have sufficient ETH for gas fees
   - Verify you have enough tokens to bridge
   - Ensure you're on the correct network (Ethereum mainnet)

3. **Token approval issues**
   - Some tokens require approval before bridging
   - Follow the approval process when prompted

### Error Messages

- **"Failed to connect wallet"**: Check Trust Wallet installation and permissions
- **"Invalid Tron address"**: Ensure the address starts with "T" and is 34 characters long
- **"Insufficient balance"**: Check your token and ETH balances

## Development

### Project Structure

```
src/
├── components/
│   ├── BridgeApp.jsx      # Main application component
│   ├── BridgeForm.jsx     # Bridge form and logic
│   ├── BridgeStatus.jsx   # Transfer status display
│   └── WalletConnector.jsx # Wallet connection component
├── hooks/
│   ├── useBridgeSDK.js    # Allbridge SDK initialization
│   └── useWallet.js       # Wallet connection logic
├── App.jsx                # Root component
└── main.jsx              # Application entry point
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Check the [Allbridge Core documentation](https://docs-core.allbridge.io/)
- Review the [Allbridge Core SDK docs](https://bridge-core-sdk.web.app/index.html)
- Open an issue in this repository

## Disclaimer

This application is for educational and development purposes. Always verify all transaction details and use at your own risk. The developers are not responsible for any financial losses.
