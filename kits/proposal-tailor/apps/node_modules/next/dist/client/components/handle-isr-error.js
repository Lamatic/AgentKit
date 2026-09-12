"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "handleISRError", {
    enumerable: true,
    get: function() {
        return handleISRError;
    }
});
const _serverasyncstorage = require("./server-async-storage");
function handleISRError({ error }) {
    if (_serverasyncstorage.workAsyncStorage) {
        const store = _serverasyncstorage.workAsyncStorage.getStore();
        if (store?.isStaticGeneration) {
            if (error) {
                console.error(error);
            }
            throw error;
        }
    }
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=handle-isr-error.js.map