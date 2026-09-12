/**
 * App Router types - Client-safe types for the Next.js App Router
 *
 * This file contains type definitions that can be safely imported
 * by both client-side and server-side code without circular dependencies.
 */
import type React from 'react';
export type LoadingModuleData = [React.JSX.Element, React.ReactNode, React.ReactNode] | null;
import type { VaryParamsIterable } from './segment-cache/vary-params-decoding';
/** viewport metadata node */
export type HeadData = React.ReactNode;
/**
 * Cache node used in app-router / layout-router.
 */
export type CacheNode = {
    /**
     * When rsc is not null, it represents the RSC data for the
     * corresponding segment.
     *
     * `null` is a valid React Node but because segment data is always a
     * <LayoutRouter> component, we can use `null` to represent empty. When it is
     * null, it represents missing data, and rendering should suspend.
     */
    rsc: React.ReactNode;
    /**
     * Represents a static version of the segment that can be shown immediately,
     * and may or may not contain dynamic holes. It's prefetched before a
     * navigation occurs.
     *
     * During rendering, we will choose whether to render `rsc` or `prefetchRsc`
     * with `useDeferredValue`. As with the `rsc` field, a value of `null` means
     * no value was provided. In this case, the LayoutRouter will go straight to
     * rendering the `rsc` value; if that one is also missing, it will suspend and
     * trigger a lazy fetch.
     */
    prefetchRsc: React.ReactNode;
    prefetchHead: HeadData | null;
    head: HeadData;
    slots: Record<string, CacheNode> | null;
    /**
     * A shared mutable ref that tracks whether this segment should be scrolled
     * to. All new segments created during a single navigation share the same
     * ref. When any segment's scroll handler fires, it sets `current` to
     * `false` so no other segment scrolls for the same navigation.
     *
     * `null` means this segment is not a scroll target (e.g., a reused shared
     * layout segment).
     */
    scrollRef: ScrollRef | null;
    /**
     * Globally-unique identifier minted from a monotonic counter when the
     * CacheNode is freshly created. Surfaced to user code as a string via
     * `useRouter().bfcacheId` and intended to be used as a React `key` to
     * opt out of Activity-based state preservation on fresh navigations.
     *
     * Preserved when the CacheNode is reused (shared layouts, refresh,
     * search/hash-only navigations) or restored from the BFCache during a
     * back/forward navigation.
     */
    bfcacheId: number;
};
/**
 * A mutable ref shared across all new segments created during a single
 * navigation. Used to ensure that only one segment scrolls per navigation.
 */
export type ScrollRef = {
    current: boolean;
};
export type DynamicParamTypes = 'catchall' | 'catchall-intercepted-(..)(..)' | 'catchall-intercepted-(.)' | 'catchall-intercepted-(..)' | 'catchall-intercepted-(...)' | 'optional-catchall' | 'dynamic' | 'dynamic-intercepted-(..)(..)' | 'dynamic-intercepted-(.)' | 'dynamic-intercepted-(..)' | 'dynamic-intercepted-(...)';
export type DynamicParamTypesShort = 'c' | 'ci(..)(..)' | 'ci(.)' | 'ci(..)' | 'ci(...)' | 'oc' | 'd' | 'di(..)(..)' | 'di(.)' | 'di(..)' | 'di(...)';
export type DynamicSegmentTuple = [
    paramName: string,
    paramCacheKey: string,
    dynamicParamType: DynamicParamTypesShort,
    staticSiblings: readonly string[] | null
];
export type Segment = string | DynamicSegmentTuple;
/**
 * Router state
 */
