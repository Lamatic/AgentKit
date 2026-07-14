// ** PRODUCTION LEVEL SCRIPT: Client-Side DOM Scraper ** //

function scrapePageContext() {
  // 1. Extract Page Title
  const title = document.title || "";

  // 2. Extract Meta Description (if any)
  const metaDesc = document.querySelector('meta[name="description"]');
  const description = metaDesc ? metaDesc.getAttribute("content") : "";

  // 3. Extract ALL Headings (H1s)
  const h1Elements = document.querySelectorAll('h1');
  const h1Text = Array.from(h1Elements)
    .map(el => el.innerText.trim())
    .filter(text => text.length > 0)
    .join(" | ");

  // Combine into a lightweight payload for the AI
  const payload = {
    url: window.location.href,
    title,
    description,
    h1Text
  };

  // Send the payload to our background service worker
  chrome.runtime.sendMessage({ type: "PAGE_CONTEXT_SCRAPED", payload });
}

// ** PRODUCTION LEVEL TRIGGER: Scrape on initial load ** //
scrapePageContext();

// ** PRODUCTION LEVEL TRIGGER: Listen for Background Worker Requests ** //
// This guarantees we scrape whenever the background worker detects a reliable URL change
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FORCE_SCRAPE") {
    // Slight delay to allow DOM to finish rendering
    setTimeout(scrapePageContext, 500);
  }
});
