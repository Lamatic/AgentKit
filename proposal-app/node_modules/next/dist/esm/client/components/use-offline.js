'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useOptimistic, startTransition } from 'react';
const OfflineContext = /*#__PURE__*/ createContext(false);
// Module-level reference to the optimistic setter. Assigned inside the
// provider component on every render. Called by the offline module
// (via dispatchOfflineChange) to update the React tree.
let setOptimistic = null;
let setCanonical = null;
/**
 * Called by the offline module when the offline state changes.
 * Dispatches into React via startTransition + useOptimistic.
 */ export function dispatchOfflineChange(isOffline) {
    const canonical = setCanonical;
    const optimistic = setOptimistic;
    if (canonical === null || optimistic === null) {
        return;
    }
    startTransition(()=>{
        canonical(isOffline);
        optimistic(isOffline);
    });
}
export function OfflineProvider({ children }) {
    const [canonicalOffline, setCanonicalOffline] = useState(false);
    const [isOffline, setOptimisticOffline] = useOptimistic(canonicalOffline);
    setOptimistic = setOptimisticOffline;
    setCanonical = setCanonicalOffline;
    return /*#__PURE__*/ _jsx(OfflineContext.Provider, {
        value: isOffline,
        children: children
    });
}
/**
 * Returns whether the app is currently offline.
 * Returns `false` during SSR and hydration.
 */ export function useOffline() {
    return useContext(OfflineContext);
}

//# sourceMappingURL=use-offline.js.map