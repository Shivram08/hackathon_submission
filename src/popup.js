// Import libraries
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import QRCode from 'qrcode';
import { BIP32Factory } from 'bip32';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';

// Create bip32 instance and initialize bitcoin library
const bip32 = BIP32Factory(ecc);
bitcoin.initEccLib(ecc);

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

// Debug - Log to console when app starts
console.log('Bitcoin Donation Extension loaded');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');
  
  // Get DOM elements
  generateBtn = document.getElementById('generate-btn');
  copyBtn = document.getElementById('copy-btn');
  addressText = document.getElementById('address-text');
  qrcodeContainer = document.getElementById('qrcode-container');
  networkToggle = document.getElementById('network-toggle');
  statusMessage = document.getElementById('status-message');
  
  console.log('DOM elements:', { 
    generateBtn, 
    copyBtn, 
    addressText, 
    qrcodeContainer, 
    networkToggle, 
    statusMessage 
  });

  if (!generateBtn) {
    console.error('Could not find generate button');
    return;
  }

  // Add placeholder content to show that elements exist
  if (addressText) addressText.textContent = "Click 'Generate New Address' button";
  
  // For immediate testing, create a static address example
  try {
    createStaticAddressExample();
  } catch (error) {
    console.error("Failed to create static example:", error);
  }

  // Load saved preference for testnet
  try {
    chrome.storage.local.get(['useTestnet'], (result) => {
      console.log('Storage result:', result);
      if (result.useTestnet !== undefined) {
        useTestnet = result.useTestnet;
        networkToggle.checked = useTestnet;
      } else {
        // Default to testnet
        useTestnet = true;
        networkToggle.checked = true;
      }
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
    // Default to testnet if storage fails
    useTestnet = true;
    if (networkToggle) networkToggle.checked = true;
  }

  // Set event listeners
  generateBtn.addEventListener('click', () => {
    console.log('Generate button clicked');
    generateNewAddress();
  });
  
  copyBtn.addEventListener('click', () => {
    console.log('Copy button clicked');
    copyAddressToClipboard();
  });
  
  if (networkToggle) {
    networkToggle.addEventListener('change', (e) => {
      console.log('Network toggle changed:', e.target.checked);
      useTestnet = e.target.checked;
      try {
        chrome.storage.local.set({ useTestnet });
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
      generateNewAddress();
    });
  }
});

/**
 * Create a static address example for testing
 */
function createStaticAddressExample() {
  const testnetAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
  const mainnetAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  
  // Use a simple test address
  const testAddress = useTestnet ? testnetAddress : mainnetAddress;
  
  // Update UI with test data
  if (addressText) {
    addressText.textContent = "TEST: " + testAddress;
  }
  
  // Create test QR
  if (qrcodeContainer) {
    generateQRCodeUrl(testAddress);
  }
}

/**
 * Generate a new Bitcoin address
 */
function generateNewAddress() {
  console.log('Generating new address, testnet:', useTestnet);
  
  // Clear and update UI
  if (addressText) addressText.textContent = "Generating address...";
  if (qrcodeContainer) qrcodeContainer.innerHTML = '';
  
  try {
    // Get the appropriate network based on user selection
    const network = useTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    console.log('Using network:', network.messagePrefix);
    
    // Generate random mnemonic
    const mnemonic = bip39.generateMnemonic();
    console.log('Generated mnemonic');
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    console.log('Generated seed');
    
    // Create a BIP32 HD wallet
    const root = bip32.fromSeed(seed, network);
    console.log('Created root key');
    
    // Derive a keypair from the root
    const path = "m/44'/0'/0'/0/0"; // BIP44 standard path
    const child = root.derivePath(path);
    console.log('Derived child key');
    
    // Generate a P2WPKH (Native SegWit) address
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: child.publicKey,
      network
    });
    
    console.log('Generated address:', address);
    
    // Save the current address
    currentAddress = address;
    
    // Update UI
    displayAddress(address);
    generateQRCodeUrl(address);
    
    // Store the private key in browser storage (for demo purposes - in production consider more secure methods)
    try {
      const privateKey = child.privateKey.toString('hex');
      chrome.storage.local.set({ 
        lastGeneratedPrivateKey: privateKey,
        lastGeneratedAddress: address,
        lastGeneratedMnemonic: mnemonic
      });
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
    
    // Show success message
    showStatus('New address generated!');
  } catch (error) {
    console.error('Error generating address:', error);
    showStatus('Error: ' + error.message, true);
    
    // Fallback to static example for testing
    createStaticAddressExample();
  }
}

