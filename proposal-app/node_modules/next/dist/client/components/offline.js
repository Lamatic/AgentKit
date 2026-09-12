/**
 * Centralized offline detection, state management, and retry logic.
 *
 * This module tracks whether the app is offline and provides primitives for
 * retrying failed network requests. It is designed to be extended in the
 * future — e.g., instrumenting module chunk loading, Flight chunk resolution,
 * or eventually being promoted to a React-level feature.
 *
 * All stateful behavior (event listeners, polling, state tracking) only runs
 * in the browser. On the server and during hydration, getOffline() always
 * returns false.
 *
 * ## Known limitation: queued fetches
 *
 * When the user navigates multiple times while offline, each navigation queues
 * a separate fetch that blocks on waitForConnection(). When connectivity is
 * restored, all of them resume and retry simultaneously.
 *
 * Future mitigations:
 * - Stale cache access (PR 3): offline navigations will reuse back-forward
 *   cache entries, so most navigations won't issue new fetches at all. This is
 *   the primary shield against duplicate requests.
 * - Fetch cancellation: on router.refresh(), we could abort pending blocked
 *   fetches since refresh invalidates all dynamic caches.
 */ // Backoff delays for the polling loop: 500ms → 1s → 2s → 3s (cap)
// Timeout for the HEAD connectivity check. If the request doesn't resolve
// within this window, we assume we're still offline. 200ms is more than enough
// — network errors reject almost instantly.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    checkOfflineError: null,
    getOffline: null,
    notifyOnline: null,
    waitForConnection: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    checkOfflineError: function() {
        return checkOfflineError;
    },
    getOffline: function() {
        return getOffline;
    },
    notifyOnline: function() {
        return notifyOnline;
    },
    waitForConnection: function() {
        return waitForConnection;
    }
});
const _scheduler = require("./segment-cache/scheduler");
const _fetch = require("./segment-cache/fetch");
const _approuterheaders = require("./app-router-headers");
const _useoffline = require("./use-offline");
const CONNECTIVITY_CHECK_TIMEOUT_MS = 200;
let offlineState = null;
function checkOfflineError(err) {
    if (err instanceof DOMException) {
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            return false;
        }
    }
    notifyOffline();
    return true;
}
function getOffline() {
    return offlineState;
}
/**
 * Enters the offline state if not already in it, and starts the
 * connectivity polling loop.
 */ function notifyOffline() {
    if (offlineState !== null) {
        return offlineState;
    }
    let resolve;
    const promise = new Promise((r)=>{
        resolve = r;
    });
    offlineState = {
        promise,
        resolve: resolve,
        timeoutHandle: null,
        backoffStep: 0
    };
    (0, _useoffline.dispatchOfflineChange)(true);
    checkConnectivity(offlineState);
    return offlineState;
}
function notifyOnline() {
    if (offlineState === null) {
        return;
    }
    if (offlineState.timeoutHandle !== null) {
        clearTimeout(offlineState.timeoutHandle);
    }
    const resolve = offlineState.resolve;
    offlineState = null;
    resolve();
    (0, _useoffline.dispatchOfflineChange)(false);
    (0, _scheduler.pingPrefetchScheduler)();
}
/**
 * Does a HEAD request to confirm connectivity, then either resolves the
 * offline state or schedules the next check with backoff.
 */ async function checkConnectivity(state) {
    // Cancel any previously scheduled check so we don't end up with
    // parallel polling loops.
    if (state.timeoutHandle !== null) {
        clearTimeout(state.timeoutHandle);
        state.timeoutHandle = null;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), CONNECTIVITY_CHECK_TIMEOUT_MS);
    try {
        // HEAD request to the current page with the RSC header, so we're
        // testing connectivity to the same endpoint that navigations use.
        await (0, _fetch.fetch)(location.href, {
            method: 'HEAD',
            headers: {
                [_approuterheaders.RSC_HEADER]: '1'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        // If the fetch didn't throw, we're back online.
        notifyOnline();
    } catch (err) {
        // If the error is from our own timeout abort, that actually means
        // the request went out and is waiting for a response — i.e., we're
        // back online. A truly offline request fails almost instantly (well
        // within the 200ms timeout).
        if (err instanceof DOMException && err.name === 'AbortError') {
            clearTimeout(timeoutId);
            notifyOnline();
            return;
        }
        // Network error — still offline. Schedule the next check with backoff.
        const delay = state.backoffStep === 0 ? 500 : state.backoffStep === 1 ? 1000 : state.backoffStep === 2 ? 2000 : 3000;
        state.backoffStep++;
        state.timeoutHandle = setTimeout(()=>checkConnectivity(state), delay);
    }
}
function waitForConnection(state) {
    return state.promise;
}
function pingOfflineState() {
    if (offlineState !== null) {
        checkConnectivity(offlineState);
    }
}
// Set up browser event listeners for proactive offline detection.
if (typeof window !== 'undefined') {
    window.addEventListener('offline', notifyOffline);
    window.addEventListener('online', pingOfflineState);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=offline.js.map