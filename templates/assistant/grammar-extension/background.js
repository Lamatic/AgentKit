// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Store the latest selected text
let latestSelection = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TEXT_SELECTED') {
    // Store the selection
    latestSelection = message;
    
    // Try to send to all extension views (sidepanel)
    chrome.runtime.sendMessage(message).catch(() => {
      // Sidepanel might not be open yet, that's ok
      console.log('Sidepanel not open, selection stored');
    });
  }
  
  // Handle requests for the latest selection
  if (message.type === 'GET_SELECTION') {
    sendResponse(latestSelection);
  }
  
  return true; // Keep the message channel open for async response
});