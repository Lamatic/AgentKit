// ** PRODUCTION LEVEL LOGIC: Safe Message Sender ** //
// Prevents "Extension context invalidated" crashes when reloading the extension during development
let contextAlive = true;

function safeSendMessage(message) {
  if (!contextAlive) return; // Don't even try if we already know the context is dead
  try {
    chrome.runtime.sendMessage(message);
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      contextAlive = false; // Kill the polling loop permanently for this tab
      console.warn("LamaBlock: Extension was reloaded. Please refresh this tab to reconnect.");
    } else {
      console.error("LamaBlock Message Error:", error);
    }
  }
}

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
  safeSendMessage({ type: "PAGE_CONTEXT_SCRAPED", payload });
}

// ** PRODUCTION LEVEL TRIGGER: Scrape on initial load ** //
scrapePageContext();

// ** PRODUCTION LEVEL TRIGGER: 5-Second DOM Polling Safety Net ** //
// This acts as a safety net to catch time boundaries. 
// It is perfectly safe because the Cache Bouncer in background.js protects the API!
setInterval(() => {
  // Stop polling entirely if the extension was reloaded (context is dead)
  if (!contextAlive) return;
  // Only poll if the page isn't already blocked by the physical overlay
  if (!document.getElementById('lamablock-overlay')) {
    scrapePageContext();
  }
}, 5000);

// ** PRODUCTION LEVEL UX: Physical Block Overlay ** //
function showBlockOverlay(commitName) {
  // Prevent duplicate injections
  if (document.getElementById('lamablock-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'lamablock-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #0f0f0f; /* Match the dark Next.js background */
    z-index: 2147483647; /* Maximum z-index to stay on top */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: white;
  `;

  // The inner container matching the "New Block" card vibe
  const card = document.createElement('div');
  card.style.cssText = `
    background-color: #1a1a1a; /* Match the card dark background */
    border: none; /* Removed gray border per user request */
    border-radius: 24px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  `;

  const icon = document.createElement('div');
  // Using a clean, professional Lucide Shield Alert SVG instead of an emoji
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5.96-8.94a1 1 0 0 1 1.93 0C15 2 17 4 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`;
  icon.style.cssText = `
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  `;

  const title = document.createElement('h1');
  title.innerText = 'Focus Session Active';
  title.style.cssText = `
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 10px 0;
    color: #ffffff;
  `;

  const subtitle = document.createElement('p');
  subtitle.innerHTML = `This page is blocked by your "<strong>${commitName}</strong>" commit.<br><br><span id="lamablock-countdown" style="color: #ef4444; font-weight: bold;">Closing tab in 3s...</span>`;
  subtitle.style.cssText = `
    font-size: 16px;
    color: #a1a1aa; /* Gray text */
    margin: 0 0 30px 0;
    line-height: 1.5;
  `;

  const button = document.createElement('button');
  button.innerText = 'Close Tab Now';
  // Send message to background to bypass window.close() restrictions
  button.onclick = () => safeSendMessage({ type: "CLOSE_ACTIVE_TAB" });
  button.style.cssText = `
    background-color: #ef4444; /* Vibrant red from the screenshot */
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.2s;
  `;
  button.onmouseover = () => button.style.backgroundColor = '#dc2626';
  button.onmouseout = () => button.style.backgroundColor = '#ef4444';

  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(button);
  overlay.appendChild(card);

  // Stop scrolling and inject
  document.body.style.overflow = 'hidden';
  document.documentElement.appendChild(overlay);

  // ** PRODUCTION LEVEL LOGIC: Auto-Close Countdown ** //
  let timeLeft = 3;
  const countdownEl = document.getElementById('lamablock-countdown');
  const timer = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      if (countdownEl) countdownEl.innerText = `Closing tab in ${timeLeft}s...`;
    } else {
      clearInterval(timer);
      safeSendMessage({ type: "CLOSE_ACTIVE_TAB" });
    }
  }, 1000);
}

// ** PRODUCTION LEVEL TRIGGER: Listen for Background Worker Requests ** //
// This guarantees we scrape whenever the background worker detects a reliable URL change
try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FORCE_SCRAPE") {
      // Slight delay to allow DOM to finish rendering
      setTimeout(scrapePageContext, 500);
    } else if (message.type === "BLOCK_PAGE") {
      showBlockOverlay(message.commitName);
    }
  });
} catch (e) {
  // Silently handle if extension context is already dead
  contextAlive = false;
}

// ** PRODUCTION LEVEL TRIGGER: LocalHost Storage Synchronization Bridge ** //
// Because the Next.js app runs on http://localhost:3000, it cannot directly access chrome.storage.local.
// We act as a middleman: we watch the webpage's localStorage and sync changes to the extension.
if (window.location.origin === "http://localhost:3000") {
  const syncStorage = () => {
    try {
      const localCommits = localStorage.getItem("cab_commits");
      if (localCommits) {
        const parsed = JSON.parse(localCommits);
        safeSendMessage({ type: "SYNC_COMMITS", commits: parsed });
      }
    } catch (e) {
      // Fail silently if JSON parsing fails
    }
  };

  // Sync immediately when the dashboard is loaded
  syncStorage();

  // Periodically poll for changes (since Next.js might modify localStorage without triggering a window 'storage' event on the same tab)
  let lastState = localStorage.getItem("cab_commits");
  setInterval(() => {
    const currentState = localStorage.getItem("cab_commits");
    if (currentState !== lastState) {
      lastState = currentState;
      syncStorage();
    }
  }, 1000);
}
