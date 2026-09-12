import type { FlightData, Segment as FlightRouterStateSegment } from '../../../shared/lib/app-router-types';
import { type VaryParams, type VaryParamsIterable } from '../../../shared/lib/segment-cache/vary-params-decoding';
import { type RSCResponse } from '../router-reducer/fetch-server-response';
import { type PrefetchTask, type PrefetchSubtaskResult } from './scheduler';
import { type SegmentVaryPath, type PageVaryPath, type LayoutVaryPath } from './vary-path';
import type { NormalizedPathname, NormalizedSearch, RouteCacheKey } from './cache-key';
import { EntryStatus, type CacheMap, type UnknownMapEntry } from './cache-map';
export { EntryStatus } from './cache-map';
import { type SegmentRequestKey } from '../../../shared/lib/segment-cache/segment-value-encoding';
import type { FlightRouterState } from '../../../shared/lib/app-router-types';
import { type NormalizedFlightData } from '../../flight-data-helpers';
import { FetchStrategy } from './types';
import { type NavigationSeed } from './navigation';
/**
 * Ensures a minimum stale time of 30s to avoid issues where the server sends a too
 * short-lived stale time, which would prevent anything from being prefetched.
 */
export declare function getStaleTimeMs(staleTimeSeconds: number): number;
type RouteTreeShared = {
    requestKey: SegmentRequestKey;
    segment: FlightRouterStateSegment;
    shellVaryPath: SegmentVaryPath;
    refreshState: RefreshState | null;
    slots: null | Map<string, RouteTree>;
    prefetchHints: number;
};
export type RefreshState = {
    canonicalUrl: string;
    renderedSearch: NormalizedSearch;
};
type LayoutRouteTree = RouteTreeShared & {
    isPage: false;
    varyPath: LayoutVaryPath;
};
type PageRouteTree = RouteTreeShared & {
    isPage: true;
    varyPath: PageVaryPath;
};
export type RouteTree = LayoutRouteTree | PageRouteTree;
type RouteCacheEntryShared = {
    couldBeIntercepted: boolean;
    hasDynamicRewrite: boolean;
    ref: UnknownMapEntry | null;
    size: number;
    staleAt: number;
    version: number;
};
export type PendingRouteCacheEntry = RouteCacheEntryShared & {
    status: EntryStatus.Empty | EntryStatus.Pending;
    blockedTasks: Set<PrefetchTask> | null;
    canonicalUrl: null;
    renderedSearch: null;
    tree: null;
    metadata: null;
    supportsPerSegmentPrefetching: false;
};
type RejectedRouteCacheEntry = RouteCacheEntryShared & {
    status: EntryStatus.Rejected;
    blockedTasks: Set<PrefetchTask> | null;
    canonicalUrl: null;
    renderedSearch: null;
    tree: null;
    metadata: null;
    supportsPerSegmentPrefetching: boolean;
};
export type FulfilledRouteCacheEntry = RouteCacheEntryShared & {
    status: EntryStatus.Fulfilled;
    blockedTasks: null;
    canonicalUrl: string;
    renderedSearch: NormalizedSearch;
    tree: RouteTree;
    metadata: RouteTree;
    supportsPerSegmentPrefetching: boolean;
};
export type RouteCacheEntry = PendingRouteCacheEntry | FulfilledRouteCacheEntry | RejectedRouteCacheEntry;
type SegmentCacheEntryShared = {
    /**
     * The fetch strategy this entry's content EFFECTIVELY corresponds to,
     * which may be deeper than the strategy that requested it: an entry is
     * recorded at the tier of the payload that fully satisfied it (e.g. a
     * shell-spawned entry fulfilled by a response whose shell IS the full
     * response is recorded at the full tier, while still keyed at the shell
     * vary path — valid precisely because the variants coincide). Compared
     * via `canNewFetchStrategyProvideMoreContent` to decide whether a new
     * request could yield more content than what's already cached.
     *
     * "Effectively" spans both of the tier axes, static-vs-runtime included: a
     * static response that accessed no runtime data is as complete as a runtime
     * response of the same variant, so it records the RUNTIME tier (see
     * `recordedFetchStrategy` in writeSegmentBundleResponse). That is what lets
     * "would a runtime request return more?" be answered by comparing tiers,
     * with no separate per-entry signal — the question the scheduler asks in
     * `wouldRuntimeRequestProvideMore`.
     */
    fetchStrategy: FetchStrategy;
    /**
     * True if this entry was fulfilled from a fallback shell response (the page
     * had not yet been prerendered with concrete params). The scheduler uses
     * this to retry the static prefetch, since a more complete version may
     * become available once the server's background regeneration finishes.
     *
     * Distinct from `isPartial`: a fully-prerendered PPR page can have partial
     * segments that should NOT be retried. See `SegmentPrefetchResponse`.
     */
    isUpgradeableISRFallback: boolean;
    ref: UnknownMapEntry | null;
    size: number;
    staleAt: number;
    version: number;
};
export type EmptySegmentCacheEntry = SegmentCacheEntryShared & {
    status: EntryStatus.Empty;
    blockedTasks: Set<PrefetchTask> | null;
    rsc: null;
    isPartial: true;
    promise: null;
};
export type PendingSegmentCacheEntry = SegmentCacheEntryShared & {
    status: EntryStatus.Pending;
    blockedTasks: Set<PrefetchTask> | null;
    rsc: null;
    isPartial: boolean;
    promise: null | PromiseWithResolvers<FulfilledSegmentCacheEntry | null>;
};
type RejectedSegmentCacheEntry = SegmentCacheEntryShared & {
    status: EntryStatus.Rejected;
    blockedTasks: Set<PrefetchTask> | null;
    rsc: null;
    isPartial: true;
    promise: null;
};
export type FulfilledSegmentCacheEntry = SegmentCacheEntryShared & {
    status: EntryStatus.Fulfilled;
    blockedTasks: null;
    rsc: React.ReactNode | null;
    isPartial: boolean;
    promise: null;
};
export type SegmentCacheEntry = EmptySegmentCacheEntry | PendingSegmentCacheEntry | RejectedSegmentCacheEntry | FulfilledSegmentCacheEntry;
export type NonEmptySegmentCacheEntry = Exclude<SegmentCacheEntry, EmptySegmentCacheEntry>;
/**
 * A linked list of segment cache entries to fulfill from a single prefetch
 * response. The head is the requested segment; subsequent nodes are parent
 * segments whose data is bundled into the same response by the server.
 *
 * When segments are not bundled, the list has a single node. The list
 * maps 1:1 to the data array in the SegmentPrefetchResponse the server returns.
 */
