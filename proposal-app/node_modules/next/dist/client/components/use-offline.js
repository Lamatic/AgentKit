'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    OfflineProvider: null,
    dispatchOfflineChange: null,
    useOffline: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    OfflineProvider: function() {
        return OfflineProvider;
    },
    dispatchOfflineChange: function() {
        return dispatchOfflineChange;
    },
    useOffline: function() {
        return useOffline;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _jsxruntime = require("react/jsx-runtime");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const OfflineContext = /*#__PURE__*/ (0, _react.createContext)(false);
// Module-level reference to the optimistic setter. Assigned inside the
// provider component on every render. Called by the offline module
// (via dispatchOfflineChange) to update the React tree.
let setOptimistic = null;
let setCanonical = null;
function dispatchOfflineChange(isOffline) {
    const canonical = setCanonical;
    const optimistic = setOptimistic;
    if (canonical === null || optimistic === null) {
        return;
    }
    (0, _react.startTransition)(()=>{
        canonical(isOffline);
        optimistic(isOffline);
    });
}
function OfflineProvider({ children }) {
    const [canonicalOffline, setCanonicalOffline] = (0, _react.useState)(false);
    const [isOffline, setOptimisticOffline] = (0, _react.useOptimistic)(canonicalOffline);
    setOptimistic = setOptimisticOffline;
    setCanonical = setCanonicalOffline;
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(OfflineContext.Provider, {
        value: isOffline,
        children: children
    });
}
function useOffline() {
    return (0, _react.useContext)(OfflineContext);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=use-offline.js.map