export type FlightRouterState = [
    segment: Segment,
    parallelRoutes: {
        [parallelRouterKey: string]: FlightRouterState;
    },
    refreshState?: CompressedRefreshState | null,
    /**
     * - "refetch" is used during a request to inform the server where rendering
     *   should start from.
     *
     * - "inside-shared-layout" is used during a prefetch request to inform the
     *   server that even if the segment matches, it should be treated as if it's
     *   within the "new" part of a navigation — inside the shared layout. If
     *   the segment doesn't match, then it has no effect, since it would be
     *   treated as new regardless. If it does match, though, the server does not
     *   need to render it, because the client already has it.
     *
     * - "metadata-only" instructs the server to skip rendering the segments and
     *   only send the head data.
     *
     *   A bit confusing, but that's because it has only one extremely narrow use
     *   case — during a non-PPR prefetch, the server uses it to find the first
     *   loading boundary beneath a shared layout.
     *
     *   TODO: We should rethink the protocol for dynamic requests. It might not
     *   make sense for the client to send a FlightRouterState, since this type is
     *   overloaded with concerns.
     */
    refresh?: 'refetch' | 'inside-shared-layout' | 'metadata-only' | null,
    /**
     * Bitmask of PrefetchHint flags. Encodes route structure metadata:
     * root layout, loading boundaries, instant configs, and prefetch strategy
     * hints. Only set when non-zero.
     */
    prefetchHints?: number
];
/**
 * When rendering a parallel route, some of the parallel paths may not match
 * the current URL. In that case, the Next client has to render something,
 * so it will render whichever was the last route to match that slot. We use
 * this type to track when this has happened. It's a tuple of the original
 * URL that was used to fetch the segment, and the (possibly rewritten) search
 * query that was rendered by the server. The URL is needed when performing
 * a refresh of the segment, and the search query is needed for looking up
 * matching entries in the segment cache.
 */
export type CompressedRefreshState = [url: string, renderedSearch: string];
export declare const enum PrefetchHint {
    SubtreeHasPartialPrefetching = 2,
    SegmentHasLoadingBoundary = 4,
    SubtreeHasLoadingBoundary = 8,
    IsRootLayoutOrAbove = 16,
    ParentInlinedIntoSelf = 32,
    InlinedIntoChild = 64,
    HeadInlinedIntoSelf = 128,
    HeadOutlined = 256,
    InliningHintsStale = 512,
    PrefetchDisabled = 1024,
    SubtreeHasEagerPrefetch = 4096,
    SubtreeHasInstantFalse = 8192,
    ShouldAttemptStaticPrefetch = 16384
}
/**
 * Bitmask for checking whether a segment's static prefetch is skipped — i.e.
 * the server emits no static data for it (its slot in a segment bundle is
 * null, and it participates in the bundle chain only as a pass-through) and
 * the client never issues a static request for it.
 *
 * Static prefetching is disabled ONLY by `prefetch: 'force-disabled'`
 * (PrefetchDisabled). Notably, Partial Prefetching segments DO have static
 * data even though they require runtime completeness: the server emits it
 * unconditionally — it can't be gated on the ShouldAttemptStaticPrefetch
 * hint, because null-slot positions in segment bundles must be deterministic
 * from build-time config. A runtime request may still be needed for the
 * segment, but the scheduler may attempt a static prefetch first (per the
 * ShouldAttemptStaticPrefetch hint) and skip the runtime request if the
 * static response proves sufficient.
 *
 * Usage: `(hints & StaticPrefetchDisabled) !== 0`
 */
export declare const StaticPrefetchDisabled = PrefetchHint.PrefetchDisabled;
/**
 * The subset of PrefetchHint bits that propagate upward from a child segment to
 * its ancestors (as opposed to segment-local bits like SegmentHasLoadingBoundary
 * or IsRootLayoutOrAbove). Used to clear stale propagated bits before re-deriving them
 * from a node's children.
 */
export declare const SubtreePrefetchHints: number;
/**
 * Folds a child segment's prefetch hints into its parent's, propagating the
 * "subtree" flags. A child's segment-local flag (e.g. it has a loading
 * boundary) becomes the corresponding "subtree" flag on the parent, so the
 * root segment ends up reflecting the entire subtree.
 *
 * Used wherever a route tree is assembled bottom-up: on the server when building
 * a prefetch tree (createFlightRouterStateFromLoaderTree) and on the client when
 * merging a navigation patch into the existing tree (convertServerPatchToFullTree).
 * Keep these in sync by routing both through this helper.
 */
export declare function propagateSubtreeBits(parentHints: number, childHints: number): number;
/**
 * Individual Flight response path
 */
export type FlightSegmentPath = any[] | [
    segment: Segment,
    parallelRouterKey: string,
    segment: Segment,
    parallelRouterKey: string,
    segment: Segment,
    parallelRouterKey: string
];
/**
 * Represents a tree of segments and the Flight data (i.e. React nodes) that
 * correspond to each one. The tree is isomorphic to the FlightRouterState;
 * however in the future we want to be able to fetch arbitrary partial segments
 * without having to fetch all its children. So this response format will
 * likely change.
 */
