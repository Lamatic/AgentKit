import type { DynamicParamTypesShort, PrefetchHints } from '../../shared/lib/app-router-types';
import type { VaryParamsIterable } from '../../shared/lib/segment-cache/vary-params-decoding';
import type { ManifestNode } from '../../build/webpack/plugins/flight-manifest-plugin';
import { type SegmentRequestKey } from '../../shared/lib/segment-cache/segment-value-encoding';
export type RootTreePrefetch = {
    buildId?: string;
    tree: TreePrefetch;
    staleTime: number;
};
export type TreePrefetchParam = {
    type: DynamicParamTypesShort;
    key: string | null;
    siblings: readonly string[] | null;
};
export type TreePrefetch = {
    name: string;
    param: TreePrefetchParam | null;
    slots: null | {
        [parallelRouteKey: string]: TreePrefetch;
    };
    /** Bitmask of PrefetchHint flags for this segment and its subtree */
    prefetchHints: number;
};
/**
 * Top-level response for a segment prefetch request. Contains the build ID
 * and an array of segment data (one per segment in the bundle).
 *
 * Ordering contract: data[0] is the requested (terminal) segment. Subsequent
 * elements are ancestors that were inlined into this response, built by
 * walking the SegmentBundleNode linked list. The client's SegmentBundle
 * linked list is constructed in the same order during scheduling, so the
 * two are walked in parallel when the response arrives. A null element
 * indicates a disabled segment (prefetch: 'force-disabled') that occupies a
 * slot but carries no data. (Allow-runtime segments get real slots — the
 * server emits static data for them unconditionally.)
 */
