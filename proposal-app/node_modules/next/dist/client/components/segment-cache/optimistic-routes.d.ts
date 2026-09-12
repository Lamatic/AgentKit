/**
 * Optimistic Routing (Known Routes)
 *
 * This module enables the client to predict route structure for URLs that
 * haven't been prefetched yet, based on previously learned route patterns.
 * When successful, this allows skipping the route tree prefetch request
 * entirely.
 *
 * The core idea is that many URLs map to the same route structure. For example,
 * /blog/post-1 and /blog/post-2 both resolve to /blog/[slug]. Once we've
 * prefetched one, we can predict the structure of the other.
 *
 * However, we can't always make this prediction. Static siblings (like
 * /blog/featured alongside /blog/[slug]) have different route structures.
 * When we learn a dynamic route, we also learn its static siblings so we
 * know when NOT to apply the prediction.
 *
 * Main entry points:
 *
 * 1. discoverKnownRoute: Called after receiving a route tree from the server.
 *    Traverses the route tree, compares URL parts to segments, and populates
 *    the known route tree if they match. Routes are always inserted into the
 *    cache.
 *
 * 2. matchKnownRoute: Called when looking up a route with no cache entry.
 *    Matches the candidate URL against learned patterns. Returns a synthetic
 *    cache entry if successful, or null to fall back to server resolution.
 *
 * Rewrite detection happens during traversal: if a URL path part doesn't match
 * the corresponding route segment, we stop populating the known route tree
 * (since the mapping is incorrect) but still insert the route into the cache.
 *
 * The known route tree is append-only with no eviction. Route patterns are
 * derived from the filesystem, so they don't become stale within a session.
 * Cache invalidation on deploy clears everything anyway.
 *
 * Current limitations (deopt to server resolution):
 * - Rewrites: Detected during traversal (tree not populated, but route cached)
 * - Intercepted routes: The route tree varies by referrer (Next-Url header),
 *   so we can't predict the correct structure from the URL alone. Patterns are
 *   still stored during discovery (so the trie stays populated for non-
 *   intercepted siblings), but matching bails out when the pattern is marked
 *   as interceptable.
 */
import type { RouteTree, FulfilledRouteCacheEntry } from './cache';
import { type PendingRouteCacheEntry } from './cache';
import type { NormalizedSearch } from './cache-key';
import { type PageVaryPath } from './vary-path';
/**
 * Learns a route pattern from a server response and inserts it into the cache.
 *
 * Called after receiving a route tree from the server (initial load, navigation,
 * or prefetch). Traverses the route tree, compares URL parts to segments, and
 * populates the known route tree if they match. Routes are always inserted into
 * the cache regardless of whether the URL matches the route structure.
 *
 * When pendingEntry is provided, it's fulfilled and used. When null, an entry
 * is created and inserted into the route cache map.
 *
 * When hasDynamicRewrite is true, the route entry is marked as having a
 * dynamic rewrite, which prevents it from being used as a template for future
 * predictions. This is set when we detect a mismatch between what we predicted
 * and what the server returned.
 *
 * Returns the fulfilled route cache entry.
 */
export declare function discoverKnownRoute(now: number, pathname: string, search: NormalizedSearch, nextUrl: string | null, pendingEntry: PendingRouteCacheEntry | null, routeTree: RouteTree, metadataVaryPath: PageVaryPath, couldBeIntercepted: boolean, canonicalUrl: string, supportsPerSegmentPrefetching: boolean, hasDynamicRewrite: boolean): FulfilledRouteCacheEntry;
/**
 * Attempts to match a URL against learned route patterns.
 *
 * Returns a synthetic FulfilledRouteCacheEntry if the URL matches a known
 * pattern, or null if no match is found (fall back to server resolution).
 */
export declare function matchKnownRoute(now: number, pathname: string, search: NormalizedSearch): FulfilledRouteCacheEntry | null;
/**
 * Resets the known route tree. Called during development when routes may
 * change due to hot reloading.
 */
export declare function resetKnownRoutes(): void;
