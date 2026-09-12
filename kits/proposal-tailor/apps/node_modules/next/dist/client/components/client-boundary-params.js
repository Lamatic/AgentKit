// Client-safe creation of the params/searchParams passed to client Page and
// Segment components. On the server these produce dynamically-tracked values;
// in the browser bundle this module is aliased to
// `./client-boundary-params.browser` (see
// scripts/generate-browser-variant-aliases.mjs), which produces the render-time
// values. Both variants share the same call signature, so consumers call them
// without branching on `typeof window`.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createClientParams: null,
    createClientSearchParams: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createClientParams: function() {
        return _params.createParamsFromClient;
    },
    createClientSearchParams: function() {
        return _searchparams.createSearchParamsFromClient;
    }
});
const _params = require("../../server/request/params");
const _searchparams = require("../../server/request/search-params");

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=client-boundary-params.js.map