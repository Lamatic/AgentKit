document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("dashboard-iframe");
  const loader = document.getElementById("loader-container");
  const statusText = document.getElementById("status-text");
  
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const saveSettingsBtn = document.getElementById("save-settings-btn");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const nextUrlInput = document.getElementById("next-url");

  let nextAppUrl = "http://localhost:3000";
  let scrapedReviews = [];

  // 1. Load config and initialize
  chrome.storage.local.get(["nextAppUrl"], (result) => {
    if (result.nextAppUrl) {
      nextAppUrl = result.nextAppUrl;
    }
    nextUrlInput.value = nextAppUrl;
    
    // Load the popup page from the Next.js app in the iframe
    iframe.src = `${nextAppUrl}/popup`;
    statusText.textContent = "Connecting to Next.js dashboard...";
  });

  // 2. Settings button handlers
  settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("active");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsPanel.classList.remove("active");
  });

  saveSettingsBtn.addEventListener("click", () => {
    let url = nextUrlInput.value.trim();
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    if (url) {
      nextAppUrl = url;
      chrome.storage.local.set({ nextAppUrl: url }, () => {
        console.log("Next.js App URL saved:", url);
        settingsPanel.classList.remove("active");
        
        // Reload iframe with new URL
        loader.style.display = "flex";
        statusText.textContent = "Reconnecting...";
        iframe.src = `${nextAppUrl}/popup`;
      });
    }
  });

  // 3. Listen to messages from the Next.js iframe dashboard
  window.addEventListener("message", (event) => {
    // Only accept messages from the configured Next.js app URL
    if (!event.origin.startsWith(nextAppUrl)) return;

    const message = event.data;

    if (message.type === "IFRAME_READY") {
      console.log("Iframe ready. Initiating scrape...");
      statusText.textContent = "Scraping page reviews...";
      
      // Trigger review scraping on active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          showError("No active tab found.");
          return;
        }

        const activeTab = tabs[0];
        
        // Ensure we are on an HTTP/HTTPS webpage
        if (!activeTab.url || !activeTab.url.startsWith("http")) {
          showError("Scraper only works on product websites.");
          return;
        }

        chrome.tabs.sendMessage(activeTab.id, { action: "scrapeReviews" }, (response) => {
          // Handle potential runtime errors (e.g. content script not loaded yet)
          if (chrome.runtime.lastError) {
            console.warn("Content script error:", chrome.runtime.lastError);
            showError("Could not start scraper. Please refresh the page and try again.");
            return;
          }

          if (response && response.success && response.reviews && response.reviews.length > 0) {
            scrapedReviews = response.reviews;
            console.log(`Sending ${scrapedReviews.length} reviews to Next.js`);
            
            // Hide the loader to let Next.js dashboard display its loading state
            loader.style.display = "none";
            
            // Forward scraped reviews to the Next.js app inside the iframe
            iframe.contentWindow.postMessage({
              type: "REVIEWS_SCRAPED",
              reviews: scrapedReviews
            }, nextAppUrl);
          } else {
            showError("No product reviews detected on this page.");
          }
        });
      });
    }
  });

  function showError(msg) {
    loader.style.display = "flex";
    const spinner = loader.querySelector(".spinner");
    if (spinner) spinner.style.display = "none";
    statusText.textContent = msg;
    statusText.style.color = "#ef4444";
  }
});
