// Import libraries
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import QRCode from 'qrcode';
import { BIP32Factory } from 'bip32';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';

// Create bip32 instance
const bip32 = BIP32Factory(ecc);

// DOM elements
let generateBtn;
let copyBtn;
let addressText;
let qrcodeContainer;
let networkToggle;
let statusMessage;

// Current address
let currentAddress = '';
let useTestnet = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  generateBtn = document.getElementById('generate-btn');
  copyBtn = document.getElementById('copy-btn');
  addressText = document.getElementById('address-text');
  qrcodeContainer = document.getElementById('qrcode-container');
  networkToggle = document.getElementById('network-toggle');
  statusMessage = document.getElementById('status-message');

  // Load saved preference for testnet
  chrome.storage.local.get(['useTestnet'], (result) => {
    if (result.useTestnet !== undefined) {
      useTestnet = result.useTestnet;
      networkToggle.checked = useTestnet;
    }
  });

  // Set event listeners
  generateBtn.addEventListener('click', generateNewAddress);
  copyBtn.addEventListener('click', copyAddressToClipboard);
  networkToggle.addEventListener('change', (e) => {
    useTestnet = e.target.checked;
    chrome.storage.local.set({ useTestnet });
    generateNewAddress();
  });

  // Generate an initial address
  generateNewAddress();
});

/**
 * Generate a new Bitcoin address
 */
function generateNewAddress() {
  try {
    // Get the appropriate network based on user selection
    const network = useTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    
    // Generate random mnemonic
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Create a BIP32 HD wallet
    const root = bip32.fromSeed(seed, network);
    
    // Derive a keypair from the root
    const path = "m/44'/0'/0'/0/0"; // BIP44 standard path
    const child = root.derivePath(path);
    
    // Generate a P2WPKH (Native SegWit) address
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: child.publicKey,
      network
    });
    
    // Save the current address
    currentAddress = address;
    
    // Update UI
    displayAddress(address);
    generateQRCode(address);
    
    // Store the private key in browser storage (for demo purposes - in production consider more secure methods)
    const privateKey = child.privateKey.toString('hex');
    chrome.storage.local.set({ 
      lastGeneratedPrivateKey: privateKey,
      lastGeneratedAddress: address,
      lastGeneratedMnemonic: mnemonic
    });
    
    // Show success message
    showStatus('New address generated!');
  } catch (error) {
    console.error('Error generating address:', error);
    showStatus('Error generating address', true);
  }
}

/**
 * Display the address in the UI
 */
function displayAddress(address) {
  addressText.textContent = address;
}

/**
 * Generate QR code for the address
 */
function generateQRCode(address) {
  // Clear previous QR code
  qrcodeContainer.innerHTML = '';
  
  // Generate QR code
  const prefix = useTestnet ? 'bitcoin:' : 'bitcoin:';
  QRCode.toCanvas(
    document.createElement('canvas'),
    `${prefix}${address}`,
    { width: 200, margin: 0 },
    (error, canvas) => {
      if (error) {
        console.error(error);
        return;
      }
      qrcodeContainer.appendChild(canvas);
    }
  );
}

/**
 * Copy the address to clipboard
 */
function copyAddressToClipboard() {
  if (!currentAddress) return;
  
  navigator.clipboard.writeText(currentAddress).then(
    () => {
      showStatus('Address copied to clipboard!');
    },
    () => {
      showStatus('Failed to copy address', true);
    }
  );
}

/**
 * Show status message
 */
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#f44336' : '#4caf50';
  
  // Clear message after 3 seconds
  setTimeout(() => {
    statusMessage.textContent = '';
  }, 3000);
} 