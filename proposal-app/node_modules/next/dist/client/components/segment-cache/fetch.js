"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "fetch", {
    enumerable: true,
    get: function() {
        return fetchInternal;
    }
});
const _navigationtestinglock = require("./navigation-testing-lock");
/**
 * Internal `fetch` used by the Next.js client router.
 *
 * When the Instant Navigation Testing API is enabled, the navigation lock may
 * install a blocking override on `window.fetch` for the duration of a lock
 * scope. To let internal fetches bypass the lock, callers go through a wrapper
 * that falls back to the pre-lock fetch captured at lock-acquire time.
 *
 * When the testing API is not enabled, this calls window.fetch directly.
 */ function fetchInternal(input, init) {
    if (process.env.__NEXT_EXPOSE_TESTING_API) {
        const preLockFetch = (0, _navigationtestinglock.getPreLockFetch)();
        if (preLockFetch !== null) {
            return preLockFetch(input, init);
        }
    }
    return fetch(input, init);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=fetch.js.map