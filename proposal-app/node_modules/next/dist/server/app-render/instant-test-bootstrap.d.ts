/**
 * Builds the inline bootstrap script content for the Instant Navigation Testing
 * API. It is embedded via React's `bootstrapScriptContent` into the prerendered
 * shell (and dynamic renders) so that it ends up in the cached static prelude
 * and runs before the client bootstrap module (app-index) reads
 * self.__next_instant_test as its hydration source.
 *
 * The script is cookie-guarded so it is inert unless the instant test cookie is
 * present (the prelude is shared across all requests). The fetch mirrors the
 * __NEXT_CLIENT_RESUME prefetch used for fallback routes; the instant test
 * cookie rides along on the same-origin request, so the server returns
 * static-only data, which doubles as the feature flag (truthy = instant mode).
 */
export declare function getInstantTestBootstrapScriptContent(): Promise<string>;
