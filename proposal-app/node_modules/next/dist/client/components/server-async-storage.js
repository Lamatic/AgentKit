// Client-safe access to the server-only async-storage singletons. On the
// server these re-export the real storages; in the browser bundle this module
// is aliased to `./server-async-storage.browser` (see
// scripts/generate-browser-variant-aliases.mjs), which exports `undefined`
// stubs so the AsyncLocalStorage modules are never bundled into the client.
// Consumers must guard usage so the stubs are not dereferenced in the browser.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    actionAsyncStorage: null,
    workAsyncStorage: null,
    workUnitAsyncStorage: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    actionAsyncStorage: function() {
        return _actionasyncstorageexternal.actionAsyncStorage;
    },
    workAsyncStorage: function() {
        return _workasyncstorageexternal.workAsyncStorage;
    },
    workUnitAsyncStorage: function() {
        return _workunitasyncstorageexternal.workUnitAsyncStorage;
    }
});
const _actionasyncstorageexternal = require("../../server/app-render/action-async-storage.external");
const _workasyncstorageexternal = require("../../server/app-render/work-async-storage.external");
const _workunitasyncstorageexternal = require("../../server/app-render/work-unit-async-storage.external");

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=server-async-storage.js.map