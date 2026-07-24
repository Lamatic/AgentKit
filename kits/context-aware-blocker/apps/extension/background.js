// ** PRODUCTION LEVEL: Authentication ** //
// The API now authenticates this extension via the chrome-extension:// origin.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "http://localhost:3000"
  });
});

// ** PRODUCTION LEVEL LOGIC: Debounce state for rapid tab switching ** //
const aiDebounceTimers = new Map(); // tabId -> timerId
const aiActiveEvalTokens = new Map(); // tabId -> symbol


// ** PRODUCTION LEVEL LOGIC: Schedule Parsers & Validators ** //

/**
 * Converts a formatted 12-hour time string into total minutes from midnight.
 * 
 * @param {string} timeStr - The time string to parse (e.g., "09:00 AM", "5:30 PM").
 * @returns {number} The time represented as total minutes elapsed since 00:00.
 */
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

/**
 * Evaluates whether a specific focus block (commit) is currently active.
 * 
 * Checks both the active days array and the specific time windows. Handles 
 * standard daytime windows as well as overnight windows crossing midnight.
 * 
 * @param {Object} commit - The focus block configuration object.
 * @returns {boolean} True if the current system time falls within the block's schedule.
 */
function isCommitCurrentlyActive(commit) {
  const now = new Date();
  const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = daysMap[now.getDay()];
  const prevDay = daysMap[(now.getDay() - 1 + 7) % 7];
  
  if (!commit.timeWindows || commit.timeWindows.length === 0) {
    return commit.activeDays && commit.activeDays.includes(currentDay);
  }
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  return commit.timeWindows.some(window => {
    const startMins = parseTimeToMinutes(window.start);
    const endMins = parseTimeToMinutes(window.end);
    
    if (startMins <= endMins) {
      return currentMinutes >= startMins && currentMinutes <= endMins && commit.activeDays?.includes(currentDay);
    } else {
      if (currentMinutes >= startMins && commit.activeDays?.includes(currentDay)) return true;
      if (currentMinutes <= endMins && commit.activeDays?.includes(prevDay)) return true;
      return false;
    }
  });
}

// ** PRODUCTION LEVEL LOGIC: Rule-Aware In-Memory Cache ** //
// Unlike a TTL-based cache, this cache has NO expiry timer.
// Each entry is linked to a hash of the active rules at evaluation time.
// If the rules change (commit added/deleted), the hash changes,
// causing an automatic cache MISS — so the AI re-evaluates.
// When SYNC_COMMITS fires, the entire cache is nuked as a safety net.
const aiEvaluationCache = new Map();
// Key: URL hostname (e.g. "youtube.com")
// Value: { decision: "BLOCK"|"PASS", rulesHash: string, commitTitle: string }

// ** PRODUCTION LEVEL: Generate a deterministic hash of the active rules ** //
// This is used as part of the cache key so that when rules change,
// all cached decisions automatically become stale.
function generateRulesHash(commits) {
  const activeRules = [];
  for (const commit of commits) {
    if (!isCommitCurrentlyActive(commit)) continue;
    // Include static blocked websites in hash
    if (commit.blockedWebsites) {
      for (const web of commit.blockedWebsites) {
        if (web.selected) activeRules.push(web.url.toLowerCase());
      }
    }
    // Include AI rules in hash so cache invalidates when AI rules change
    if (commit.aiRules) {
      for (const rule of commit.aiRules) {
        activeRules.push(`ai:${rule.toLowerCase()}`);
      }
    }
  }
  return activeRules.sort().join('|');
}

