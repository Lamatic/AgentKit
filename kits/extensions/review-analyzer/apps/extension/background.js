// Chrome Extension Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("Review Analyzer Extension Installed.");
  // Initialize default Next.js server URL
  chrome.storage.local.get(["nextAppUrl"], (result) => {
    if (!result.nextAppUrl) {
      chrome.storage.local.set({ nextAppUrl: "http://localhost:3000" }, () => {
        console.log("Default Next.js backend URL set to http://localhost:3000");
      });
    }
  });
});
