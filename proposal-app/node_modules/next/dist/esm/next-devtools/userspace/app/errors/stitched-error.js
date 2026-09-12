import React from 'react';
import isError from '../../../../lib/is-error';
const ownerStacks = new WeakMap();
export function getOwnerStack(error) {
    return ownerStacks.get(error);
}
export function setOwnerStack(error, stack) {
    ownerStacks.set(error, stack);
}
export function coerceError(value) {
    return isError(value) ? value : Object.defineProperty(new Error('' + value), "__NEXT_ERROR_CODE", {
        value: "E394",
        enumerable: false,
        configurable: true
    });
}
export function setOwnerStackIfAvailable(error) {
    // React 18 and prod does not have `captureOwnerStack`
    if ('captureOwnerStack' in React) {
        const ownerStack = React.captureOwnerStack();
        // Only set if we captured a valid owner stack, or if none exists yet.
        // This prevents overwriting a valid owner stack captured earlier
        // (e.g., in onRecoverableError) with null captured later.
        if (ownerStack || !ownerStacks.has(error)) {
            setOwnerStack(error, ownerStack);
        }
    }
}
export function decorateDevError(thrownValue) {
    const error = coerceError(thrownValue);
    setOwnerStackIfAvailable(error);
    return error;
}

//# sourceMappingURL=stitched-error.js.map