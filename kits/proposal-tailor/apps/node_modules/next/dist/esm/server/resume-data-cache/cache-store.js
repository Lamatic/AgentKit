import { arrayBufferToString, stringToUint8Array } from '../app-render/encryption-utils';
import { MIN_PRERENDERABLE_EXPIRE } from '../use-cache/constants';
/**
 * Parses serialized cache entries into a UseCacheCacheStore
 * @param entries - The serialized entries to parse
 * @returns A new UseCacheCacheStore containing the parsed entries
 */ export function parseUseCacheCacheStore(entries) {
    const store = new Map();
    for (const [key, { entry, hasExplicitRevalidate, hasExplicitExpire, readRootParamNames }] of entries){
        store.set(key, Promise.resolve({
            entry: {
                // Create a ReadableStream from the Uint8Array
                value: new ReadableStream({
                    start (controller) {
                        // Enqueue the Uint8Array to the stream
                        controller.enqueue(stringToUint8Array(atob(entry.value)));
                        // Close the stream
                        controller.close();
                    }
                }),
                tags: entry.tags,
                stale: entry.stale,
                timestamp: entry.timestamp,
                expire: entry.expire,
                revalidate: entry.revalidate
            },
            hasExplicitRevalidate,
            hasExplicitExpire,
            readRootParamNames: readRootParamNames ? new Set(readRootParamNames) : undefined,
            // Serialized RDC entries are non-dynamic by construction (the
            // serializer drops dynamic entries), so this is never produced from the
            // wire — the throw path that consumes it is only reachable for dynamic
            // entries, which only exist in the in-memory RDC.
            dynamicNestedCacheError: undefined
        }));
    }
    return store;
}
/**
 * Serializes UseCacheCacheStore entries into an array of key-value pairs
 * @param entries - The store entries to stringify
 * @returns A promise that resolves to an array of key-value pairs with serialized values
 */ export async function serializeUseCacheCacheStore(entries, isCacheComponentsEnabled) {
    return Promise.all(Array.from(entries).map(([key, value])=>{
        return value.then(async ({ entry, hasExplicitRevalidate, hasExplicitExpire, readRootParamNames })=>{
            if (isCacheComponentsEnabled && (entry.revalidate === 0 || entry.expire < MIN_PRERENDERABLE_EXPIRE)) {
                // The entry was omitted from the prerender result, and subsequently
                // does not need to be included in the serialized RDC.
                return null;
            }
            const [left, right] = entry.value.tee();
            entry.value = right;
            let binaryString = '';
            // We want to encode the value as a string, but we aren't sure if the
            // value is a a stream of UTF-8 bytes or not, so let's just encode it
            // as a string using base64.
            for await (const chunk of left){
                binaryString += arrayBufferToString(chunk);
            }
            return [
                key,
                {
                    entry: {
                        // Encode the value as a base64 string.
                        value: btoa(binaryString),
                        tags: entry.tags,
                        stale: entry.stale,
                        timestamp: entry.timestamp,
                        expire: entry.expire,
                        revalidate: entry.revalidate
                    },
                    hasExplicitRevalidate,
                    hasExplicitExpire,
                    readRootParamNames: readRootParamNames ? [
                        ...readRootParamNames
                    ] : undefined
                }
            ];
        }).catch(()=>{
            // Any failed cache writes should be ignored as to not discard the
            // entire cache.
            return null;
        });
    }));
}

//# sourceMappingURL=cache-store.js.map