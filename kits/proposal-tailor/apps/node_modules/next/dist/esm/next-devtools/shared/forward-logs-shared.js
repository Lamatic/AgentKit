export const UNDEFINED_MARKER = '__next_tagged_undefined';
const alreadyLoggedOnServerSymbol = Symbol('nextAlreadyLoggedOnServer');
/**
 * Marks an error that originated on the server and was already logged there.
 * Such errors are also sent to the browser, where they get logged to the
 * browser console and shown in the dev overlay. This marker lets the
 * browser-to-terminal log forwarding skip them, so they aren't replayed back to
 * the CLI as duplicates.
 */ export function markErrorAsAlreadyLoggedOnServer(error) {
    Object.defineProperty(error, alreadyLoggedOnServerSymbol, {
        value: true,
        enumerable: false,
        configurable: true
    });
}
export function wasErrorAlreadyLoggedOnServer(value) {
    return typeof value === 'object' && value !== null && value[alreadyLoggedOnServerSymbol] === true;
}
// Based on https://github.com/facebook/react/blob/28dc0776be2e1370fe217549d32aee2519f0cf05/packages/react-server/src/ReactFlightServer.js#L248
export function patchConsoleMethod(methodName, wrapper) {
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

//# sourceMappingURL=forward-logs-shared.js.map