export type SegmentPrefetchResponse = {
    buildId: string;
    data: Array<SegmentPrefetch | null>;
    /**
     * True if this response was generated from a fallback shell render (i.e. the
     * page had not yet been prerendered with concrete params, so it was rendered
     * with `fallbackRouteParams`). The client uses this to schedule a retry,
     * since a more complete version may become available once the server's
     * background regeneration finishes.
     *
     * Note: this is distinct from per-segment `isPartial`. A fully-prerendered
     * PPR page can have partial segments (dynamic holes filled by runtime
     * requests); those should not be retried. `isUpgradeableISRFallback` specifically means a
     * more complete *static* version may become available.
     */
    isUpgradeableISRFallback: boolean;
    /**
     * Shell byte boundary — the segment-level analogue of the route-level `a`.
     * A promise because the value is only known mid-stream; its resolution row
     * flushes past the boundary, so a truncated shell decode reads it as
     * pending, which is harmless.
     *
     * - `> 0`: byte offset such that re-decoding the response truncated there
     *   yields the shell variant of every segment — param-dependent content
     *   reduced to still-pending references (which render as the param fallback).
     * - `null`: the shell is the full response; no separate decode needed.
     * - `0`: no shell (the page wasn't produced by staged rendering). Never a
     *   valid offset — an envelope always has bytes — so it doubles as the
     *   "none" sentinel.
     */
    a: Promise<number | null>;
    /**
     * Root params accessed anywhere in this response, emitted once here rather
     * than folded into each segment's `varyParams`, mirroring the route-level
     * response's split of `r` from per-segment params. The client unions them
     * back in via `readVaryParams`.
     */
    rootVaryParams: VaryParamsIterable | null;
    /**
     * The page's runtime-data-access flag (the page payload's `u`), forwarded
     * from the staged decode of the page data: whether the prerender accessed
     * a data source that would have resolved during a runtime prerender
     * (cookies, headers, fallback params, searchParams, ...). The flag is
     * monotonic (false → true, at most once), so a promise suffices; the
     * client takes the settled value visible in its decode. Fulfilled `true`
     * means a runtime prefetch would return more than this static response;
     * pending or fulfilled `false` means it wouldn't. The answer is rewindable
     * because the fulfillment row lands on the same side of the shell byte
     * boundary (`a`) as the access it records: a decode truncated at `a` reads
     * pending for a post-shell access, i.e. `false` for the shell variant.
     *
     * Tracking is page-global, so this lives on the response envelope, not on
     * each segment. (A pending promise also costs Flight no abort listener on
     * the render, unlike an async iterable, which holds one for as long as
     * it's open.) Per-segment granularity comes from combining it with each
     * segment's `isPartial`:
     *
     *   needsRuntimeRequest(segment) = (settled true) && (isPartial pending)
     *
     * A segment whose `isPartial` promise fulfilled is fully static, and a
     * fully static segment gains nothing from a runtime request no matter what
     * the page accessed. Conversely, a partial segment on a page that accessed
     * no runtime data also reads `false`: its holes come from sources that hang
     * in a runtime prerender too (`io()`, `connection()`, uncached IO), and are
     * only filled by the navigation-time dynamic request.
     *
     * The derived value must never falsely claim that no runtime request is
     * needed, so every fallback is conservative: pages that carry no `u`
     * (legacy render paths) forward an already-resolved `true`. Unlike the
     * build-constant prefetch hints (including the tree-level
     * ShouldAttemptStaticPrefetch), this is computed per render and may change
     * between responses for the same build — it reflects THIS response.
     */
    needsRuntimeRequest: Promise<boolean>;
};
export type SegmentPrefetch = {
    rsc: React.ReactNode | null;
    /**
     * Fulfilled once the segment is known to be fully static. A partial segment
     * (dynamic holes a runtime request must fill) leaves this pending forever —
     * the same way Flight encodes the holes themselves — so the client reads a
     * pending `isPartial` as "partial". The fulfillment row, when there is one,
     * flushes past the shell boundary, so a truncated shell decode also reads
     * as partial: correct, since a shell has holes by construction.
     *
     * This monotonic pending → fulfilled encoding also serves as the
     * per-segment half of the needs-runtime-request derivation — see
     * `SegmentPrefetchResponse['needsRuntimeRequest']`.
     */
    isPartial: Promise<void>;
    /**
     * The segment's stale time in seconds, forwarded as an async iterable for
     * the same reason as the route-level `InitialRSCPayload.s`: its final value
     * is only known late in the stream, and the async-iterable form survives a
     * truncated/rewound shell decode (read via thenable status from the
     * buffered response). The client takes the last yielded value.
     */
    staleTime: AsyncIterable<number>;
    /**
     * The params this segment's own output depends on (not including the
     * response-level root params — see `rootVaryParams`). Forwarded as an async
     * iterable because, like the route-level response's params, the values are
     * only known late in the stream. The client cache keys reusable entries on
     * these.
     * - `null`: not tracked; conservatively assume all params matter.
     * - yields nothing: no params accessed; reusable for any param values.
     */
    varyParams: VaryParamsIterable | null;
};
export declare function collectSegmentData(isCacheComponentsEnabled: boolean, fullPageDataBuffer: Buffer, staleTime: number, clientModules: ManifestNode, serverConsumerManifest: any, prefetchInlining: boolean, hints: PrefetchHints | null, isUpgradeableISRFallback: boolean): Promise<Map<SegmentRequestKey, Buffer>>;
/**
 * Compute prefetch hints for a route by measuring segment sizes and deciding
 * which segments should be inlined. Only runs at build time. The results are
 * written to prefetch-hints.json and loaded at server startup.
 *
 * This is a separate pass from collectSegmentData so that the inlining
 * decisions can be fed back into collectSegmentData to control which segments
 * are output as separate entries vs. inlined into their parent.
 *
 * `shouldAttemptStaticPrefetch` (computed by the caller from the prerender's
 * runtime-data tracking) is folded onto every node of the result, so the
 * manifest delivers it to every response like the other hint bits. It's
 * independent of the inlining feature: when `inlining` is false the sizing
 * pass is skipped entirely — no inlining bits are emitted — and only the
 * tree shape carrying the static-prefetch hint is built.
 *
 * Both kinds of hint have the same structure and the same lifetime — one
 * bitmask per node of the route tree, measured once per build and constant
 * for the deployment. They differ only in what they're derived from: the
 * inlining bits from the size of each segment's encoded response, the
 * static-prefetch bit from what the decoded body turned out to access.
 */
export declare function collectPrefetchHints(fullPageDataBuffer: Buffer, staleTime: number, clientModules: ManifestNode, serverConsumerManifest: any, inlining: {
    maxSize: number;
    maxBundleSize: number;
} | false, shouldAttemptStaticPrefetch: boolean): Promise<PrefetchHints>;
