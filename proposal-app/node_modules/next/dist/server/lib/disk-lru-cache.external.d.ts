import { LRUCache } from './lru-cache';
/**
 * Initialize or return the module-level LRU for disk cache eviction.
 * Concurrent calls are deduplicated via the shared promise.
 *
 * @param cacheDir - The directory where cached files are stored
 * @param maxDiskSize - Maximum disk cache size in bytes
 * @param readEntries - Callback to scan existing cache entries (format-agnostic)
 */
export declare function getOrInitDiskLRU(cacheDir: string, maxDiskSize: number | undefined, readEntries: (cacheDir: string) => Promise<Array<{
    key: string;
    size: number;
    expireAt: number;
}>>, evictEntry: (cacheDir: string, cacheKey: string) => Promise<void>): Promise<LRUCache<number>>;
/**
 * Reset the module-level LRU singleton. Exported for testing only.
 */
export declare function resetDiskLRU(): void;
