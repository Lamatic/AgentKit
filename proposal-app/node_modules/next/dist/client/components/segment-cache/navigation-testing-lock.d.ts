/**
 * Navigation lock for the Instant Navigation Testing API.
 *
 * Manages the in-memory lock (a promise) that gates dynamic data writes
 * during instant navigation captures, and owns all cookie state
 * transitions (pending → captured-MPA, pending → captured-SPA).
 *
 * External actors (Playwright, devtools) set [0] to start a lock scope
 * and delete the cookie to end one. Next.js writes captured values.
 * The CookieStore handler distinguishes them by value: pending = external,
 * captured = self-write (ignored).
 *
 * This module assumes the Instant Navigation Testing API is enabled. When it
 * is disabled, the bundler resolves this module to
 * `./navigation-testing-lock.disabled` instead (see
 * `create-compiler-aliases.ts` for webpack and
 * `crates/next-core/src/next_import_map.rs` for Turbopack), so none of this
 * code ships in the browser bundle.
 */
import { type FlightRouterState } from '../../../shared/lib/app-router-types';
import type { SegmentCacheEntry } from './cache';
import { type CacheMap } from './cache-map';
import type { FetchStrategy } from './types';
/**
 * The "wait for the locked navigation's prefetch to fulfill" state for a single
 * locked navigation. `promise` resolves when the driving prefetch task
 * completes — which the scheduler only allows after a full pass has observed
 * every segment response it cares about (see `blockTaskOnPendingResponse` in
 * scheduler.ts) — so the navigation reads present data rather than a
 * still-in-flight entry. Owned by the prefetch task (one per navigation, so
 * successive navigations in a scope resolve independently) and also tracked
 * in `NavigationLockState.activePrefetches` so the lock can force-resolve any
 * that are still pending when it's released.
 */
export type NavigationLockPrefetch = {
    promise: Promise<void>;
    resolve: () => void;
};
export type NavigationLockState = {
    released: Promise<void>;
    resolveReleased: () => void;
    fetch: typeof fetch;
    activePrefetches: Set<NavigationLockPrefetch>;
    segmentCacheMap: CacheMap<SegmentCacheEntry>;
    currentNavigation: Promise<void>;
    resolveCurrentNavigation: () => void;
};
export declare function getPreLockFetch(): typeof fetch | null;
/**
 * Creates the "wait for prefetch to fulfill" state for one locked navigation,
 * registers it on the current lock, and returns it (the caller stores it on the
 * prefetch task and awaits `.promise`). Returns null if no lock is held.
 * Resolved by the scheduler via `resolveNavigationLockPrefetch` when the
 * driving prefetch task completes.
 */
export declare function beginNavigationLockPrefetch(): NavigationLockPrefetch | null;
/**
 * Returns the current lock scope's private segment cache map, or null when no
 * lock is held. See `NavigationLockState.segmentCacheMap`.
 */
export declare function getNavigationLockSegmentCacheMap(): CacheMap<SegmentCacheEntry> | null;
/**
 * Called by the scheduler when the locked-navigation prefetch task completes.
 * A task only completes after a full pass observed every segment response it
 * cares about, so the data the navigation will read has settled by this
 * point. Unregisters from the lock (if still held) and resolves. Resolving is
 * idempotent, so it's safe even if the lock already force-resolved this on
 * release.
 */
export declare function resolveNavigationLockPrefetch(prefetch: NavigationLockPrefetch): void;
/**
 * Called when a new locked navigation begins (from `navigate` while the lock is
 * held). Rolls over the lock's withheld-data gate: it resolves the current
 * `currentNavigation` promise — so the *previous* locked navigation's withheld
 * dynamic write proceeds and the cache nodes it produced stop holding pending
 * deferred `rsc` promises that a reused shared segment in this navigation would
 * otherwise suspend on — then installs a fresh promise for this navigation.
 * Only the most recent navigation's data stays withheld; a new navigation
 * always releases the previous one. Returns this navigation's gate — the
 * immutable promise its dynamic write awaits — or null when no lock is held.
 *
 * This is the testing-lock behavior for repeated navigations while paused. It
 * is not a principled fix for the underlying `useDeferredValue`/reuse-suspend
 * behavior; it just ensures that, under the lock, a reused segment never
 * carries a still-pending deferred `rsc` from an earlier navigation.
 */
export declare function beginLockedNavigation(): Promise<void> | null;
/**
 * Called when the router applies a history traversal (Back/Forward restore) while
 * the testing lock is active. A traversal is not a capture — the mental model is
 * that history entries are already cached — so it must not participate in the
 * current capture. Instead it resets the lock to a fresh pending scope:
 *
 * - `releaseLock` flushes every still-withheld write from prior forward
 *   navigations, so the pages you navigated away from finish streaming.
 * - `acquireLock` immediately re-arms a fresh pending scope (no gap where the
 *   lock or fetch blocker is down).
 * - the cookie flips from the captured state back to pending.
 *
 * The traversal's own dynamic requests are spawned ungated by the caller (see
 * `restore-reducer`), so they render from cache or fetch normally rather than
 * being withheld.
 */
export declare function resetNavigationLockToPending(): void;
/**
 * Sets up the cookie-based lock. Handles the initial page load state and
 * registers a CookieStore listener for runtime changes.
 *
 * Called once during page initialization from app-globals.ts.
 */
export declare function startListeningForInstantNavigationCookie(): void;
/**
 * Transitions the cookie from pending to captured-SPA once the prefetch resolves
 * and the navigation is known to be an SPA.
 */
export declare function updateCapturedSPAToTree(fromTree: FlightRouterState, toTree: FlightRouterState): void;
/**
 * Returns true if the navigation lock is currently active.
 */
export declare function isNavigationLocked(): boolean;
/**
 * Returns the current locked navigation's withheld-data gate — the same
 * immutable promise `beginLockedNavigation` handed that navigation — or null
 * when no lock is held. For router work that spawns a dynamic write without
 * beginning a navigation of its own (refreshes, server actions, server
 * patches): it gates behind the navigation that is current when it spawns, so
 * the next locked navigation (or unlock) releases it.
 */
export declare function getCurrentNavigationGate(): Promise<void> | null;
/**
 * Decides whether segment reads during a navigation should be restricted to
 * shell entries (every param substituted with Fallback) rather than matching
 * entries that vary on concrete route params.
 *
 * The testing tools (Navigation Inspector, instant()) simulate what a user
 * would see with a warm cache. When the lock is held, partial prefetching is
 * enabled for the target route, and no whole-route ("speculative") prefetch
 * would have been made, only the shell is prefetched — so that's all a
 * navigation should be allowed to match. A speculative prefetch happens for a
 * `<Link prefetch={true}>` or an eagerly-prefetched subtree, in which case the
 * concrete-param entry is genuinely warm and may be matched.
 *
 * Always returns false outside the testing API, via the aliased
 * `navigation-testing-lock.disabled` module.
 */
export declare function shouldRestrictNavigationToShell(rootPrefetchHints: number, linkFetchStrategy: FetchStrategy): boolean;
