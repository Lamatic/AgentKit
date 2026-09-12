import type { CacheHandler } from '../lib/cache-handlers/types';
import { type CacheReadWriteHandler } from './tiered-cache-handler';
/**
 * Initialize the cache handlers.
 * @param cacheMaxMemorySize - The maximum memory size of the cache in bytes, if
 *  not provided, the default memory size will be used.
 * @returns `true` if the cache handlers were initialized, `false` if they were already initialized.
 */
export declare function initializeCacheHandlers(cacheMaxMemorySize: number): boolean;
/**
 * Get a cache handler by kind.
 * @param kind - The kind of cache handler to get.
 * @returns The cache handler, or `undefined` if it does not exist.
 * @throws If the cache handlers are not initialized.
 */
export declare function getCacheHandler(kind: string): CacheHandler | undefined;
/**
 * Get the dedicated in-memory cache handler that persists private caches in
 * development. Returns `undefined` outside the dev server, where private caches
 * must not be persisted. This is intentionally not part of the kind-keyed
 * handlers map so that it can never be replaced by a user-configured handler.
 */
export declare function getPrivateCacheHandler(): CacheHandler | undefined;
/**
 * Whether the in-memory cache is disabled (`cacheMaxMemorySize: 0`). Dev-only
 * signal used to force a dynamic cache life so that the size-0 case still
 * serves stale and regenerates in the background. Always `false` in production.
 */
export declare function isMemoryCacheDisabled(): boolean;
/**
 * Whether `kind` is backed by a real user-configured handler rather than the
 * built-in in-memory default. Such a handler may be slow or remote, so in
 * development a built-in front handler is placed in front of it (see
 * `getDevTieredCacheHandler`) to keep cache hits microtask-fast. The presence
 * of a dev front handler is the signal, since front handlers are created
 * exactly for user-registered kinds. Always `false` in production.
 */
export declare function isCustomCacheHandler(kind: string): boolean;
/**
 * Whether `kind` resolves to one of the in-memory handlers that
 * `initializeCacheHandlers` constructs itself, rather than one supplied by the
 * platform through the `@next/cache-handlers` global or by `cacheHandlers`
 * config. Reads from a built-in handler are map lookups, so repeating one
 * within a request costs nothing; reads from a supplied handler may be a
 * network round trip. Unlike `isCustomCacheHandler`, this holds in production.
 *
 * Tracking the instances rather than the kinds is what keeps aliasing correct:
 * self-hosted, `remote` resolves to the same handler as `default` and so
 * reports as built-in, while a platform-supplied `remote` does not.
 */
export declare function isBuiltInCacheHandler(kind: string): boolean;
/**
 * Get the dev-only tiered cache handler for a custom `kind`: a fast built-in
 * in-memory front handler in front of the user-configured backing handler, so
 * cache hits resolve in a microtask. Returns `undefined` if there is none (a
 * built-in kind, or production).
 */
export declare function getDevTieredCacheHandler(kind: string): CacheReadWriteHandler | undefined;
/**
 * Get an iterator over the cache handlers.
 * @returns An iterator over the cache handlers, or `undefined` if they are not
 * initialized.
 */
export declare function getCacheHandlers(): IterableIterator<CacheHandler> | undefined;
/**
 * Get a map iterator over the cache handlers (keyed by kind).
 * @returns An iterator over the cache handler entries, or `undefined` if they
 * are not initialized.
 * @throws If the cache handlers are not initialized.
 */
export declare function getCacheHandlerEntries(): IterableIterator<[string, CacheHandler]> | undefined;
/**
 * Set a cache handler by kind.
 * @param kind - The kind of cache handler to set.
 * @param cacheHandler - The cache handler to set.
 */
export declare function setCacheHandler(kind: string, cacheHandler: CacheHandler): void;
