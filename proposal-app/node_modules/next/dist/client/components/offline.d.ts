/**
 * Centralized offline detection, state management, and retry logic.
 *
 * This module tracks whether the app is offline and provides primitives for
 * retrying failed network requests. It is designed to be extended in the
 * future — e.g., instrumenting module chunk loading, Flight chunk resolution,
 * or eventually being promoted to a React-level feature.
 *
 * All stateful behavior (event listeners, polling, state tracking) only runs
 * in the browser. On the server and during hydration, getOffline() always
 * returns false.
 *
 * ## Known limitation: queued fetches
 *
 * When the user navigates multiple times while offline, each navigation queues
 * a separate fetch that blocks on waitForConnection(). When connectivity is
 * restored, all of them resume and retry simultaneously.
 *
 * Future mitigations:
 * - Stale cache access (PR 3): offline navigations will reuse back-forward
 *   cache entries, so most navigations won't issue new fetches at all. This is
 *   the primary shield against duplicate requests.
 * - Fetch cancellation: on router.refresh(), we could abort pending blocked
 *   fetches since refresh invalidates all dynamic caches.
 */
export type OfflineState = {
    promise: Promise<void>;
    resolve: () => void;
    timeoutHandle: ReturnType<typeof setTimeout> | null;
    backoffStep: number;
};
/**
 * Returns true if the error from a fetch() rejection indicates a network
 * failure (as opposed to an intentional abort or timeout). If it is a
 * network error, also starts the connectivity polling loop.
 *
 * - AbortError: the request was intentionally canceled via AbortSignal
 * - TimeoutError: AbortSignal.timeout() expired — could be a slow server,
 *   not necessarily offline
 */
export declare function checkOfflineError(err: unknown): boolean;
/**
 * Returns whether the app is currently considered offline (i.e., a
 * connectivity polling loop is active). Always returns false on the
 * server and during hydration.
 */
export declare function getOffline(): OfflineState | null;
/**
 * Call this when any network request succeeds while we're in the offline state.
 * If a polling loop is active, this short-circuits it — no need to wait for
 * the next HEAD check if we already know we're back online.
 */
export declare function notifyOnline(): void;
/**
 * Returns a promise that resolves when connectivity is restored.
 */
export declare function waitForConnection(state: OfflineState): Promise<void>;
