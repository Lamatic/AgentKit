import { promises } from 'fs';
import { LRUCache } from './lru-cache';
/**
 * Module-level LRU singleton for disk cache eviction.
 * Initialized once on first `set()`, shared across all consumers.
 * Once resolved, the promise stays resolved — subsequent calls just await the cached result.
 */ let _diskLRUPromise = null;
/**
 * Initialize or return the module-level LRU for disk cache eviction.
 * Concurrent calls are deduplicated via the shared promise.
 *
 * @param cacheDir - The directory where cached files are stored
 * @param maxDiskSize - Maximum disk cache size in bytes
 * @param readEntries - Callback to scan existing cache entries (format-agnostic)
 */ export async function getOrInitDiskLRU(cacheDir, maxDiskSize, readEntries, evictEntry) {
    if (!_diskLRUPromise) {
        _diskLRUPromise = (async ()=>{
            let maxSize = maxDiskSize;
            if (typeof maxSize === 'undefined') {
                // Ensure cacheDir exists before checking disk space
                await promises.mkdir(cacheDir, {
                    recursive: true
                });
                // Since config was not provided, default to 50% of available disk space
                const { bavail, bsize } = await promises.statfs(cacheDir);
                maxSize = Math.floor(bavail * bsize / 2);
            }
            const lru = new LRUCache(maxSize, (size)=>size, (cacheKey)=>evictEntry(cacheDir, cacheKey));
            const entries = await readEntries(cacheDir);
            for (const entry of entries){
                // Skip entries with a non-positive size: `LRUCache.set()` rejects
                // sizes <= 0, so a single such entry (e.g. a 0-byte or corrupt cache
                // file) would otherwise throw here and permanently reject this cached
                // singleton promise, breaking the disk cache for the whole process.
                if (entry.size > 0) {
                    lru.set(entry.key, entry.size);
                }
            }
            return lru;
        })();
    }
    return _diskLRUPromise;
}
/**
 * Reset the module-level LRU singleton. Exported for testing only.
 */ export function resetDiskLRU() {
    _diskLRUPromise = null;
}

//# sourceMappingURL=disk-lru-cache.external.js.map