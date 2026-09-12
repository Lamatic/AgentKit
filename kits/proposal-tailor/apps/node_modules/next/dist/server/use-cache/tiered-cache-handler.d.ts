import type { CacheHandler } from '../lib/cache-handlers/types';
/**
 * The subset of the cache-handler interface used on the per-invocation
 * read/write path in the "use cache" wrapper. Tag operations are intentionally
 * excluded: they are applied to the front and backing handlers individually by
 * the registry iterators (`getCacheHandlers` / `getCacheHandlerEntries`), never
 * through this composite, so the composite is never registered.
 */
export type CacheReadWriteHandler = Pick<CacheHandler, 'get' | 'set'>;
/**
 * Development-only. Puts a fast built-in in-memory `front` handler in front of
 * a slower or persistent user-configured `backing` handler. Its only job is to
 * guarantee that cache hits resolve in a microtask (so they aren't counted as
 * cache misses at a staged-render boundary, which would otherwise surface a
 * cold cache indicator), while keeping the front in sync with the backing.
 *
 * It implements only `get` and `set` because that is all the wrapper calls on
 * its handler. Regeneration is never done here; this only reads, mirrors, and
 * writes through.
 *
 * The handler is a per-kind singleton (the front and backing are both shared),
 * so its in-flight map can serialize background front syncs for a key across
 * concurrent reads, running them one at a time instead of in parallel.
 */
export declare function createTieredCacheHandler(front: CacheHandler, backing: CacheHandler): CacheReadWriteHandler;
