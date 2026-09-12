import { type UseCacheCacheStore, type FetchCacheStore, type EncryptedBoundArgsCacheStore, type DecryptedBoundArgsCacheStore, type ImageResponseCacheStore } from './cache-store';
/**
 * An immutable version of the resume data cache used during rendering.
 * This cache is read-only and cannot be modified once created.
 */
export interface RenderResumeDataCache {
    /**
     * Discriminator. `false` means this cache is read-only and cannot be filled
     * with new entries. Used by `ResumeDataCache` consumers to narrow the union
     * via standard discriminated-union narrowing (e.g. `if
     * (resumeDataCache.mutable)`).
     */
    readonly mutable: false;
    /**
     * A read-only Map store for values cached by the 'use cache' React hook.
     * The 'set' operation is omitted to enforce immutability.
     */
    readonly cache: Omit<UseCacheCacheStore, 'set'>;
    /**
     * A read-only Map store for cached fetch responses.
     * The 'set' operation is omitted to enforce immutability.
     */
    readonly fetch: Omit<FetchCacheStore, 'set'>;
    /**
     * A read-only Map store for encrypted bound args of inline server functions.
     * The 'set' operation is omitted to enforce immutability.
     */
    readonly encryptedBoundArgs: Omit<EncryptedBoundArgsCacheStore, 'set'>;
    /**
     * A read-only Map store for decrypted bound args of inline server functions.
     * This is only intended for in-memory usage during pre-rendering, and must
     * not be persisted in the resume store. The 'set' operation is omitted to
     * enforce immutability.
     */
    readonly decryptedBoundArgs: Omit<DecryptedBoundArgsCacheStore, 'set'>;
    /**
     * A read-only in-memory Map store for rendered `ImageResponse` array buffers.
     * This is only intended for in-memory usage during pre-rendering, and must
     * not be persisted in the resume store. The 'set' operation is omitted to
     * enforce immutability.
     */
    readonly imageResponses: Omit<ImageResponseCacheStore, 'set'>;
    /**
     * Serialized cache keys that were intentionally skipped during the
     * prospective prerender (e.g. because the cached function accessed fallback
     * params or other dynamic data). During the final prerender, a key in this
     * set is returned as a hanging promise early, without attempting to look up
     * or generate a cache entry. Optional because this field is intentionally not
     * serialized and won't be present in deserialized caches.
     */
    readonly dynamicCacheKeys?: ReadonlySet<string>;
}
/**
 * A mutable version of the resume data cache used during pre-rendering.
 * This cache allows both reading and writing of cached values.
 */
export interface PrerenderResumeDataCache {
    /**
     * Discriminator. `true` means this cache is mutable and can be filled with
     * new entries during this prerender. Used by `ResumeDataCache` consumers to
     * narrow the union via standard discriminated-union narrowing (e.g.
     * `if (resumeDataCache.mutable)`).
     */
    readonly mutable: true;
    /**
     * A mutable Map store for values cached by the 'use cache' React hook.
     * Supports both 'get' and 'set' operations to build the cache during
     * pre-rendering.
     */
    readonly cache: UseCacheCacheStore;
    /**
     * A mutable Map store for cached fetch responses.
     * Supports both 'get' and 'set' operations to build the cache during
     * pre-rendering.
     */
    readonly fetch: FetchCacheStore;
    /**
     * A mutable Map store for encrypted bound args of inline server functions.
     * Supports both 'get' and 'set' operations to build the cache during
     * pre-rendering.
     */
    readonly encryptedBoundArgs: EncryptedBoundArgsCacheStore;
    /**
     * A mutable Map store for decrypted bound args of inline server functions.
     * This is only intended for in-memory usage during pre-rendering, and must
     * not be persisted in the resume store. Supports both 'get' and 'set'
     * operations to build the cache during pre-rendering.
     */
    readonly decryptedBoundArgs: DecryptedBoundArgsCacheStore;
    /**
     * A mutable in-memory Map store for rendered `ImageResponse` array buffers.
     * Filled during the prospective prerender and read during the final
     * prerender. Never persisted in the resume store.
     */
    readonly imageResponses: ImageResponseCacheStore;
    /**
     * Tracks serialized cache keys that were intentionally skipped during the
     * prospective prerender (e.g. because the cached function accessed fallback
     * params or other dynamic data). During the final prerender, a key in this
     * set is returned as a hanging promise early, without attempting to look up
     * or generate a cache entry.
     *
     * This is intentionally not serialized. It is only used in-memory within a
     * single prerender cycle (prospective to final). During the resume at request
     * time, a cache miss for a dynamic key should generate a fresh entry rather
     * than being short-circuited.
     */
    readonly dynamicCacheKeys: Set<string>;
}
/**
 * Discriminated union of the two resume data cache flavors. Consumers should
 * narrow via `resumeDataCache.mutable` to access the mutable Map API (only
 * available on `PrerenderResumeDataCache`).
 */
export type ResumeDataCache = RenderResumeDataCache | PrerenderResumeDataCache;
/**
 * Serializes a resume data cache into a JSON string for storage or
 * transmission. Handles 'use cache' values, fetch responses, and encrypted
 * bound args for inline server functions.
 *
 * @param resumeDataCache - The immutable cache to serialize
 * @returns A Promise that resolves to the serialized cache as a JSON string, or
 * 'null' if empty
 */
export declare function stringifyResumeDataCache(resumeDataCache: ResumeDataCache, isCacheComponentsEnabled: boolean): Promise<string>;
/**
 * Creates a new empty mutable resume data cache for pre-rendering.
 * Initializes fresh Map instances for both the 'use cache' and fetch caches.
 * Used at the start of pre-rendering to begin collecting cached values.
 *
 * @returns A new empty PrerenderResumeDataCache instance
 */
export declare function createPrerenderResumeDataCache(source?: ResumeDataCache): PrerenderResumeDataCache;
/**
 * Creates an immutable render resume data cache from either:
 * 1. An existing prerender cache instance
 * 2. A serialized cache string
 *
 * @param renderResumeDataCache - A RenderResumeDataCache instance to be used directly
 * @param prerenderResumeDataCache - A PrerenderResumeDataCache instance to convert to immutable
 * @param persistedCache - A serialized cache string to parse
 * @param maxPostponedStateSizeBytes - The max compressed size limit in bytes (used to calculate 5x decompression limit)
 * @returns An immutable RenderResumeDataCache instance
 */
export declare function createRenderResumeDataCache(resumeDataCache: ResumeDataCache): RenderResumeDataCache;
export declare function createRenderResumeDataCache(persistedCache: string, maxPostponedStateSizeBytes: number | undefined): RenderResumeDataCache;
