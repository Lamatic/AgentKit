/**
 * Tees a cache entry's single-use value stream into two independent entries.
 * The original entry is mutated to hold one branch of the tee, and a clone is
 * returned holding the other, so both can be consumed independently.
 */ export function cloneCacheEntry(entry) {
    const [streamA, streamB] = entry.value.tee();
    entry.value = streamA;
    const clonedEntry = {
        value: streamB,
        timestamp: entry.timestamp,
        revalidate: entry.revalidate,
        expire: entry.expire,
        stale: entry.stale,
        tags: entry.tags
    };
    return [
        entry,
        clonedEntry
    ];
}

//# sourceMappingURL=clone-cache-entry.js.map