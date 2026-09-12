/**
 * Shared types and constants for the Segment Cache.
 */ export var NavigationResultTag = /*#__PURE__*/ function(NavigationResultTag) {
    NavigationResultTag[NavigationResultTag["MPA"] = 0] = "MPA";
    NavigationResultTag[NavigationResultTag["Success"] = 1] = "Success";
    NavigationResultTag[NavigationResultTag["NoOp"] = 2] = "NoOp";
    NavigationResultTag[NavigationResultTag["Async"] = 3] = "Async";
    return NavigationResultTag;
}({});
/**
 * The priority of the prefetch task. Higher numbers are higher priority.
 */ export var PrefetchPriority = /*#__PURE__*/ function(PrefetchPriority) {
    /**
   * Assigned to the most recently hovered/touched link. Special network
   * bandwidth is reserved for this task only. There's only ever one Intent-
   * priority task at a time; when a new Intent task is scheduled, the previous
   * one is bumped down to Default.
   */ PrefetchPriority[PrefetchPriority["Intent"] = 2] = "Intent";
    /**
   * The default priority for prefetch tasks.
   */ PrefetchPriority[PrefetchPriority["Default"] = 1] = "Default";
    /**
   * Assigned to tasks when they spawn non-blocking background work, like
   * revalidating a partially cached entry to see if more data is available.
   */ PrefetchPriority[PrefetchPriority["Background"] = 0] = "Background";
    return PrefetchPriority;
}({});
export var FetchStrategy = /*#__PURE__*/ function(FetchStrategy) {
    // Deliberately ordered so we can easily compare two segments
    // and determine if one segment is "more specific" than another
    // (i.e. if it's likely that it contains more data). See
    // canNewFetchStrategyProvideMoreContent in cache.ts for what each tier can
    // contain relative to the others.
    //
    // These numeric values are client-internal and never cross the wire — the
    // `next-router-prefetch` request header values are mapped explicitly in
    // fetchSegmentPrefetchesUsingDynamicRequest (cache.ts) — so the members can
    // be renumbered freely as long as the relative order is preserved.
    FetchStrategy[FetchStrategy["LoadingBoundary"] = 0] = "LoadingBoundary";
    // The App Shell variant extracted from a static per-segment prefetch
    // response: every segment's param-dependent content is reduced to pending
    // references that render as the param fallback. Less complete than
    // RuntimeShell — a static response can't include content that depends on
    // session data (cookies, headers) — and less complete than PPR at concrete
    // paths, which includes prerendered param-dependent content.
    FetchStrategy[FetchStrategy["StaticShell"] = 1] = "StaticShell";
    FetchStrategy[FetchStrategy["RuntimeShell"] = 2] = "RuntimeShell";
    FetchStrategy[FetchStrategy["PPR"] = 3] = "PPR";
    FetchStrategy[FetchStrategy["PPRRuntime"] = 4] = "PPRRuntime";
    FetchStrategy[FetchStrategy["Full"] = 5] = "Full";
    return FetchStrategy;
}({});

//# sourceMappingURL=types.js.map