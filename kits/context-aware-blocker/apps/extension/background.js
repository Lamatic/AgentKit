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

// ** PRODUCTION LEVEL LOGIC: In-Memory Promise Cache ** //
const aiEvaluationCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

// ** PRODUCTION LEVEL LOGIC: Mock AI Evaluation ** //
const evaluateContext = async (payload, tabId) => {
  chrome.storage.local.get(['cab_commits'], async (result) => {
    const commits = result.cab_commits || [];
    
    // ========================================================
    // STEP 1: THE FREE CHECKS (Time & Static Domains)
    // ========================================================
    let isAnyCommitActive = false;
    let isStaticallyBlocked = false;
    let matchingCommitTitle = "";
    const activeBlockedDomains = [];
    const inactiveCommitDetails = [];

    try {
      const currentUrlObj = new URL(payload.url);
      const currentHost = currentUrlObj.hostname.toLowerCase();

      for (const commit of commits) {
        if (!isCommitCurrentlyActive(commit)) {
          inactiveCommitDetails.push(`${commit.title} (Inactive)`);
          continue;
        }

        // If we reach here, at least one commit is currently active!
        isAnyCommitActive = true;

        if (!commit.blockedWebsites) continue;

        for (const web of commit.blockedWebsites) {
          if (!web.selected) continue;

          // Clean blocked URL to match hostname format
          const cleanBlockedUrl = web.url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
          activeBlockedDomains.push(`${cleanBlockedUrl} (from "${commit.title}")`);
          
          if (currentHost === cleanBlockedUrl || currentHost.endsWith('.' + cleanBlockedUrl)) {
            isStaticallyBlocked = true;
            matchingCommitTitle = commit.title;
          }
        }
      }
    } catch (e) {
      // Fallback simple string match
      commits.forEach(commit => {
        if (!isCommitCurrentlyActive(commit)) {
          inactiveCommitDetails.push(`${commit.title} (Inactive)`);
          return;
        }
        isAnyCommitActive = true;

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

    console.log("=========================================");
    console.log("🧠 [AI ENGINE] Evaluating Context for:", payload.url);

    // ** PRODUCTION LEVEL LOGGING: Terminal Bridge Helper ** //
    const logToTerminal = async (logPayload) => {
      try {
        await fetch("http://localhost:3000/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logPayload)
        });
      } catch (err) {} // Silently fail if dev server isn't running
    };

    // Scenario 1: Time is inactive
    if (!isAnyCommitActive) {
      console.log(`✅ STATUS: PASS (No active focus sessions right now)`);
      if (inactiveCommitDetails.length > 0) {
        console.log(`💤 Sleeping Blocks: ${inactiveCommitDetails.join(", ")}`);
      }
      console.log("=========================================");
      logToTerminal({
        ...payload,
        sleepingBlocks: inactiveCommitDetails,
        status: "PASS (No active focus sessions)"
      });
      return; // Stop instantly. Nothing is cached.
    }

    // Scenario 2: Time is active, and domain is explicitly blocked
    if (isStaticallyBlocked) {
      console.log(`❌ STATUS: BLOCKED (Matched static rule in: "${matchingCommitTitle}")`);
      console.log("=========================================");
      logToTerminal({
        ...payload,
        dbRules: activeBlockedDomains,
        status: `BLOCKED (Static rule: "${matchingCommitTitle}")`
      });
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          type: "BLOCK_PAGE",
          commitName: matchingCommitTitle
        }).catch(() => {});
      }
      return; // Stop instantly. Zero AI money spent. Nothing is cached.
    }

    // ========================================================
    // STEP 2: THE BOUNCER CACHE (Only reached if time is Active AND site is Unknown)
    // ========================================================
    const now = Date.now();
    if (aiEvaluationCache.has(payload.url)) {
      const cached = aiEvaluationCache.get(payload.url);
      if (now - cached.timestamp < CACHE_TTL_MS) {
        console.log(`🛑 [CACHE HIT] Already evaluated. Skipping expensive AI call!`);
        console.log("=========================================");
        logToTerminal({
          ...payload,
          dbRules: activeBlockedDomains,
          status: "🛑 CACHE HIT (Skipped AI call, saved money!)"
        });
        return cached.promise; // Stop instantly.
      }
    }

    // ========================================================
    // STEP 3: THE EXPENSIVE AI CALL
    // ========================================================
    console.log(`🤖 [AI EVALUATION] New unknown URL. Sending to Lamatic AI...`);
    
    const evaluationPromise = new Promise(async (resolve) => {
      // Send status to Next.js API terminal bridge (Mocking the AI call for now)
      logToTerminal({
        ...payload,
        dbRules: activeBlockedDomains,
        status: "🤖 AI EVALUATING (Mock PASS)"
      });
      
      resolve("PASS");
    });

    // Save it in the cache so the next 5-second tick gets blocked at Step 2!
    aiEvaluationCache.set(payload.url, {
      timestamp: now,
      promise: evaluationPromise
    });

    console.log("=========================================");
    return evaluationPromise;
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
