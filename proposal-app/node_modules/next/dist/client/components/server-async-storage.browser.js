// Browser variant of `./server-async-storage`. The server-only async-storage
// singletons don't exist in the browser, so these are `undefined`. Consumers
// guard usage behind `typeof window === 'undefined'`, so the stubs are never
// dereferenced.
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
        return actionAsyncStorage;
    },
    workAsyncStorage: function() {
        return workAsyncStorage;
    },
    workUnitAsyncStorage: function() {
        return workUnitAsyncStorage;
    }
});
const actionAsyncStorage = undefined;
const workAsyncStorage = undefined;
const workUnitAsyncStorage = undefined;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=server-async-storage.browser.js.map