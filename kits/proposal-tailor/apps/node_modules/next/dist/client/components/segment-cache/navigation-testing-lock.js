/**
 * Navigation lock for the Instant Navigation Testing API.
 *
 * Manages the in-memory lock (a promise) that gates dynamic data writes
 * during instant navigation captures, and owns all cookie state
 * transitions (pending → captured-MPA, pending → captured-SPA).
 *
 * External actors (Playwright, devtools) set [0] to start a lock scope
 * and delete the cookie to end one. Next.js writes captured values.
 * The CookieStore handler distinguishes them by value: pending = external,
 * captured = self-write (ignored).
 *
 * This module assumes the Instant Navigation Testing API is enabled. When it
 * is disabled, the bundler resolves this module to
 * `./navigation-testing-lock.disabled` instead (see
 * `create-compiler-aliases.ts` for webpack and
 * `crates/next-core/src/next_import_map.rs` for Turbopack), so none of this
 * code ships in the browser bundle.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    beginLockedNavigation: null,
    beginNavigationLockPrefetch: null,
    getCurrentNavigationGate: null,
    getNavigationLockSegmentCacheMap: null,
    getPreLockFetch: null,
    isNavigationLocked: null,
    resetNavigationLockToPending: null,
    resolveNavigationLockPrefetch: null,
    shouldRestrictNavigationToShell: null,
    startListeningForInstantNavigationCookie: null,
    updateCapturedSPAToTree: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    beginLockedNavigation: function() {
        return beginLockedNavigation;
    },
    beginNavigationLockPrefetch: function() {
        return beginNavigationLockPrefetch;
    },
    getCurrentNavigationGate: function() {
        return getCurrentNavigationGate;
    },
    getNavigationLockSegmentCacheMap: function() {
        return getNavigationLockSegmentCacheMap;
    },
    getPreLockFetch: function() {
        return getPreLockFetch;
    },
    isNavigationLocked: function() {
        return isNavigationLocked;
    },
    resetNavigationLockToPending: function() {
        return resetNavigationLockToPending;
    },
    resolveNavigationLockPrefetch: function() {
        return resolveNavigationLockPrefetch;
    },
    shouldRestrictNavigationToShell: function() {
        return shouldRestrictNavigationToShell;
    },
    startListeningForInstantNavigationCookie: function() {
        return startListeningForInstantNavigationCookie;
    },
    updateCapturedSPAToTree: function() {
        return updateCapturedSPAToTree;
    }
});
const _approutertypes = require("../../../shared/lib/app-router-types");
const _approuterheaders = require("../app-router-headers");
const _useactionqueue = require("../use-action-queue");
const _scheduler = require("./scheduler");
const _cachemap = require("./cache-map");
function parseCookieValue(raw) {
    if (raw === '') {
        return 'empty';
    }
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            if (parsed.length >= 3) {
                const rawState = parsed[2];
                return rawState === null ? 'mpa' : 'spa';
            }
        }
    } catch  {}
    return 'pending';
}
function writeDocumentCookie(value, options) {
    if (typeof document === 'undefined') {
        return;
    }
    let cookie = `${_approuterheaders.NEXT_INSTANT_TEST_COOKIE}=${JSON.stringify(value)}; Path=${options.path ?? '/'}`;
    if (options.domain) {
        cookie += `; Domain=${options.domain}`;
    }
    document.cookie = cookie;
}
function writeCookieValue(value) {
    if (typeof cookieStore === 'undefined') {
        return;
    }
    // Read the existing cookie to preserve its attributes (domain, path), then
    // write back with the new value. This updates the same cookie entry that the
    // external actor created, regardless of how it was scoped. The read goes
    // through `cookieStore.get` because `document.cookie` exposes only names and
    // values, not the domain/path we need to preserve. The write goes through
    // document.cookie because WebKit exposes Cookie Store on localhost but does
    // not commit cookies written through cookieStore.set() there.
    //
    // Capture the current lockState and compare it in the callback so we only
    // write if the lock we observed at call time is still held. This guards
    // against two races: (a) the scope ended between get and set (lockState is
    // now null), and (b) the scope ended and a new one was acquired in the same
    // gap (lockState is a different object). In either case we must not write —
    // doing so would leak stale state into the next scope or outlive the current
    // one. It cannot close one window, though: the callback can run after an
    // external delete but before the deleted-event handler nulls lockState, so
    // the guard still passes and we resurrect the cookie. The deleted handler
    // clears any such entry once the lock is released (see the `event.deleted`
    // loop below).
    const lockAtCall = lockState;
    cookieStore.get(_approuterheaders.NEXT_INSTANT_TEST_COOKIE).then((existing)=>{
        if (existing && lockState === lockAtCall && lockAtCall !== null) {
            writeDocumentCookie(value, existing);
        }
    });
}
let lockState = null;
function getPreLockFetch() {
    return lockState !== null ? lockState.fetch : null;
}
function beginNavigationLockPrefetch() {
    if (lockState !== null) {
        let resolve;
        const promise = new Promise((r)=>{
            resolve = r;
        });
        const prefetch = {
            promise,
            resolve: resolve
        };
        lockState.activePrefetches.add(prefetch);
        return prefetch;
    }
    return null;
}
function getNavigationLockSegmentCacheMap() {
    return lockState !== null ? lockState.segmentCacheMap : null;
}
function resolveNavigationLockPrefetch(prefetch) {
    if (lockState !== null) {
        lockState.activePrefetches.delete(prefetch);
    }
    prefetch.resolve();
}
function acquireLock() {
    if (lockState !== null) {
        return;
    }
    let resolveReleased;
    const released = new Promise((r)=>{
        resolveReleased = r;
    });
    let resolveCurrentNavigation;
    const currentNavigation = new Promise((r)=>{
        resolveCurrentNavigation = r;
    });
    lockState = {
        released,
        resolveReleased: resolveReleased,
        fetch: window.fetch,
        activePrefetches: new Set(),
        segmentCacheMap: (0, _cachemap.createCacheMap)(),
        currentNavigation,
        resolveCurrentNavigation: resolveCurrentNavigation
    };
    // Install the fetch blocker. We only intercept `window.fetch` for the
    // duration of the lock so that — outside of a testing scope — user-
    // installed overrides of `window.fetch` are untouched.
    window.fetch = globalFetchOverride;
}
function releaseLock() {
    if (lockState === null) {
        return;
    }
    // Restore the pre-lock `window.fetch` before resolving the lock promise
    // so any fetches queued on the promise see the restored fetch.
    window.fetch = lockState.fetch;
    const { resolveReleased, activePrefetches, resolveCurrentNavigation } = lockState;
    lockState = null;
    // Force-resolve every prefetch that hasn't finished, so a navigation still
    // waiting on one doesn't hang now that the scope is ending.
    for (const prefetch of activePrefetches){
        prefetch.resolve();
    }
    // Resolve the current locked navigation's withheld-data gate, so its gated
    // dynamic write unblocks now that the scope is ending.
    resolveCurrentNavigation();
    // Resolve the release promise so blocked out-of-band fetches dispatch too.
    resolveReleased();
}
function beginLockedNavigation() {
    if (lockState === null) {
        return null;
    }
    // Release the previous locked navigation's withheld data, then roll over to a
    // fresh gate for this navigation — all without ending the scope.
    lockState.resolveCurrentNavigation();
    let resolveCurrentNavigation;
    const currentNavigation = new Promise((r)=>{
        resolveCurrentNavigation = r;
    });
    lockState.currentNavigation = currentNavigation;
    lockState.resolveCurrentNavigation = resolveCurrentNavigation;
    return currentNavigation;
}
function resetNavigationLockToPending() {
    if (lockState === null || typeof document === 'undefined') {
        return;
    }
    releaseLock();
    acquireLock();
    writeCookieValue([
        0,
        `c${Math.random()}`
    ]);
}
/**
 * Returns true if the request targets a dev-server endpoint — one of the
 * hot-reloader middleware routes (error overlay, source maps, launch-editor,
 * devtools). They all share the `/__nextjs_` path prefix and are always
 * requested root-relative on the same origin.
 */ function isDevServerRequest(input) {
    let url;
    try {
        url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url, window.location.href);
    } catch  {
        return false;
    }
    return url.origin === window.location.origin && url.pathname.startsWith('/__nextjs_');
}
/**
 * Global fetch override
 *
 * While the navigation lock is active, we install this as `window.fetch` so
 * out-of-band client-side fetches (e.g. `fetch('/api/data')` inside a
 * useEffect) are blocked until the lock is released. Next.js internals
 * bypass the override by importing `fetch` from `./fetch`, which reads the
 * captured pre-lock fetch via `getPreLockFetch`.
 *
 * NOTE: This override only affects environments where the Instant Navigation
 * Testing API is enabled. It has no impact on live production behavior.
 */ function globalFetchOverride(input, init) {
    if (lockState === null) {
        // Lock is not active. Fall through to the global fetch — we reach this
        // only if a caller captured a reference to this function during a lock
        // scope and invoked it after release.
        return fetch(input, init);
    }
    if (process.env.__NEXT_DEV_SERVER && isDevServerRequest(input)) {
        // Dev-server requests must not be gated on the testing lock — blocking
        // them would break the error overlay, source maps, and devtools for the
        // whole scope. Dispatch immediately through the pre-lock fetch. Copy to a
        // local so the call doesn't bind `this` to the lock state object (native
        // fetch throws "Illegal invocation" for a foreign receiver).
        const preLockFetch = lockState.fetch;
        return preLockFetch(input, init);
    }
    // Block user-initiated fetches until the lock is released, then dispatch
    // through the fetch captured at acquire time. Reading from `lockState`
    // (rather than `window.fetch`) pins to the capture even if `window.fetch`
    // is reassigned after release.
    const currentLock = lockState;
    return currentLock.released.then(()=>{
        const preLockFetch = currentLock.fetch;
        return preLockFetch(input, init);
    });
}
function startListeningForInstantNavigationCookie() {
    // If the server served a shell, this is an MPA page load
    // while the lock is held. Transition to captured-MPA and acquire.
    if (self.__next_instant_test) {
        if (typeof cookieStore !== 'undefined') {
            // If the cookie was already cleared during the MPA page
            // transition, reload to get the full dynamic page.
            cookieStore.get(_approuterheaders.NEXT_INSTANT_TEST_COOKIE).then((cookie)=>{
                if (!cookie) {
                    window.location.reload();
                }
            });
        }
        // Acquire the lock before writing the cookie. writeCookieValue's
        // guard requires lockState to be non-null at call time (so a stale
        // write can't outlive its scope). On a fresh page load that scope
        // is the one we're about to establish, so we have to establish it
        // first.
        acquireLock();
        writeCookieValue([
            1,
            `c${Math.random()}`,
            null
        ]);
    }
    if (typeof cookieStore === 'undefined') {
        return;
    }
    cookieStore.addEventListener('change', (event)=>{
        for (const cookie of event.changed){
            if (cookie.name === _approuterheaders.NEXT_INSTANT_TEST_COOKIE) {
                const state = parseCookieValue(cookie.value ?? '');
                if (state === 'pending') {
                    // External actor starting a new lock scope.
                    if (lockState !== null) {
                        // This can be the delayed CookieStore event for the pending
                        // cookie that was already observed synchronously from
                        // document.cookie. Keep the existing lock identity so work that
                        // captured it keeps waiting on the same promise.
                        return;
                    }
                    acquireLock();
                }
                // Captured value (our own transition) or empty. Ignore.
                return;
            }
        }
        for (const cookie of event.deleted){
            if (cookie.name === _approuterheaders.NEXT_INSTANT_TEST_COOKIE) {
                if (lockState === null) {
                    // Either no lock is active, or this is the re-entrant change event
                    // from the defensive clear below (which runs after releaseLock).
                    // Nothing to release either way.
                    return;
                }
                releaseLock();
                // A captured write from this page's bootstrap can resurrect the
                // cookie in the narrow gap between the external delete and this
                // handler: writeCookieValue's guard only rejects the write once the
                // lock is torn down, which happens here. Now that the lock is
                // released, no further captured write can re-add the cookie, so clear
                // any entry that was resurrected in that gap. Otherwise an unlock
                // that falls back to a hard reload (when the shell has not yet
                // hydrated) would carry the stale cookie, be served the shell again,
                // and re-enter instant mode with no scope left to release it.
                if (typeof document !== 'undefined') {
                    document.cookie = `${_approuterheaders.NEXT_INSTANT_TEST_COOKIE}=; Path=/; Max-Age=0`;
                }
                (0, _useactionqueue.refreshOnInstantNavigationUnlock)();
                return;
            }
        }
    });
}
function updateCapturedSPAToTree(fromTree, toTree) {
    writeCookieValue([
        1,
        `c${Math.random()}`,
        {
            from: fromTree,
            to: toTree
        }
    ]);
}
function isNavigationLocked() {
    if (lockState !== null) {
        return true;
    }
    // If `lockState` is null, fall back to reading the test cookie
    // synchronously from `document.cookie`. This accounts for a small race
    // between `cookieStore.set(...)` and its corresponding `change` event.
    // During that gap `lockState` is still null even though the cookie
    // indicates a new lock scope is starting.
    if (typeof document === 'undefined') {
        return false;
    }
    const allCookies = document.cookie;
    if (!allCookies.includes(_approuterheaders.NEXT_INSTANT_TEST_COOKIE)) {
        // Fast bail-out: in almost every navigation the test cookie is not
        // set at all.
        return false;
    }
    const target = _approuterheaders.NEXT_INSTANT_TEST_COOKIE + '=';
    for (const segment of allCookies.split(';')){
        const trimmed = segment.trim();
        if (trimmed.startsWith(target) && parseCookieValue(trimmed.slice(target.length)) === 'pending') {
            // The cookie was set by an external actor but the change event was not
            // yet dispatched. Acquire the lock synchronously.
            acquireLock();
            return true;
        }
    }
    return false;
}
function getCurrentNavigationGate() {
    return lockState !== null ? lockState.currentNavigation : null;
}
function shouldRestrictNavigationToShell(rootPrefetchHints, linkFetchStrategy) {
    return isNavigationLocked() && (rootPrefetchHints & _approutertypes.PrefetchHint.SubtreeHasPartialPrefetching) !== 0 && !(0, _scheduler.subtreeHasSpeculativePrefetch)(linkFetchStrategy, rootPrefetchHints);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=navigation-testing-lock.js.map