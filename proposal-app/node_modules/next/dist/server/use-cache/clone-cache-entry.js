"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cloneCacheEntry", {
    enumerable: true,
    get: function() {
        return cloneCacheEntry;
    }
});
function cloneCacheEntry(entry) {
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