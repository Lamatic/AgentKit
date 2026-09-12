/**
 * Cookie reading and subscription for the instant navigation devtools panel.
 *
 * The cookie value is a JSON array:
 *   [0, id]        — pending (waiting to capture)
 *   [1, id, null]  — captured MPA page load
 *   [1, id, { from, to }] — captured SPA navigation (from/to route trees)
 *
 * The "to" tree may be null initially and updated after the prefetch resolves.
 */
import type { FlightRouterState } from '../../../../shared/lib/app-router-types';
import { type InstantNavCookieData } from '../../../../shared/lib/instant-nav-cookie';
export declare function readInstantNavCookieState(): InstantNavCookieData['state'] | null;
/**
 * Formats a FlightRouterState tree into a route pattern string for display.
 * Dynamic segments are shown with bracket syntax (e.g. [slug], [...params],
 * [[...optional]]) rather than their filled-in values. Search params are
 * omitted because they don't affect navigation.
 */
export declare function formatRoutePattern(tree: FlightRouterState): string;
/**
 * Subscribes to the instant navigation cookie value. The cookie is the
 * sole source of truth — this hook reads it via useSyncExternalStore.
 *
 * The raw cookie string is the snapshot (stable by value comparison).
 * Parsing into structured data happens during render via useMemo.
 *
 * Returns null when the cookie is absent.
 */
export declare function useInstantNavCookieState(): InstantNavCookieData | null;
