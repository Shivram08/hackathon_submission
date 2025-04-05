// Background script for the Bitcoin Donation Extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Bitcoin Donation Extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    useTestnet: true // Default to testnet for safety
  });
});

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle any message passing if needed in the future
  if (message.action === 'getInfo') {
    sendResponse({ success: true });
    return true;
  }
}); 