export type SegmentBundle = {
    tree: RouteTree | null;
    entry: SegmentCacheEntry | null;
    parent: SegmentBundle | null;
};
export declare const MetadataOnlyRequestTree: FlightRouterState;
/**
 * The shared segment cache map. Segment cache functions do not access this
 * ambiently — every unit of work is bound to a map when it is created, and
 * reads and writes receive that map explicitly:
 *
 * - A prefetch task captures its map when it is scheduled
 *   (`PrefetchTask.segmentCacheMap` in scheduler.ts). Almost always this one;
 *   a task scheduled while the Instant Navigation Testing lock is held gets
 *   the lock scope's private map instead (which starts empty and is discarded
 *   at release), so a locked navigation observes only data fetched under the
 *   lock — never a stale entry left in the shared cache by an earlier
 *   navigation, prefetch, or scope.
 * - A locked navigation inherits the map of the prefetch task that drives it
 *   (see `ensurePrefetchThenNavigate` in navigation.ts).
 * - Everything else — unlocked navigations, hydration, and router work that
 *   is not a captured navigation (refreshes, history-traversal restores,
 *   server-action redirects, server patches) — uses this shared map
 *   directly, even while a lock is held.
 *
 * Binding at creation means a task queued before a lock scope begins never
 * leaks entries into the scope's map (or reads out of it), and a scope task's
 * late responses never leak into the shared map.
 */
export declare const segmentCacheMap: CacheMap<SegmentCacheEntry>;
export declare function getCurrentRouteCacheVersion(): number;
export declare function getCurrentSegmentCacheVersion(): number;
/**
 * Invalidates all prefetch cache entries (both route and segment caches).
 *
 * After invalidation, triggers re-prefetching of visible links and notifies
 * invalidation listeners.
 */
export declare function invalidateEntirePrefetchCache(nextUrl: string | null, tree: FlightRouterState): void;
/**
 * Invalidates all route cache entries. Route entries contain the tree structure
 * (which segments exist at a given URL) but not the segment data itself.
 *
 * After invalidation, triggers re-prefetching of visible links and notifies
 * invalidation listeners.
 */