export type CacheNodeSeedData = [
    node: React.ReactNode | null,
    parallelRoutes: {
        [parallelRouterKey: string]: CacheNodeSeedData | null;
    },
    loading: null,
    isPartial: boolean,
    /**
     * An AsyncIterable that yields the route params this segment accessed during
     * server rendering (one name per yield, deduped). Used by the client router
     * to determine cache key specificity - segments that only access certain
     * params can be reused across navigations where unaccessed params change.
     *
     * Does NOT include root params; those are emitted once at the top level of
     * the response (see `r` on the payload) and unioned in by the consumer.
     *
     * - null: tracking was not enabled for this render (e.g., not a prerender).
     *   Treat conservatively - assume all params vary.
     * - Drains to empty Set: segment accesses no params (e.g., client components,
     *   or server components that don't read params). Can be shared across all
     *   param values.
     * - Drains to non-empty Set: segment depends on those params. Can only reuse
     *   when those specific params match.
     */
    varyParams: VaryParamsIterable | null
];
export type FlightDataSegment = [
    Segment,
    FlightRouterState,
    CacheNodeSeedData | null,
    HeadData,
    boolean
];
export type FlightDataPath = any[] | [
    ...FlightSegmentPath[],
    ...FlightDataSegment
];
/**
 * The Flight response data
 */
export type FlightData = Array<FlightDataPath> | string;
/**
 * Per-route prefetch hints computed at build time. Mirrors the shape of the
 * loader tree so hints can be traversed in parallel during router state
 * creation. Each node stores a bitmask of PrefetchHint flags
 * (ParentInlinedIntoSelf, InlinedIntoChild) computed by the segment size
 * measurement pass.
 *
 * Persisted to prefetch-hints.json as Record<string, PrefetchHints> (keyed
 * by route pattern) and loaded at server startup.
 */
