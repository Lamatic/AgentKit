// A fulfilled thenable that React can unwrap synchronously via `use()` without
// ever suspending. Reusing a single instance avoids allocating on every call.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "io", {
    enumerable: true,
    get: function() {
        return io;
    }
});
const resolvedIOPromise = Promise.resolve(undefined);
resolvedIOPromise.status = 'fulfilled';
resolvedIOPromise.value = undefined;
function io() {
    return resolvedIOPromise;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=io.browser.js.map