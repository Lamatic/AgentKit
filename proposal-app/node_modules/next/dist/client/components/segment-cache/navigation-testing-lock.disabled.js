/**
 * Inert stand-in for `./navigation-testing-lock`.
 *
 * When the Instant Navigation Testing API is disabled (a production build
 * without `experimental.exposeTestingApiInProductionBuild`), the browser
 * bundle resolves `./navigation-testing-lock` to this module instead of the
 * real implementation, so none of the lock machinery ships. The alias is set
 * up in `create-compiler-aliases.ts` (webpack) and
 * `crates/next-core/src/next_import_map.rs` (Turbopack).
 *
 * Every export mirrors the real module's signature and returns the value the
 * real implementation produces when no lock is held.
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
function getPreLockFetch() {
    return null;
}
function beginNavigationLockPrefetch() {
    return null;
}
function getNavigationLockSegmentCacheMap() {
    return null;
}
function resolveNavigationLockPrefetch(_prefetch) {}
function startListeningForInstantNavigationCookie() {}
function updateCapturedSPAToTree(_fromTree, _toTree) {}
function isNavigationLocked() {
    return false;
}
function beginLockedNavigation() {
    return null;
}
function getCurrentNavigationGate() {
    return null;
}
function resetNavigationLockToPending() {}
function shouldRestrictNavigationToShell(_rootPrefetchHints, _linkFetchStrategy) {
    return false;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=navigation-testing-lock.disabled.js.map