export declare function invalidateRouteCacheEntries(nextUrl: string | null, tree: FlightRouterState): void;
/**
 * Invalidates all segment cache entries. Segment entries contain the actual
 * RSC data for each segment.
 *
 * After invalidation, triggers re-prefetching of visible links and notifies
 * invalidation listeners.
 */
export declare function invalidateSegmentCacheEntries(nextUrl: string | null, tree: FlightRouterState): void;
export declare function pingInvalidationListeners(nextUrl: string | null, tree: FlightRouterState): void;
export declare function readRouteCacheEntry(now: number, key: RouteCacheKey): RouteCacheEntry | null;
/**
 * Reads the cache entry for a segment during a navigation. Unlike a plain
 * lookup, prefers a Fulfilled entry over a more-specific Pending or Rejected
 * entry: during a navigation, a less-specific shell entry (e.g. params ->
 * Fallback) should be rendered immediately rather than blocking on a
 * more-specific Pending entry that may still be in-flight.
 *
 * Performs up to two lookups:
 *  1. An `onlyMatchFulfilled` lookup that walks past Pending/Rejected entries
 *     at more-specific keypaths to find a Fulfilled fallback (e.g. a cached
 *     shell).
 *  2. If no Fulfilled entry is found, a regular lookup that returns the most
 *     specific match regardless of status.
 */
export declare function readSegmentCacheEntryForNavigation(now: number, map: CacheMap<SegmentCacheEntry>, varyPath: SegmentVaryPath, restrictToShell?: boolean): SegmentCacheEntry | null;
export declare function waitForSegmentCacheEntry(pendingEntry: PendingSegmentCacheEntry): Promise<FulfilledSegmentCacheEntry | null>;
/**
 * Checks if an entry for a route exists in the cache. If so, it returns the
 * entry, If not, it adds an empty entry to the cache and returns it.
 */
export declare function readOrCreateRouteCacheEntry(now: number, task: PrefetchTask, key: RouteCacheKey): RouteCacheEntry;
export declare function deprecated_requestOptimisticRouteCacheEntry(now: number, requestedUrl: URL, nextUrl: string | null): FulfilledRouteCacheEntry | null;
/**
 * Checks if an entry for a segment exists in the cache. If so, it returns the
 * entry, If not, it adds an empty entry to the cache and returns it.
 */
export declare function readOrCreateSegmentCacheEntry(now: number, map: CacheMap<SegmentCacheEntry>, fetchStrategy: FetchStrategy, tree: RouteTree): SegmentCacheEntry;
export declare function readOrCreateRevalidatingSegmentEntry(now: number, map: CacheMap<SegmentCacheEntry>, fetchStrategy: FetchStrategy, tree: RouteTree): SegmentCacheEntry;
export declare function overwriteRevalidatingSegmentCacheEntry(now: number, map: CacheMap<SegmentCacheEntry>, fetchStrategy: FetchStrategy, tree: RouteTree): EmptySegmentCacheEntry;
export declare function upsertSegmentEntry(now: number, map: CacheMap<SegmentCacheEntry>, varyPath: SegmentVaryPath, candidateEntry: SegmentCacheEntry, lookupVaryPath: SegmentVaryPath | null): SegmentCacheEntry | null;
export declare function createDetachedSegmentCacheEntry(now: number): EmptySegmentCacheEntry;
export declare function upgradeToPendingSegment(emptyEntry: EmptySegmentCacheEntry, fetchStrategy: FetchStrategy): PendingSegmentCacheEntry;
export declare function attemptToFulfillDynamicSegmentFromBFCache(now: number, segment: EmptySegmentCacheEntry, tree: RouteTree): FulfilledSegmentCacheEntry | null;
/**
 * Attempts to replace an existing segment cache entry with data from the
 * bfcache. Unlike `attemptToFulfillDynamicSegmentFromBFCache` (which fills an
 * empty entry), this creates a new entry and upserts it, so it works even when
 * the segment is already fulfilled.
 */
