/**
 * Checks if the Next.js unhandled rejection listener is currently attached.
 * This queries the actual process listeners instead of relying on a module
 * global, so it stays accurate even if the listener was removed externally,
 * e.g. via `process.removeAllListeners('unhandledRejection')`.
 */
export declare function isUnhandledRejectionListenerRegistered(): boolean;
/**
 * Registers the Next.js unhandled rejection listener, which logs unhandled
 * rejections (except React postpones) and prevents them from crashing the
 * process. Safe to call unconditionally: if the listener is already attached,
 * this is a no-op, so it never registers a duplicate.
 */
export declare function registerUnhandledRejectionListener(): void;
export declare function installProcessErrorHandlers(shouldRemoveUncaughtErrorAndRejectionListeners: boolean): void;