export type PrefetchHints = {
    /** Bitmask of PrefetchHint flags for this segment. */
    hints: number;
    /** Child hint nodes, keyed by parallel route key. */
    slots: Record<string, PrefetchHints> | null;
};
export type ActionResult = Promise<any>;
export type InitialRSCPayload = {
    /** buildId, can be empty if the x-nextjs-build-id header is set */
    b?: string;
    /** initialCanonicalUrlParts */
    c: string[];
    /** initialRenderedSearch */
    q: string;
    /** couldBeIntercepted */
    i: boolean;
    /** initialFlightData */
    f: FlightDataPath[];
    /** missingSlots */
    m: Set<string> | undefined;
    /** GlobalError */
    G: [React.ComponentType<any>, React.ReactNode | undefined];
    /** supportsPerSegmentPrefetching */
    S: boolean;
    /**
     * headVaryParams - vary params for the head (metadata) of the response.
     * Does not include root params (see `r`).
     */
    h: VaryParamsIterable | null;
    /**
     * rootVaryParams - the root params accessed anywhere in the response, emitted
     * once. The client unions these into the head and every segment's vary
     * params, rather than the server folding them into each set.
     */
    r?: VaryParamsIterable;
    /** staleTime in seconds - Only present when Cache Components is enabled. */
    s?: AsyncIterable<number>;
    /**
     * runtimeDataAccessed — whether the render has accessed a data source that
     * hangs during a static prerender but would resolve during a runtime
     * prerender (cookies, headers, fallback params, searchParams, ...). The
     * flag is monotonic (false → true, at most once), so it's encoded as a
     * promise: resolved `true` at the moment of first access — the fulfillment
     * row's position in the stream records the stage the access happened in —
     * or resolved `false` when the prerender completes without one, a row that
     * lands past every stage boundary. A truncated (shell) decode therefore
     * reads the answer as of the shell stage: fulfilled `true` iff the access
     * happened during a stage it includes, pending (⇒ no access) otherwise.
     * Unlike an async iterable, a pending promise costs Flight no abort
     * listener on the render. Used when generating per-segment prefetch
     * responses (forwarded as the response-level `needsRuntimeRequest`).
     * The build-constant `PrefetchHint.ShouldAttemptStaticPrefetch` is
     * tracked directly on the prerender store instead (its
     * `shouldAttemptStaticPrefetch` cell) — it needs neither stream
     * positioning nor this flag's param/non-param blindness. Only present
     * for static prerenders when Cache Components is enabled.
     */
    u?: Promise<boolean>;
    /** staticStageByteLength - Resolves when the static stage ends. */
    l?: Promise<number>;
    /**
     * shellByteLength - Resolves when the shell stage ends.
     * If it resolves to null, then the shell is the same as the main response.
     * */
    a?: Promise<number | null>;
    /** runtimePrefetchStream — Embedded runtime prefetch Flight stream. */
    p?: ReadableStream<Uint8Array>;
    /**
     * dynamicStaleTime — Per-page BFCache stale time in seconds, from
     * `unstable_dynamicStaleTime`. Only included for dynamic renders. Controls
     * how long the client router cache retains dynamic navigation data. This is
     * distinct from the `s` field, which controls segment cache (prefetch)
     * staleness.
     */
    d?: number;
    /**
     * revealAfter (dev only). Resolves once the server has flushed the
     * shell-stage content to the stream (static shell, or runtime-prefetchable
     * shell for runtime-prefetch routes), or earlier on a cache miss. The client
     * decodes this from the payload and defers resolving the response's deferred
     * RSCs on it, so a boundary's children aren't revealed before their row has
     * been decoded (which would flush a premature Suspense fallback). Its
     * resolution row follows the children's row in the payload, so the children
     * are decoded by the time the client unblocks. The HTML render gates on the
     * same signal server-side instead of reading this field.
     */
    _revealAfter?: Promise<void>;
};
export type NavigationFlightResponse = {
    /** buildId, can be empty if the x-nextjs-build-id header is set */
    b?: string;
    /** flightData */
    f: FlightData;
    /** supportsPerSegmentPrefetching */
    S: boolean;
    /** renderedSearch */
    q: string;
    /** couldBeIntercepted */
    i: boolean;
    /** staleTime - Only present in dynamic runtime prefetch responses. */
    s?: AsyncIterable<number>;
    /** staticStageByteLength - Resolves when the static stage ends. */
    l?: Promise<number>;
    /**
     * shellByteLength - Resolves when the shell stage ends.
     * If it resolves to null, then the shell is the same as the main response.
     * */
    a?: Promise<number | null>;
    /**
     * shellUsedSessionData - true if resolving session data
     * unblocked new content in the shell.
     * NOTE: only use this in runtime/session prefetch requests
     * where we have a proper session shell.
     * */
    u?: Promise<boolean>;
    /** headVaryParams. Does not include root params (see `r`). */
    h: VaryParamsIterable | null;
    /**
     * rootVaryParams - the root params accessed anywhere in the response, emitted
     * once. The client unions these into the head and every segment's vary
     * params.
     */
    r?: VaryParamsIterable;
    /** runtimePrefetchStream — Embedded runtime prefetch Flight stream. */
    p?: ReadableStream<Uint8Array>;
    /**
     * dynamicStaleTime — Per-page BFCache stale time in seconds, from
     * `unstable_dynamicStaleTime`. Only included for dynamic renders. Controls
     * how long the client router cache retains dynamic navigation data. This is
     * distinct from the `s` field, which controls segment cache (prefetch)
     * staleness.
     */
    d?: number;
    /**
     * revealAfter (dev only). Resolves once the server has flushed the
     * shell-stage content to the stream (static shell, or runtime-prefetchable
     * shell for runtime-prefetch routes), or earlier on a cache miss. The client
     * decodes this from the payload and defers resolving the response's deferred
     * RSCs on it, so a boundary's children aren't revealed before their row has
     * been decoded (which would flush a premature Suspense fallback). Its
     * resolution row follows the children's row in the payload, so the children
     * are decoded by the time the client unblocks. The HTML render gates on the
     * same signal server-side instead of reading this field.
     */
    _revealAfter?: Promise<void>;
};
export type ActionFlightResponse = {
    /** actionResult */
    a: ActionResult;
    /** buildId, can be empty if the x-nextjs-build-id header is set */
    b?: string;
    /** flightData */
    f: FlightData;
    /** renderedSearch */
    q: string;
    /** couldBeIntercepted */
    i: boolean;
};
export type RSCPayload = InitialRSCPayload | NavigationFlightResponse | ActionFlightResponse;
export type InstantCookie = [captured: 0, id: string] | [captured: 1, id: string, state: null] | [
    captured: 1,
    id: string,
    state: {
        from: FlightRouterState;
        to: FlightRouterState | null;
    }
];
