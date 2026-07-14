chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "http://localhost:3000"
  });
});

// ** PRODUCTION LEVEL LOGIC: Schedule Parsers & Validators ** //

// Convert time strings like "09:00 AM" or "5:30 PM" to minutes from midnight
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

// Check if a block commit is currently active based on current time and active days
function isCommitCurrentlyActive(commit) {
  const now = new Date();
  
  // 1. Check if today is one of the active days (e.g. 'mon', 'tue')
  const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = daysMap[now.getDay()];
  if (!commit.activeDays || !commit.activeDays.includes(currentDay)) {
    return false;
  }
  
  // 2. Check if current time falls within any time window
  if (!commit.timeWindows || commit.timeWindows.length === 0) {
    return true; // No time windows means active all day
  }
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  return commit.timeWindows.some(window => {
    const startMins = parseTimeToMinutes(window.start);
    const endMins = parseTimeToMinutes(window.end);
    
    if (startMins <= endMins) {
      // Standard window: e.g. 9:00 AM to 5:00 PM
      return currentMinutes >= startMins && currentMinutes <= endMins;
    } else {
      // Overnight window: e.g. 10:00 PM to 2:00 AM (crosses midnight)
      return currentMinutes >= startMins || currentMinutes <= endMins;
    }
  });
}

// ** PRODUCTION LEVEL LOGIC: Mock AI Evaluation (Immediate for Debugging) ** //
const evaluateContext = async (payload, tabId) => {
  // ** PRODUCTION LEVEL DB QUERY: Retrieve rules from Chrome local storage ** //
  chrome.storage.local.get(['cab_commits'], async (result) => {
    const commits = result.cab_commits || [];
    
    // ** PRODUCTION LEVEL VALIDATION: Check if current domain is statically blocked ** //
    let isStaticallyBlocked = false;
    let matchingCommitTitle = "";
    const activeBlockedDomains = [];
    const inactiveCommitDetails = [];

    try {
      const currentUrlObj = new URL(payload.url);
      const currentHost = currentUrlObj.hostname.toLowerCase();

      for (const commit of commits) {
        // ** PRODUCTION LEVEL CHECK: Only enforce rule if the block schedule is currently active ** //
        if (!isCommitCurrentlyActive(commit)) {
          inactiveCommitDetails.push(`${commit.title} (Inactive now)`);
          continue;
        }

        if (!commit.blockedWebsites) continue;

        for (const web of commit.blockedWebsites) {
          if (!web.selected) continue;

          // Clean blocked URL to match hostname format (e.g., "youtube.com")
          const cleanBlockedUrl = web.url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
          activeBlockedDomains.push(`${cleanBlockedUrl} (from "${commit.title}")`);
          
          if (currentHost === cleanBlockedUrl || currentHost.endsWith('.' + cleanBlockedUrl)) {
            isStaticallyBlocked = true;
            matchingCommitTitle = commit.title;
          }
        }
      }
    } catch (e) {
      // Fallback simple string match if URL parsing fails
      commits.forEach(commit => {
        if (!isCommitCurrentlyActive(commit)) {
          inactiveCommitDetails.push(`${commit.title} (Inactive now)`);
          return;
        }

        commit.blockedWebsites?.forEach(web => {
          if (web.selected) {
            activeBlockedDomains.push(`${web.url} (from "${commit.title}")`);
            if (payload.url.toLowerCase().includes(web.url.toLowerCase())) {
              isStaticallyBlocked = true;
              matchingCommitTitle = commit.title;
            }
          }
        });
      });
    }

    // ** PRODUCTION LEVEL LOGGING: Log validation decision to internal console and terminal bridge ** //
    console.log("=========================================");
    console.log("🧠 [AI ENGINE] Evaluating Context:");
    console.log("🔗 URL:", payload.url);
    console.log("🏷️ Title:", payload.title);
    if (payload.h1Text) console.log("📝 H1:", payload.h1Text);
    console.log("🗄️ Active DB Rules:", activeBlockedDomains.join(", ") || "None");
    if (inactiveCommitDetails.length > 0) {
      console.log("💤 Scheduled Blocks (Sleeping):", inactiveCommitDetails.join(", "));
    }
    
    if (isStaticallyBlocked) {
      console.log(`❌ STATUS: BLOCKED (Matched static rule in Block: "${matchingCommitTitle}")`);
      // ** PRODUCTION LEVEL UX: Send block command to the active tab ** //
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          type: "BLOCK_PAGE",
          commitName: matchingCommitTitle
        }).catch(() => {});
      }
    } else {
      console.log("✅ STATUS: PASS");
    }
    console.log("=========================================");

    // Send status to Next.js API terminal bridge
    try {
      await fetch("http://localhost:3000/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          dbRules: activeBlockedDomains,
          sleepingBlocks: inactiveCommitDetails,
          status: isStaticallyBlocked ? `BLOCKED ("${matchingCommitTitle}")` : "PASS"
        })
      });
    } catch (err) {
      // Silently fail if the dev server isn't running
    }
  });
};

// ** PRODUCTION LEVEL LOGIC: Message Listener ** //
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PAGE_CONTEXT_SCRAPED") {
    evaluateContext(message.payload, sender.tab?.id);
  } else if (message.type === "SYNC_COMMITS") {
    // ** PRODUCTION LEVEL SYNC: Bridge Next.js localStorage to Chrome Extension storage ** //
    chrome.storage.local.set({ cab_commits: message.commits }, () => {
      console.log("🔄 [SYNC] Synchronized commits from LocalHost Dashboard to Chrome Storage!");
    });
  } else if (message.type === "CLOSE_ACTIVE_TAB") {
    // ** PRODUCTION LEVEL UX: Programmatically close the blocked tab ** //
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id).catch(() => {});
    }
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