/**
 * Display the address in the UI
 */
function displayAddress(address) {
  if (!addressText) {
    console.error('Address text element not found');
    return;
  }
  console.log('Displaying address:', address);
  addressText.textContent = address;
}

/**
 * Generate QR code for the address using QRCode.toString()
 */
function generateQRCodeUrl(address) {
  if (!qrcodeContainer) {
    console.error('QR code container element not found');
    return;
  }
  
  console.log('Generating QR code for:', address);
  
  // Clear previous QR code
  qrcodeContainer.innerHTML = '';
  
  // Generate QR code
  const prefix = useTestnet ? 'bitcoin:' : 'bitcoin:';
  const qrContent = `${prefix}${address}`;
  console.log('QR content:', qrContent);
  
  // Try to create QR code using URL approach
  try {
    // Create QR code as a data URL
    QRCode.toDataURL(
      qrContent,
      { 
        width: 200,
        margin: 0,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      },
      (error, url) => {
        if (error) {
          console.error('QR code generation error:', error);
          fallbackQRCode(qrcodeContainer, address);
          return;
        }
        
        // Create an image element and set the data URL
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Bitcoin Address QR Code';
        img.width = 200;
        img.height = 200;
        img.style.display = 'block';
        img.style.border = '4px solid white';
        img.style.borderRadius = '4px';
        img.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        
        // Append the image to the container
        qrcodeContainer.appendChild(img);
        console.log('QR code generated successfully as image');
      }
    );
  } catch (error) {
    console.error('QR generation exception:', error);
    fallbackQRCode(qrcodeContainer, address);
  }
}

/**
 * Fallback QR code display
 */
function fallbackQRCode(container, address) {
  try {
    // Create a div to contain the address in a grid to mimic a QR code
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.width = '200px';
    fallbackDiv.style.height = '200px';
    fallbackDiv.style.backgroundColor = '#f0f0f0';
    fallbackDiv.style.border = '4px solid white';
    fallbackDiv.style.borderRadius = '4px';
    fallbackDiv.style.display = 'flex';
    fallbackDiv.style.alignItems = 'center';
    fallbackDiv.style.justifyContent = 'center';
    fallbackDiv.style.padding = '10px';
    fallbackDiv.style.boxSizing = 'border-box';
    fallbackDiv.style.textAlign = 'center';
    fallbackDiv.style.wordBreak = 'break-all';
    fallbackDiv.style.fontSize = '12px';
    fallbackDiv.style.fontFamily = 'monospace';
    
    fallbackDiv.textContent = address;
    
    container.appendChild(fallbackDiv);
    console.log('Fallback QR code display created');
  } catch (error) {
    console.error('Failed to create fallback QR:', error);
    container.textContent = 'QR Error: Could not display code';
  }
}

/**
 * Copy the address to clipboard
 */
function copyAddressToClipboard() {
  if (!currentAddress) {
    console.warn('No address to copy');
    showStatus('No address to copy', true);
    return;
  }
  
  console.log('Copying to clipboard:', currentAddress);
  
  try {
    navigator.clipboard.writeText(currentAddress).then(
      () => {
        console.log('Copied to clipboard');
        showStatus('Address copied to clipboard!');
      },
      (err) => {
        console.error('Clipboard error:', err);
        showStatus('Failed to copy address', true);
      }
    );
  } catch (error) {
    console.error('Clipboard exception:', error);
    // Fallback for browsers without clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = currentAddress;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showStatus('Address copied to clipboard!');
    } catch (err) {
      console.error('execCommand error:', err);
      showStatus('Failed to copy address', true);
    }
    document.body.removeChild(textArea);
  }
}

/**
 * Show status message
 */
function showStatus(message, isError = false) {
  if (!statusMessage) {
    console.error('Status message element not found');
    console.log(isError ? 'ERROR: ' : 'STATUS: ', message);
    return;
  }
  
  console.log('Showing status:', message, isError);
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#f44336' : '#4caf50';
  
  // Clear message after 3 seconds
  setTimeout(() => {
    if (statusMessage) {
      statusMessage.textContent = '';
    }
  }, 3000);
} 