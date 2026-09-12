import type { CacheEntry } from '../lib/cache-handlers/types';
import { type SearchParams } from '../request/search-params';
import type { Params } from '../request/params';
export type CacheKeyParts = [buildId: string, id: string, args: unknown[]] | [buildId: string, id: string, args: unknown[], hmrRefreshHash: string];
export interface UseCachePageProps {
    params: Promise<Params>;
    searchParams: Promise<SearchParams>;
    $$isPage: true;
}
export type UseCacheLayoutProps = {
    params: Promise<Params>;
    $$isLayout: true;
} & {
    [slot: string]: any;
};
/**
 * Cache entry metadata for propagation. Separated from the stream to make
 * ownership clear: metadata is freely shareable, streams must be explicitly
 * tee'd for each consumer.
 */
interface CacheResultMetadata {
    readonly tags: string[];
    readonly revalidate: number;
    readonly expire: number;
    readonly stale: number;
    readonly timestamp: number;
    readonly readRootParamNames: ReadonlySet<string> | undefined;
    readonly hasExplicitRevalidate: boolean | undefined;
    readonly hasExplicitExpire: boolean | undefined;
    readonly dynamicNestedCacheError: Error | undefined;
}
/**
 * Encapsulates a pending cache invocation for deduping. Manages lazy stream
 * tee-ing (via fork()) and metadata access for both intra-request and
 * cross-request joiners.
 */
declare class SharedCacheEntry {
    private stream;
    /**
     * The pending metadata promise. Cross-request joiners need to await this for
     * root param verification BEFORE calling fork(). Intra-request joiners chain
     * .then() for fire-and-forget propagation.
     */
    readonly pendingMetadata: Promise<CacheResultMetadata>;
    constructor(stream: ReadableStream<Uint8Array>, pendingMetadata: Promise<CacheResultMetadata>);
    /**
     * Tee the stream: returns a copy for the caller, replaces the internal stream
     * with the remaining branch for future callers. Both the leader and joiners
     * call this — everyone gets a fork.
     */
    fork(): ReadableStream<Uint8Array>;
}
export type SharedCacheResult = {
    readonly type: 'cached';
    readonly entry: SharedCacheEntry;
} | {
    readonly type: 'prerender-dynamic';
    readonly hangingPromise: Promise<never>;
};
export interface CollectedCacheResult {
    entry: CacheEntry;
    /**
     * Whether the revalidate value was explicitly set via `cacheLife()`.
     * - `true`: explicitly set
     * - `false`: implicit (propagated from a nested cache or implicitly using the
     *   default profile)
     * - `undefined`: unknown (e.g. pre-existing entry from a cache handler)
     */
    hasExplicitRevalidate: boolean | undefined;
    /**
     * Whether the expire value was explicitly set via `cacheLife()`.
     * - `true`: explicitly set
     * - `false`: implicit (propagated from a nested cache or implicitly using the
     *   default profile)
     * - `undefined`: unknown (e.g. pre-existing entry from a cache handler)
     */
    hasExplicitExpire: boolean | undefined;
    /**
     * The root param names that were read during cache entry generation.
     * Used to compute the specific cache key after generation completes.
     * `undefined` for pre-existing entries from cache handlers where we
     * don't have this information.
     */
    readRootParamNames: ReadonlySet<string> | undefined;
    /**
     * The `Error` carried up from the first nested public `'use cache'`
     * invocation that propagated a dynamic cache life into this entry, captured
     * eagerly at that inner invocation's `cache()` entry. Used as `cause` for the
     * nested-dynamic cache error so the redbox can point at the inner invocation
     * site, not just the outer one. Lives in-memory only — intentionally dropped
     * from the serialized RDC because dynamic entries aren't serialized either.
     */
    dynamicNestedCacheError: Error | undefined;
}
export declare function cache(kind: string, id: string, boundArgsLength: number, originalFn: (...args: unknown[]) => Promise<unknown>, args: unknown[]): Promise<unknown>;
export {};
