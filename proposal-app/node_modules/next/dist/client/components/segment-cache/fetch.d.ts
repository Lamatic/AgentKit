/**
 * Internal `fetch` used by the Next.js client router.
 *
 * When the Instant Navigation Testing API is enabled, the navigation lock may
 * install a blocking override on `window.fetch` for the duration of a lock
 * scope. To let internal fetches bypass the lock, callers go through a wrapper
 * that falls back to the pre-lock fetch captured at lock-acquire time.
 *
 * When the testing API is not enabled, this calls window.fetch directly.
 */
declare function fetchInternal(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
export { fetchInternal as fetch };
