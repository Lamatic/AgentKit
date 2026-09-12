"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "serverPatchReducer", {
    enumerable: true,
    get: function() {
        return serverPatchReducer;
    }
});
const _createhreffromurl = require("../create-href-from-url");
const _routerreducertypes = require("../router-reducer-types");
const _navigation = require("../../segment-cache/navigation");
const _cache = require("../../segment-cache/cache");
const _refreshreducer = require("./refresh-reducer");
const _pprnavigations = require("../ppr-navigations");
function serverPatchReducer(state, action) {
    // A "retry" is a navigation that happens due to a route mismatch. It's
    // similar to a refresh, because we will omit any existing dynamic data on
    // the page. But we seed the retry navigation with the exact tree that the
    // server just responded with.
    const retryMpa = action.mpa;
    const retryUrl = new URL(action.url, location.origin);
    const retrySeed = action.seed;
    const navigateType = action.navigateType;
    if (retryMpa || retrySeed === null) {
        // If the server did not send back data during the mismatch, fall back to
        // an MPA navigation.
        return (0, _navigation.completeHardNavigation)(state, retryUrl, navigateType);
    }
    const currentUrl = new URL(state.canonicalUrl, location.origin);
    const currentRenderedSearch = state.renderedSearch;
    if (action.previousTree !== state.tree) {
        // There was another, more recent navigation since the once that
        // mismatched. We can abort the retry, but we still need to refresh the
        // page to evict any stale dynamic data.
        return (0, _refreshreducer.refreshReducer)(state, {
            type: _routerreducertypes.ACTION_REFRESH
        });
    }
    // There have been no new navigations since the mismatched one. Refresh,
    // using the tree we just received from the server.
    //
    // The freshness policy comes from the action: a genuine tree mismatch
    // re-fetches the dynamic data (`RefreshAll`), whereas a redirect that only
    // changed the canonical URL reuses the data already in the tree
    // (`HistoryTraversal`), since the data we received is correct.
    const retryCanonicalUrl = (0, _createhreffromurl.createHrefFromUrl)(retryUrl);
    const retryNextUrl = action.nextUrl;
    const scrollBehavior = _routerreducertypes.ScrollBehavior.Default;
    const navigationLock = (0, _pprnavigations.getCurrentNavigationLock)();
    const now = Date.now();
    return (0, _navigation.navigateToKnownRoute)(now, state, retryUrl, retryCanonicalUrl, retrySeed, currentUrl, currentRenderedSearch, state.cache, state.tree, action.freshnessPolicy, retryNextUrl, scrollBehavior, navigateType, navigationLock, // A server-patch retry navigation is bound to the shared map.
    _cache.segmentCacheMap, null, // Server patch (retry) navigations don't use route prediction. This is
    // typically a retry after a previous mismatch, so the route was already
    // marked as having a dynamic rewrite when the mismatch was detected.
    null, // Not an HMR refresh, so there's no request generation to cancel.
    undefined);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=server-patch-reducer.js.map