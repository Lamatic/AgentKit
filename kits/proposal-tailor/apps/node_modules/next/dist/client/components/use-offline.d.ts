import React from 'react';
/**
 * Called by the offline module when the offline state changes.
 * Dispatches into React via startTransition + useOptimistic.
 */
export declare function dispatchOfflineChange(isOffline: boolean): void;
export declare function OfflineProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
/**
 * Returns whether the app is currently offline.
 * Returns `false` during SSR and hydration.
 */
export declare function useOffline(): boolean;
