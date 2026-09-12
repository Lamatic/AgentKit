export declare class UseCacheTimeoutError extends Error {
    constructor();
}
export declare class UseCacheDeadlockError extends Error {
    constructor();
}
/**
 * Used purely as `cause` for the nested-dynamic cache error: its captured stack
 * points at the inner `"use cache"` invocation that propagated a dynamic cache
 * life up to the outer cache. Constructed eagerly in `cache()` while the caller
 * is still on the synchronous stack — see use-cache-wrapper.ts.
 */
export declare class NestedDynamicUseCacheError extends Error {
    constructor();
}
