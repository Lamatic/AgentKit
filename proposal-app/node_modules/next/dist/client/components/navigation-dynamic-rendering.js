// Client-safe access to the server-only dynamic-rendering hooks used by the
// navigation hooks. On the server these re-export the real implementations; in
// the browser bundle this module is aliased to
// `./navigation-dynamic-rendering.browser` (see
// scripts/generate-browser-variant-aliases.mjs), which exports `undefined` so
// the server module is not bundled into the client. Callers use optional calls
// (`useDynamicRouteParams?.(...)`), so the browser stub is a no-op.
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
        return _dynamicrendering.useDynamicRouteParams;
    },
    useDynamicSearchParams: function() {
        return _dynamicrendering.useDynamicSearchParams;
    }
});
const _dynamicrendering = require("../../server/app-render/dynamic-rendering");

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=navigation-dynamic-rendering.js.map