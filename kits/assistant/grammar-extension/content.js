// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

function handleTextSelection() {
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      // Send selected text to the extension
      chrome.runtime.sendMessage({
        type: 'TEXT_SELECTED',
        text: selectedText,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }, 10);
}

// Also listen for selection change event
document.addEventListener('selectionchange', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText && selectedText.length > 0) {
    chrome.runtime.sendMessage({
      type: 'TEXT_SELECTED',
      text: selectedText,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }
});