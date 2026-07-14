chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "http://localhost:3000"
  });
});

// ** PRODUCTION LEVEL LOGIC: Mock AI Evaluation (Immediate for Debugging) ** //
const evaluateContext = async (payload) => {
  // 1. Log to the internal Chrome Extension console
  console.log("=========================================");
  console.log("🧠 [AI ENGINE] Evaluating Context:");
  console.log("🔗 URL:", payload.url);
  console.log("🏷️ Title:", payload.title);
  if (payload.h1Text) console.log("📝 H1:", payload.h1Text);
  if (payload.description) console.log("📄 Meta:", payload.description);
  console.log("=========================================");

  // 2. ** PRODUCTION LEVEL DX: Bridge logs to VS Code Terminal ** //
  try {
    await fetch("http://localhost:3000/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Silently fail if the dev server isn't running
  }
};

// ** PRODUCTION LEVEL LOGIC: Message Listener ** //
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PAGE_CONTEXT_SCRAPED") {
    evaluateContext(message.payload);
  }
});

// ** PRODUCTION LEVEL TRIGGER: Hook into Chrome Tab Navigation ** //
// This is much more reliable than relying purely on client-side MutationObservers
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We only want to trigger when the URL changes OR the page finishes loading
  if (changeInfo.url || changeInfo.status === 'complete') {
    // Send a message down to the content script to scrape the DOM
    chrome.tabs.sendMessage(tabId, { type: "FORCE_SCRAPE" }).catch(() => {
      // Ignore errors if the content script isn't injected yet on this tab
    });
  }
});

// ** PRODUCTION LEVEL TRIGGER: Hook into Tab Switching ** //
// If you have a tab open in the background and switch to it, we need to evaluate it!
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.sendMessage(activeInfo.tabId, { type: "FORCE_SCRAPE" }).catch(() => {
    // If it fails, it means the tab was opened BEFORE the extension was installed/reloaded.
    // PRODUCTION LEVEL FIX: We dynamically inject the content script so the user never has to refresh!
    chrome.scripting.executeScript({
      target: { tabId: activeInfo.tabId },
      files: ["content.js"]
    }).then(() => {
      // Now that it's injected, send the message again!
      chrome.tabs.sendMessage(activeInfo.tabId, { type: "FORCE_SCRAPE" }).catch(() => {});
    }).catch(() => {
      // Ignore if it's a restricted page like chrome:// 
    });
  });
});
