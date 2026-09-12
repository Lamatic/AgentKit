"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    UNDEFINED_MARKER: null,
    markErrorAsAlreadyLoggedOnServer: null,
    patchConsoleMethod: null,
    wasErrorAlreadyLoggedOnServer: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    UNDEFINED_MARKER: function() {
        return UNDEFINED_MARKER;
    },
    markErrorAsAlreadyLoggedOnServer: function() {
        return markErrorAsAlreadyLoggedOnServer;
    },
    patchConsoleMethod: function() {
        return patchConsoleMethod;
    },
    wasErrorAlreadyLoggedOnServer: function() {
        return wasErrorAlreadyLoggedOnServer;
    }
});
const UNDEFINED_MARKER = '__next_tagged_undefined';
const alreadyLoggedOnServerSymbol = Symbol('nextAlreadyLoggedOnServer');
function markErrorAsAlreadyLoggedOnServer(error) {
    Object.defineProperty(error, alreadyLoggedOnServerSymbol, {
        value: true,
        enumerable: false,
        configurable: true
    });
}
function wasErrorAlreadyLoggedOnServer(value) {
    return typeof value === 'object' && value !== null && value[alreadyLoggedOnServerSymbol] === true;
}
function patchConsoleMethod(methodName, wrapper) {
    const descriptor = Object.getOwnPropertyDescriptor(console, methodName);
    if (descriptor && (descriptor.configurable || descriptor.writable) && typeof descriptor.value === 'function') {
        const originalMethod = descriptor.value;
        const originalName = Object.getOwnPropertyDescriptor(originalMethod, 'name');
        const wrapperMethod = function(...args) {
            wrapper(methodName, ...args);
            originalMethod.apply(this, args);
        };
        if (originalName) {
            Object.defineProperty(wrapperMethod, 'name', originalName);
        }
        Object.defineProperty(console, methodName, {
            value: wrapperMethod
        });
        return ()=>{
            Object.defineProperty(console, methodName, {
                value: originalMethod,
                writable: descriptor.writable,
                configurable: descriptor.configurable
            });
        };
    }
    return ()=>{};
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=forward-logs-shared.js.map