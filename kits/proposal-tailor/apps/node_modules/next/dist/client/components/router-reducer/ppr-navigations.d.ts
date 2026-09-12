import type { CacheNodeSeedData, FlightRouterState } from '../../../shared/lib/app-router-types';
import type { CacheNode } from '../../../shared/lib/app-router-types';
import type { HeadData, ScrollRef } from '../../../shared/lib/app-router-types';
import { type SegmentCacheEntry, type RouteTree, type RefreshState, type FulfilledRouteCacheEntry } from '../segment-cache/cache';
import type { CacheMap } from '../segment-cache/cache-map';
import { type PageVaryPath } from '../segment-cache/vary-path';
export type NavigationTask = {
    status: NavigationTaskStatus;
    route: FlightRouterState;
    node: CacheNode;
    dynamicRequestTree: FlightRouterState | null;
    refreshState: RefreshState | null;
    children: Map<string, NavigationTask> | null;
};
export declare const enum FreshnessPolicy {
    Default = 0,
    Hydration = 1,
    HistoryTraversal = 2,
    RefreshAll = 3,
    HMRRefresh = 4,
    Gesture = 5
}
declare const enum NavigationTaskStatus {
    Pending = 0,
    Fulfilled = 1,
    Rejected = 2
}
export type NavigationRequestAccumulation = {
    separateRefreshUrls: Set<string> | null;
    /**
     * Set when a navigation creates new leaf segments that should be
     * scrolled to. Stays null when no new segments are created (e.g.
     * during a refresh where the route structure didn't change).
     */
    scrollRef: ScrollRef | null;
};
/**
 * A locked navigation's withheld-data gate, for the Instant Navigation Testing
 * API. Captured — as an immutable promise — when the navigation begins (via
 * `beginLockedNavigation`) or when router work spawns a dynamic write outside
 * a navigation (via `getCurrentNavigationLock`), and threaded to the write,
 * which awaits it before applying dynamic data. Resolves when a newer locked
 * navigation begins or the lock is released. Because the capture happens at
 * spawn time, a newer navigation's rollover releases this write rather than
 * re-gating it. Threaded as `NavigationLock | null`; null whenever the testing
 * API is not active.
 */
export type NavigationLock = Promise<void>;
export declare function createInitialCacheNodeForHydration(navigatedAt: number, initialTree: RouteTree, seedData: CacheNodeSeedData | null, seedHead: HeadData, seedDynamicStaleAt: number): NavigationTask;
export declare function startPPRNavigation(navigatedAt: number, oldUrl: URL, oldRenderedSearch: string, oldCacheNode: CacheNode | null, oldRouterState: FlightRouterState, newRouteTree: RouteTree, newMetadataVaryPath: PageVaryPath | null, freshness: FreshnessPolicy, seedData: CacheNodeSeedData | null, seedHead: HeadData | null, seedDynamicStaleAt: number, isSamePageNavigation: boolean, accumulation: NavigationRequestAccumulation, map: CacheMap<SegmentCacheEntry>, restrictToShell: boolean): NavigationTask | null;
export declare function spawnDynamicRequests(task: NavigationTask, primaryUrl: URL, nextUrl: string | null, freshnessPolicy: FreshnessPolicy, accumulation: NavigationRequestAccumulation, routeCacheEntry: FulfilledRouteCacheEntry | null, navigateType: 'push' | 'replace', navigationLock: NavigationLock | null, map: CacheMap<SegmentCacheEntry>, signal: AbortSignal | undefined): void;
type PendingDeferredRsc<T> = Promise<T> & {
    status: 'pending';
    resolve: (value: T, debugInfo: Array<any> | null) => void;
    reject: (error: any, debugInfo: Array<any> | null) => void;
    tag: Symbol;
    _debugInfo: Array<any>;
};
type FulfilledDeferredRsc<T> = Promise<T> & {
    status: 'fulfilled';
    value: T;
    resolve: (value: T, debugInfo: Array<any> | null) => void;
    reject: (error: any, debugInfo: Array<any> | null) => void;
    tag: Symbol;
    _debugInfo: Array<any>;
};
type RejectedDeferredRsc<T> = Promise<T> & {
    status: 'rejected';
    reason: any;
    resolve: (value: T, debugInfo: Array<any> | null) => void;
    reject: (error: any, debugInfo: Array<any> | null) => void;
    tag: Symbol;
    _debugInfo: Array<any>;
};
type DeferredRsc<T extends React.ReactNode = React.ReactNode> = PendingDeferredRsc<T> | FulfilledDeferredRsc<T> | RejectedDeferredRsc<T>;
export declare function isDeferredRsc(value: any): value is DeferredRsc;
/**
 * Helper for the Instant Navigation Testing API. Captures the withheld-data
 * gate of the locked navigation that is current when router work spawns a
 * dynamic write, so the write awaits that same gate even if a newer locked
 * navigation rolls the lock over before its response is applied.
 *
 * Not exposed in production builds by default.
 */
export declare function getCurrentNavigationLock(): NavigationLock | null;
/**
 * Helper for the Instant Navigation Testing API. Signals that a new locked
 * navigation is beginning: force-resolves the previous locked navigation's
 * withheld-data gate (without ending the scope) and returns a fresh gate for
 * this navigation, which the caller threads to its dynamic-data write. See
 * `beginLockedNavigation` in `navigation-testing-lock`.
 *
 * Not exposed in production builds by default.
 */
export declare function beginLockedNavigation(): NavigationLock | null;
/**
 * Helper for the Instant Navigation Testing API. Called during a history
 * traversal: resets the testing lock to a fresh pending scope, releasing any
 * withheld data from prior navigations. See `resetNavigationLockToPending` in
 * `navigation-testing-lock`.
 */
export declare function resetNavigationLockToPending(): void;
export {};
