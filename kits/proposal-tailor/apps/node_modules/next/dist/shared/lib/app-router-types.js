/**
 * App Router types - Client-safe types for the Next.js App Router
 *
 * This file contains type definitions that can be safely imported
 * by both client-side and server-side code without circular dependencies.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    PrefetchHint: null,
    StaticPrefetchDisabled: null,
    SubtreePrefetchHints: null,
    propagateSubtreeBits: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    PrefetchHint: function() {
        return PrefetchHint;
    },
    StaticPrefetchDisabled: function() {
        return StaticPrefetchDisabled;
    },
    SubtreePrefetchHints: function() {
        return SubtreePrefetchHints;
    },
    propagateSubtreeBits: function() {
        return propagateSubtreeBits;
    }
});
var PrefetchHint = /*#__PURE__*/ function(PrefetchHint) {
    // NOTE: The 0b00001 bit was previously HasRuntimePrefetch (prefetch:
    // 'allow-runtime'). Partial Prefetching now implies runtime completeness
    // for every segment, so the bit was removed. Do not reuse it without
    // considering caches populated by older builds.
    // This segment or one of its descendants opts into Partial Prefetching, i.e.
    // uses the two-phase (Shell then Speculative) prefetch flow. Set when
    // `prefetch` is 'partial' or 'unstable_eager' (including the defaults
    // implied by the global `partialPrefetching` config). Propagates upward so
    // the root segment reflects the entire subtree.
    //
    // Partial Prefetching segments require RUNTIME COMPLETENESS: a prefetch
    // isn't considered done for such a segment until an entry at least as
    // complete as a runtime response exists. This does NOT mean the segment
    // lacks static data — the server emits static data unconditionally, and the
    // scheduler may attempt a static prefetch first (per
    // ShouldAttemptStaticPrefetch), issuing the runtime request only if the
    // static response's own `needsRuntimeRequest` signal says it would
    // return more.
    PrefetchHint[PrefetchHint["SubtreeHasPartialPrefetching"] = 2] = "SubtreeHasPartialPrefetching";
    // This segment itself has a loading.tsx boundary.
    PrefetchHint[PrefetchHint["SegmentHasLoadingBoundary"] = 4] = "SegmentHasLoadingBoundary";
    // A descendant segment (but not this one) has a loading.tsx boundary.
    // Propagates upward so the root reflects the entire subtree.
    PrefetchHint[PrefetchHint["SubtreeHasLoadingBoundary"] = 8] = "SubtreeHasLoadingBoundary";
    // This segment is at or above the application's root layout — the root layout
    // segment itself and all of its ancestors. A dynamic param in one of these
    // segments is a "root param".
    PrefetchHint[PrefetchHint["IsRootLayoutOrAbove"] = 16] = "IsRootLayoutOrAbove";
    // This segment's response includes its parent's data inlined into it.
    // Set at build time by the segment size measurement pass.
    PrefetchHint[PrefetchHint["ParentInlinedIntoSelf"] = 32] = "ParentInlinedIntoSelf";
    // This segment's data is inlined into one of its children — don't fetch
    // it separately. Set at build time by the segment size measurement pass.
    PrefetchHint[PrefetchHint["InlinedIntoChild"] = 64] = "InlinedIntoChild";
    // On a __PAGE__: this page's response includes the head (metadata/viewport)
    // at the end of its SegmentPrefetch[] array.
    PrefetchHint[PrefetchHint["HeadInlinedIntoSelf"] = 128] = "HeadInlinedIntoSelf";
    // On the root hint node: the head was NOT inlined into any page — fetch
    // it separately. Absence of this bit means the head is bundled into a page.
    PrefetchHint[PrefetchHint["HeadOutlined"] = 256] = "HeadOutlined";
    // The inlining hints in this tree may be stale because the tree was
    // generated before collectPrefetchHints ran (e.g. the initial RSC payload
    // for a fully static page at build time). When writing this tree into the
    // cache, the route entry should be immediately expired so it gets
    // re-fetched with correct hints. Only set during build-time prerendering,
    // never at runtime.
    PrefetchHint[PrefetchHint["InliningHintsStale"] = 512] = "InliningHintsStale";
    // This segment has prefetch = 'force-disabled'. The opt-out is passive
    // and applies to this segment only: it never INITIATES a prefetch — no
    // static data is emitted or fetched, and it's never the reason a runtime
    // prefetch spawns — but it may ride along in a runtime response issued on
    // another segment's behalf. Descendants prefetch normally.
    //
    // TODO: Also set as an internal fallback when the prefetch hints manifest
    // is unavailable (see #91407 mitigations), which only means "no static
    // prefetch data exists" — not a user opt-out. Split the fallback into its
    // own bit so the two intents can diverge.
    PrefetchHint[PrefetchHint["PrefetchDisabled"] = 1024] = "PrefetchDisabled";
    // NOTE: The 0b100000000000 bit was previously SubtreeHasRuntimePrefetch.
    // Partial Prefetching now implies runtime completeness for every segment
    // (see SubtreeHasPartialPrefetching), so the bit was removed. Do not reuse
    // it without considering caches populated by older builds.
    // This segment or one of its descendants prefetches "eagerly" — i.e. its
    // effective prefetch strategy is anything other than 'partial'. Used by
    // App Shells: a non-eager subtree relies on the shared app shell and skips
    // its Speculative prefetch. Propagates upward so the root reflects the
    // entire subtree.
    PrefetchHint[PrefetchHint["SubtreeHasEagerPrefetch"] = 4096] = "SubtreeHasEagerPrefetch";
    // This segment or one of its descendants exports `instant = false`,
    // explicitly opting out of Partial Prefetching. Propagates upward so the root
    // reflects the entire subtree. Used only to suppress the dev-time
    // `<Link prefetch={true}>` warning — unlike PrefetchDisabled, it has no effect
    // on the actual prefetch behavior.
    PrefetchHint[PrefetchHint["SubtreeHasInstantFalse"] = 8192] = "SubtreeHasInstantFalse";
    // The client should attempt a static prefetch for this route: the
    // build-time prerender did not access any runtime data (cookies, headers,
    // searchParams, ...), so a static prefetch is expected to be as complete
    // as a runtime one. A fallback-param access only unsets the bit when the
    // route can never be upgraded from a fallback to a concrete prerender —
    // on an upgradeable route, ISR later produces the concrete prerender a
    // static attempt would hit (until then, the static responses' own
    // signal reports the insufficiency per response). Purely advisory, and
    // both error directions are safe: if set when a runtime request is
    // actually needed, that same response-level signal (the load-bearing
    // `needsRuntimeRequest` promise combined with each segment's `isPartial`)
    // directs the client to follow up — the cost is a wasted static attempt.
    // If unset when static would have sufficed, the client goes straight to a
    // runtime prefetch, which is a superset of the static response — the cost
    // is only reduced cacheability. Like the other bits, this one is computed
    // once per build and stays constant for the build's lifetime; it rides
    // the prefetch-hints manifest into every response that carries hints —
    // `/_tree` prefetch responses and the FlightRouterState of dynamic
    // navigations alike. (Routes missing from the manifest — see the #91407
    // fallbacks — simply never carry it.) Set on every node of the tree, but
    // does not propagate.
    PrefetchHint[PrefetchHint["ShouldAttemptStaticPrefetch"] = 16384] = "ShouldAttemptStaticPrefetch";
    return PrefetchHint;
}({});
const StaticPrefetchDisabled = 1024;
const SubtreePrefetchHints = 2 | 8 | 8192 | 4096;
function propagateSubtreeBits(parentHints, childHints) {
    if (childHints & 2) {
        parentHints |= 2;
    }
    // A child with a loading boundary (directly, or anywhere in its subtree) makes
    // this a SubtreeHasLoadingBoundary on the parent.
    if (childHints & (4 | 8)) {
        parentHints |= 8;
    }
    // And for eager prefetch. The bit is set directly on each eager segment, so
    // there's no separate segment-local flag — propagate it as-is.
    if (childHints & 4096) {
        parentHints |= 4096;
    }
    // And for `instant = false`. Like eager prefetch, the bit is set directly on
    // each opted-out segment, so propagate it as-is.
    if (childHints & 8192) {
        parentHints |= 8192;
    }
    return parentHints;
}

//# sourceMappingURL=app-router-types.js.map