// ** PRODUCTION LEVEL LOGIC: Real AI Evaluation Engine ** //
const evaluateContext = async (payload, tabId) => {
  chrome.storage.local.get(['cab_commits'], async (result) => {
    const commits = result.cab_commits || [];
    
    // ========================================================
    // STEP 0: WHITELIST (Never block our own dashboard)
    // ========================================================
    try {
      const pageUrl = new URL(payload.url);
      if (pageUrl.origin === "http://localhost:3000" || pageUrl.origin === "http://127.0.0.1:3000") {
        console.log(`✅ STATUS: PASS (Whitelisted LamaBlock Dashboard)`);
        return; // Instantly allow
      }
    } catch (e) {}

    // ========================================================
    // STEP 1: THE FREE CHECKS (Time & Static Domains)
    // ========================================================
    let isAnyCommitActive = false;
    let isStaticallyBlocked = false;
    let matchingCommitTitle = "";
    const activeBlockedDomains = [];
    const activeAiRules = []; // ** PRODUCTION LEVEL: Collect natural language AI rules **
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

        // Collect AI rules (natural language blocking instructions)
        if (commit.aiRules && commit.aiRules.length > 0) {
          for (const rule of commit.aiRules) {
            activeAiRules.push(`${rule} (from "${commit.title}")`);
          }
        }

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

        // Collect AI rules from fallback path
        if (commit.aiRules && commit.aiRules.length > 0) {
          commit.aiRules.forEach(rule => activeAiRules.push(`${rule} (from "${commit.title}")`));
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

    console.log("\n=========================================");
    console.log("🧠 [AI ENGINE] Evaluating Context:");
    console.log("   🔗 URL:", payload.url);
    console.log("   🏷️  Title:", payload.title || "(none)");
    console.log("   📝 H1:", payload.h1Text || "(none)");
    console.log("   📄 Meta:", payload.description || "(none)");
    console.log("   📊 Total Commits:", commits.length, "| Active:", commits.filter(c => isCommitCurrentlyActive(c)).length);
    console.log("   🗄️  Active Blocked Domains:", activeBlockedDomains.length > 0 ? activeBlockedDomains.join(", ") : "(none)");
    console.log("   🤖 Active AI Rules:", activeAiRules.length > 0 ? activeAiRules.join(", ") : "(none)");
    console.log("   💾 Cache Size:", aiEvaluationCache.size, "entries");

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
        aiRules: activeAiRules,
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

    // Scenario 2.5: Time is active, but NO rules (static or AI) are defined yet
    if (activeBlockedDomains.length === 0 && activeAiRules.length === 0) {
      console.log(`✅ STATUS: PASS (Active session, but no rules defined yet)`);
      console.log("=========================================");
      logToTerminal({
        ...payload,
        status: "PASS (Active session, but no rules defined)"
      });
      return; // Stop instantly. Zero AI money spent.
    }

    // ========================================================
    // STEP 2: THE RULE-AWARE BOUNCER CACHE
    // No TTL. Cache lives and dies with the rules themselves.
    // ========================================================
    const currentRulesHash = generateRulesHash(commits);
    console.log("   🔑 Current Rules Hash:", currentRulesHash || "(empty)");

    if (aiEvaluationCache.has(payload.url)) {
      const cached = aiEvaluationCache.get(payload.url);

      // Only trust the cache if the rules haven't changed since evaluation
      if (cached.rulesHash === currentRulesHash) {
        console.log(`🛑 [CACHE HIT] Decision: ${cached.decision}`);
        console.log(`   📦 Cached Rules Hash: ${cached.rulesHash}`);
        console.log(`   💰 API call saved!`);
        console.log("=========================================");
        logToTerminal({
          ...payload,
          dbRules: activeBlockedDomains,
          aiRules: activeAiRules,
          status: `🛑 CACHE HIT: ${cached.decision} (Saved money!)`
        });

        // If the cached decision was BLOCK, enforce it again
        if (cached.decision === "BLOCK" && tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: "BLOCK_PAGE",
            commitName: cached.commitTitle || "Focus Session"
          }).catch(() => {});
        }
        return; // Stop instantly. Zero API money spent.
      } else {
        // Rules changed! Invalidate this specific cache entry.
        console.log(`♻️ [CACHE STALE] Rules changed since last evaluation. Re-evaluating...`);
        aiEvaluationCache.delete(payload.url);
      }
    }

    // ========================================================
    // STEP 3: THE REAL LAMATIC AI CALL
    // Only reached for genuinely new/unknown URLs with current rules.
    // ========================================================
    
    // Define the actual evaluation function
    const executeAiEvaluation = async () => {
      console.log(`🤖 [AI EVALUATION] New unknown URL. Sending to Lamatic AI...`);
      console.log(`   📤 Payload being sent:`);
      console.log(`      url: ${payload.url}`);
      console.log(`      title: ${payload.title}`);
      console.log(`      h1: ${payload.h1Text || ""}`);
      console.log(`      meta: ${payload.description || ""}`);
      console.log(`      activeRules: ${activeBlockedDomains.join(", ")}`);
      const aiStartTime = Date.now();
      logToTerminal({
        ...payload,
        dbRules: activeBlockedDomains,
        aiRules: activeAiRules,
        status: "🤖 AI EVALUATING (Calling Lamatic AI...)"
      });

      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type: "SHOW_AI_EVALUATING" }).catch(() => {});
      }

      const evalToken = Symbol();
      if (tabId) aiActiveEvalTokens.set(tabId, evalToken);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch("http://localhost:3000/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: payload.url,
            title: payload.title,
            h1Text: payload.h1Text || "",
            description: payload.description || "",
            dbRules: activeBlockedDomains,
            aiRules: activeAiRules
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) throw new Error(result.error);

        if (tabId && aiActiveEvalTokens.get(tabId) !== evalToken) {
          console.log("Tab navigated or superseded. Ignoring response.");
          return;
        }
        if (currentRulesHash !== generateRulesHash(commits)) {
          console.log("Rules changed while waiting for AI. Ignoring response.");
          return;
        }

        const decision = result.action || "PASS";
        const aiDuration = Date.now() - aiStartTime;

        console.log(`🎯 [AI DECISION] ${decision} for ${payload.url}`);
        console.log(`   ⏱️  Lamatic responded in ${aiDuration}ms`);
        console.log(`   📥 Full API response: ${JSON.stringify(result)}`);
        console.log("=========================================");

        // ** PRODUCTION LEVEL: Store in rule-aware cache ** //
        aiEvaluationCache.set(payload.url, {
          decision: decision,
          rulesHash: currentRulesHash,
          commitTitle: "Focus Session"
        });

        logToTerminal({
          ...payload,
          dbRules: activeBlockedDomains,
          aiRules: activeAiRules,
          status: `🎯 AI DECISION: ${decision}`
        });

        // ** PRODUCTION LEVEL: Enforce the BLOCK if AI says so ** //
        if (decision === "BLOCK" && tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: "BLOCK_PAGE",
            commitName: "AI Detected Distraction"
          }).catch(() => {});
        } else if (decision === "PASS" && tabId) {
          chrome.tabs.sendMessage(tabId, { type: "HIDE_AI_EVALUATING" }).catch(() => {});
        }
      } catch (err) {
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: "HIDE_AI_EVALUATING" }).catch(() => {});
        }
        // ** PRODUCTION LEVEL: Fail-Open ** //
        console.error("AI Evaluation failed:", err);
        logToTerminal({
          ...payload,
          dbRules: activeBlockedDomains,
          status: "❌ AI ERROR: Failed to reach API (Fail-Open PASS)"
        });
      }
    };

    // Apply Debounce
    if (tabId) {
      if (aiDebounceTimers.has(tabId)) {
        clearTimeout(aiDebounceTimers.get(tabId));
      }
      const timerId = setTimeout(() => {
        aiDebounceTimers.delete(tabId);
        executeAiEvaluation();
      }, 1000); // 1-second debounce
      aiDebounceTimers.set(tabId, timerId);
    } else {
      // If there's no tabId context (unlikely), evaluate immediately
      executeAiEvaluation();
    }
  });
};

