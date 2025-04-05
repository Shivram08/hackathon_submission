# Bitcoin Donation Extension for Safari

A Safari extension for content creators to generate one-time Bitcoin donation addresses. This extension allows creators to easily generate and share Bitcoin addresses for their audience to send donations.

## Features

- Generate new Bitcoin addresses with a single click
- Toggle between mainnet and testnet for testing
- QR code generation for easy sharing
- Copy address to clipboard
- Secure key generation using BIP39 and BIP32 standards

## Installation

1. Open the Xcode project
2. Build the project
3. Run the app
4. In Safari settings, enable the extension

## Usage

1. Click on the Bitcoin Donation Extension icon in your Safari toolbar
2. Toggle "Use Testnet" if you want to test without real money
3. Click "Generate New Address" to create a fresh Bitcoin address
4. Share the displayed address or QR code with your audience
5. Use the "Copy Address" button to copy the address to your clipboard

## Development

This extension is built using:
- bitcoinjs-lib for Bitcoin address generation
- QR code generation for easy sharing
- Webpack for bundling
- Safari Web Extensions API

To build from source:

```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

## Testing with Testnet

The extension defaults to testnet mode for safety. You can receive test bitcoins by:

1. Keeping the "Use Testnet" toggle enabled
2. Using a Bitcoin testnet faucet to receive test coins
3. Verifying receipt using a testnet block explorer

## License

MIT 