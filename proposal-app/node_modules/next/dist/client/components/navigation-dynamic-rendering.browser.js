// Browser variant of `./navigation-dynamic-rendering`. The dynamic-rendering
// hooks only run on the server; callers use optional calls, so these are
// `undefined` in the browser.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    useDynamicRouteParams: null,
    useDynamicSearchParams: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    useDynamicRouteParams: function() {
        return useDynamicRouteParams;
    },
    useDynamicSearchParams: function() {
        return useDynamicSearchParams;
    }
});
const useDynamicRouteParams = undefined;
const useDynamicSearchParams = undefined;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=navigation-dynamic-rendering.browser.js.map