// ** PRODUCTION LEVEL LOGIC: Message Listener ** //
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PAGE_CONTEXT_SCRAPED") {
    evaluateContext(message.payload, sender.tab?.id);
  } else if (message.type === "SYNC_COMMITS") {
    // ** PRODUCTION LEVEL SYNC: Bridge Next.js localStorage to Chrome Extension storage ** //
    // When commits change (added/deleted), nuke the entire AI cache.
    // This is the safety net that guarantees no stale BLOCK decisions persist
    // after a user deletes a focus commitment.
    aiEvaluationCache.clear();
    console.log("🧹 [CACHE] Cleared entire AI cache (commits changed)");
    chrome.storage.local.set({ cab_commits: message.commits }, () => {
      console.log("🔄 [SYNC] Synchronized commits from LocalHost Dashboard to Chrome Storage!");
    });
  } else if (message.type === "SYNC_LOCK_SETTINGS") {
    // ** PRODUCTION LEVEL SYNC: Bridge lock settings **
    chrome.storage.local.set({ lama_lock_settings: message.settings }, () => {
      console.log("🔒 [SYNC] Synchronized Lock Settings to Chrome Storage!");
    });
  } else if (message.type === "CLOSE_ACTIVE_TAB") {
    // ** PRODUCTION LEVEL UX: Programmatically close the blocked tab ** //
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id).catch(() => {});
    }
  }
});

/**
 * Hook into Chrome Tab Navigation.
 * This is much more reliable than relying purely on client-side MutationObservers
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

  // ** PRODUCTION LEVEL FEATURE: Strict Lock Enforcement ** //
  // This check runs on EVERY onUpdated event (not just URL change or 'complete')
  // because chrome:// pages have unpredictable event timing.
  // We check both changeInfo.url (freshest source) and tab.url (fallback).
  const currentUrl = changeInfo.url || tab.url || "";
  if (currentUrl.startsWith("chrome://extensions")) {
    const saved = await new Promise((resolve) => {
      chrome.storage.local.get(["lama_lock_settings"], (result) => {
        resolve(result.lama_lock_settings);
      });
    });

    if (saved) {
      try {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        if (parsed.date && parsed.time) {
          const lockTimestamp = new Date(`${parsed.date}T${parsed.time}`).getTime();
          if (Date.now() < lockTimestamp) {
            // HACK: chrome.tabs.update() cannot redirect chrome:// pages.
            // Close the tab and open a fresh one with our lock page.
            chrome.tabs.remove(tabId);
            chrome.tabs.create({ url: chrome.runtime.getURL("strict.html") });
            return;
          }
        }
      } catch (e) {}
    }
  }

  // Normal content scraping — only trigger on URL change or page load complete
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