export declare function attemptToUpgradeSegmentFromBFCache(now: number, map: CacheMap<SegmentCacheEntry>, tree: RouteTree): FulfilledSegmentCacheEntry | null;
export declare function createMetadataRouteTree(metadataVaryPath: PageVaryPath): RouteTree;
export declare function fulfillRouteCacheEntry(now: number, entry: PendingRouteCacheEntry, tree: RouteTree, metadataVaryPath: PageVaryPath, couldBeIntercepted: boolean, canonicalUrl: string, supportsPerSegmentPrefetching: boolean): FulfilledRouteCacheEntry;
export declare function writeRouteIntoCache(now: number, pathname: NormalizedPathname, search: NormalizedSearch, nextUrl: string | null, tree: RouteTree, metadataVaryPath: PageVaryPath, couldBeIntercepted: boolean, canonicalUrl: string, supportsPerSegmentPrefetching: boolean): FulfilledRouteCacheEntry;
/**
 * Marks a route cache entry as having a dynamic rewrite. Called when we
 * discover that a route pattern has dynamic rewrite behavior - i.e., we used
 * an optimistic route tree for prediction, but the server responded with a
 * different rendered pathname.
 *
 * Once marked, attempts to use this entry as a template for prediction will
 * bail out to server resolution.
 */
export declare function markRouteEntryAsDynamicRewrite(entry: FulfilledRouteCacheEntry): void;
type RouteTreeAccumulator = {
    metadataVaryPath: PageVaryPath | null;
    treeDivergedFromBase: boolean;
};
export declare function convertRootFlightRouterStateToRouteTree(flightRouterState: FlightRouterState, renderedSearch: NormalizedSearch, acc: RouteTreeAccumulator): RouteTree;
export declare function convertReusedFlightRouterStateToRouteTree(parentRouteTree: RouteTree, parallelRouteKey: string, flightRouterState: FlightRouterState, renderedSearch: NormalizedSearch, acc: RouteTreeAccumulator): RouteTree;
export declare function convertRouteTreeToFlightRouterState(routeTree: RouteTree): FlightRouterState;
export declare function fetchRouteOnCacheMiss(entry: PendingRouteCacheEntry, key: RouteCacheKey, map: CacheMap<SegmentCacheEntry>): Promise<PrefetchSubtaskResult<null> | null>;
export declare function fetchSegmentsOnCacheMiss(task: PrefetchTask, route: FulfilledRouteCacheEntry, routeKey: RouteCacheKey, tree: RouteTree, segments: SegmentBundle, segmentCount: number, fetchStrategy: FetchStrategy.PPR | FetchStrategy.StaticShell): Promise<PrefetchSubtaskResult<null> | null>;
export declare function fetchSegmentPrefetchesUsingDynamicRequest(task: PrefetchTask, route: FulfilledRouteCacheEntry, fetchStrategy: FetchStrategy.LoadingBoundary | FetchStrategy.PPRRuntime | FetchStrategy.RuntimeShell | FetchStrategy.Full, dynamicRequestTree: FlightRouterState, spawnedEntries: Map<SegmentRequestKey, PendingSegmentCacheEntry>): Promise<PrefetchSubtaskResult<null> | null>;
export declare function writeDynamicRenderResponseIntoCache(now: number, fetchStrategy: FetchStrategy.LoadingBoundary | FetchStrategy.PPR | FetchStrategy.PPRRuntime | FetchStrategy.RuntimeShell | FetchStrategy.Full, flightDatas: NormalizedFlightData[], buildId: string | undefined, isResponsePartial: boolean, headVaryParams: VaryParams | null, rootVaryParamsIterable: VaryParamsIterable | null, staleAt: number, navigationSeed: NavigationSeed, spawnedEntries: Map<SegmentRequestKey, PendingSegmentCacheEntry> | null, map: CacheMap<SegmentCacheEntry>): Array<FulfilledSegmentCacheEntry> | null;
export declare function createNonTaskyPrefetchResponseStream(body: ReadableStream<Uint8Array>, byteLimit?: number): Promise<{
    stream: ReadableStream<Uint8Array>;
    size: number;
    buffer: Uint8Array;
}>;
/**
 * Checks whether the new fetch strategy is likely to provide more content than the old one.
 *
 * Generally, when an app uses dynamic data, a "more specific" fetch strategy is expected to provide more content:
 * - `LoadingBoundary` only provides static layouts
 * - `StaticShell` provides the App Shell variant extracted from a static response —
 *   param-dependent content reduced to pending fallbacks, and never any content that
 *   depends on session data (cookies, headers)
 * - `RuntimeShell` provides the App Shell rendered by a runtime request, which can
 *   additionally include shell content that depends on session data
 * - `PPR` can provide shells for each segment (even for segments that use dynamic data),
 *   including prerendered param-dependent content at concrete paths
 * - `PPRRuntime` can additionally include content that uses searchParams, params, or cookies
 * - `Full` includes all the content, even if it uses dynamic data
 *
 * However, it's possible that a more specific fetch strategy *won't* give us more content if:
 * - a segment is fully static
 *   (then, `PPR`/`PPRRuntime`/`Full` will all yield equivalent results)
 * - providing searchParams/params/cookies doesn't reveal any more content, e.g. because of an `await connection()`
 *   (then, `PPR` and `PPRRuntime` will yield equivalent results, only `Full` will give us more)
 * Because of this, when comparing two segments, we should also check if the existing segment is partial.
 * If it's not partial, then there's no need to prefetch it again, even using a "more specific" strategy.
 * There's currently no way to know if `PPRRuntime` will yield more data that `PPR`, so we have to assume it will.
 *
 * Also note that, in practice, we don't expect to be comparing `LoadingBoundary` to `PPR`/`PPRRuntime`,
 * because a non-PPR-enabled route wouldn't ever use the latter strategies. It might however use `Full`.
 */
export declare function canNewFetchStrategyProvideMoreContent(currentStrategy: FetchStrategy, newStrategy: FetchStrategy): boolean;
/**
 * Reads a stale-at time by `await`ing the staleTime async iterable (last
 * yielded value wins) and, if a `response` is given and the iterable yields
 * nothing, falling back to the `Next-Router-Stale-Time` header.
 *
 * The async form is required for the two things `readFulfilledStaleAt` can't
 * do: the header fallback, and reading a dynamic `Full` response
 * (fetchStrategy.Full with Partial Prefetching disabled) — the one response
 * kind that isn't buffered before it's read, so its iterable values must be
 * awaited rather than drained synchronously off their thenable status.
 *
 * Buffered responses (static PPR, runtime prefetch, stage decodes) don't need
 * the async form: segment bundles and the shell-stage decode already read
 * staleTime synchronously via `readFulfilledStaleAt`, and the remaining
 * buffered callers here could be moved to it too.
 */
export declare function resolveStaleAt(now: number, staleTimeIterable: AsyncIterable<number> | undefined, response?: RSCResponse<unknown>): Promise<number>;
/**
 * Writes a prerender response into the segment cache at the vary path
 * determined by `fetchStrategy`. Default segments are skipped (by
 * `writeSeedDataIntoCache`) to avoid caching fallback content that would
 * block refreshes from overwriting with dynamic data.
 */
export declare function writePrerenderResponseIntoCache(now: number, fetchStrategy: FetchStrategy.PPR | FetchStrategy.RuntimeShell, flightData: FlightData, buildId: string | undefined, headVaryParamsIterable: VaryParamsIterable | null, rootVaryParamsIterable: VaryParamsIterable | null, staleAt: number, baseTree: FlightRouterState, renderedSearch: string, isResponsePartial: boolean, map: CacheMap<SegmentCacheEntry>): void;
/**
 * Decodes an embedded runtime prefetch Flight stream, normalizes the flight
 * data, and derives a `NavigationSeed` from the base tree.
 *
 * Returns `null` if the response triggers an MPA navigation.
 */
export declare function processRuntimePrefetchStream(now: number, runtimePrefetchStream: ReadableStream<Uint8Array>, baseTree: FlightRouterState, renderedSearch: string): Promise<{
    flightDatas: NormalizedFlightData[];
    navigationSeed: NavigationSeed;
    buildId: string | undefined;
    isResponsePartial: boolean;
    headVaryParams: VaryParams | null;
    rootVaryParamsIterable: VaryParamsIterable | null;
    staleAt: number;
} | null>;
/**
 * Strips the leading isPartial byte from an RSC response stream.
 *
 * The server prepends a single byte: '~' (0x7e) for partial, '#' (0x23) for
 * complete. These bytes cannot appear as the first byte of a valid RSC Flight
 * response (Flight rows start with a hex digit or ':').
 *
 * If the first byte is not a recognized marker, the stream is returned intact
 * and `isPartial` is determined by the cachedNavigations experimental flag.
 */
export declare function stripIsPartialByte(stream: ReadableStream<Uint8Array>): Promise<{
    stream: ReadableStream<Uint8Array>;
    isPartial: boolean;
}>;
