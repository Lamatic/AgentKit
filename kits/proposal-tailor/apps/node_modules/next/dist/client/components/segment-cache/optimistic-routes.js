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
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    discoverKnownRoute: null,
    matchKnownRoute: null,
    resetKnownRoutes: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    discoverKnownRoute: function() {
        return discoverKnownRoute;
    },
    matchKnownRoute: function() {
        return matchKnownRoute;
    },
    resetKnownRoutes: function() {
        return resetKnownRoutes;
    }
});
const _approutertypes = require("../../../shared/lib/app-router-types");
const _cache = require("./cache");
const _cachemap = require("./cache-map");
const _routeparams = require("../../route-params");
const _cachekey = require("./cache-key");
const _varypath = require("./vary-path");
/**
 * Read the pattern from a KnownRoutePart, evicting it if expired.
 *
 * This prevents stale patterns (e.g. from InliningHintsStale route entries
 * with staleAt = -1) from being cloned into synthetic entries indefinitely.
 * Once evicted, the pattern slot can be repopulated by the next
 * discoverKnownRoute call with a fresh entry from a /_tree response.
 */ function readPattern(now, part) {
    const pattern = part.pattern;
    if (pattern === null) {
        return null;
    }
    if ((0, _cachemap.isValueExpired)(now, (0, _cache.getCurrentRouteCacheVersion)(), pattern)) {
        // The pattern is expired. Null it out so the slot can be repopulated.
        part.pattern = null;
        return null;
    }
    return pattern;
}
function createEmptyPart() {
    return {
        staticChildren: null,
        dynamicChild: null,
        dynamicChildParamName: null,
        dynamicChildParamType: null,
        pattern: null,
        hasConflictingDynamicChildren: false
    };
}
// The root of the known route tree.
let knownRouteTreeRoot = createEmptyPart();
function discoverKnownRoute(now, pathname, search, nextUrl, pendingEntry, routeTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching, hasDynamicRewrite) {
    const tree = routeTree;
    const pathnameParts = (0, _cachekey.splitPathnameIntoParts)(pathname);
    if (pendingEntry !== null) {
        // Fulfill the pending entry first
        const fulfilledEntry = (0, _cache.fulfillRouteCacheEntry)(now, pendingEntry, tree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
        if (hasDynamicRewrite) {
            fulfilledEntry.hasDynamicRewrite = true;
        }
        // Populate the known route tree (handles rewrite detection internally).
        // The entry is already in the cache; this just stores it as a pattern
        // if the URL matches the route structure.
        discoverKnownRoutePart(knownRouteTreeRoot, tree, pathnameParts, 0, fulfilledEntry, now, pathname, search, nextUrl, tree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching, hasDynamicRewrite);
        return fulfilledEntry;
    }
    // No pending entry - discoverKnownRoutePart will create one and insert it
    // into the cache, or return an existing pattern if one exists.
    return discoverKnownRoutePart(knownRouteTreeRoot, tree, pathnameParts, 0, null, now, pathname, search, nextUrl, tree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching, hasDynamicRewrite);
}
/**
 * Bail out of populating the known route tree when discovery detects that the
 * URL doesn't match the route structure (a rewrite). The route entry is still
 * inserted into the cache for direct lookup — we just don't store it as a
 * pattern, since the URL and the tree describe different shapes.
 */ function handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching) {
    if (existingEntry !== null) {
        return existingEntry;
    }
    return (0, _cache.writeRouteIntoCache)(now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
}
/**
 * Gets or creates the dynamic child node for a KnownRoutePart. A node can
 * have at most one dynamic child. Sibling filesystem routes can't declare two
 * different params at the same level, but parallel route branches can (e.g.
 * @modal/[...catchAll] alongside [username]) — the caller detects that case
 * and marks the level as conflicted instead of calling this.
 */ function discoverDynamicChild(part, paramName, paramType) {
    if (part.dynamicChild !== null) {
        return part.dynamicChild;
    }
    const newChild = createEmptyPart();
    // Type assertion needed because we're converting from "without" to "with"
    // dynamic child variant.
    const mutablePart = part;
    mutablePart.dynamicChild = newChild;
    mutablePart.dynamicChildParamName = paramName;
    mutablePart.dynamicChildParamType = paramType;
    return newChild;
}
/**
 * Recursive workhorse for discoverKnownRoute.
 *
 * Walks the route tree and URL parts in parallel, building out the known
 * route tree as it goes. At each step:
 * 1. Determines if the current segment appears in the URL (dynamic/static)
 * 2. Validates URL matches route structure (detects rewrites)
 * 3. Creates/updates the corresponding KnownRoutePart node
 * 4. Records static siblings for future matching
 * 5. Recurses into child slots (parallel routes)
 *
 * If a URL/route mismatch is detected (rewrite), we stop building the known
 * route tree but still cache the route entry for direct lookup.
 */ function discoverKnownRoutePart(parentKnownRoutePart, routeTree, pathnameParts, partIndex, existingEntry, // These are passed through unchanged for entry creation at the leaf
now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching, hasDynamicRewrite) {
    const segment = routeTree.segment;
    const urlPart = partIndex < pathnameParts.length ? pathnameParts[partIndex] : null;
    let knownRoutePart = parentKnownRoutePart;
    let nextPartIndex = partIndex;
    if (typeof segment === 'string') {
        if ((0, _routeparams.doesStaticSegmentAppearInURL)(segment)) {
            // A visible static segment must consume exactly one URL part that
            // equals the segment. If the URL is exhausted or the URL part doesn't
            // match, the URL doesn't fit the route shape — the response was
            // rewrite-affected. Bail out.
            if (urlPart === null || urlPart !== segment) {
                return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
            }
            if (parentKnownRoutePart.staticChildren === null) {
                parentKnownRoutePart.staticChildren = new Map();
            }
            let existingChild = parentKnownRoutePart.staticChildren.get(urlPart);
            if (existingChild === undefined) {
                existingChild = createEmptyPart();
                parentKnownRoutePart.staticChildren.set(urlPart, existingChild);
            }
            knownRoutePart = existingChild;
            // Advance to next URL part.
            nextPartIndex = partIndex + 1;
        }
    // else: Transparent segment (route group, __PAGE__, etc.)
    // Stay at the same known route part, don't advance URL parts
    } else {
        // Dynamic segment tuple: [paramName, paramCacheKey, paramType, staticSiblings]
        const paramName = segment[0];
        const paramCacheKey = segment[1];
        const paramType = segment[2];
        const staticSiblings = segment[3];
        if (paramType !== 'oc' && urlPart === null) {
            // Every dynamic segment except the optional catch-all (`[[...param]]`)
            // must consume at least one URL part at runtime. If discovery reached
            // this segment with no URL parts left to consume, the URL doesn't fit
            // the route shape — the response was rewrite-affected. Bail out.
            return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
        }
        if (staticSiblings !== null && urlPart !== null && staticSiblings.includes(urlPart)) {
            // The route tree says this is a dynamic sibling, but the canonical URL
            // is a known static sibling. This is a mismatch.
            return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
        }
        // The param's cache key holds the value parsed from the *rendered*
        // pathname. If the URL part(s) this segment would consume don't equal
        // that value, the response was rewrite-affected in a way that shifts
        // which URL part maps to which segment (e.g. a proxy injected a leading
        // locale segment). A static segment catches this above by failing to
        // match its URL part; a dynamic segment consumes whatever part is in
        // front of it, so compare against the rendered value instead. Bail out.
        switch(paramType){
            case 'd':
                {
                    // Canonicalize the URL part to the same encoded form the server used
                    // for the cache key.
                    if (urlPart !== null && (0, _routeparams.canonicalizeURLPart)(urlPart) !== paramCacheKey) {
                        return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
                    }
                    break;
                }
            case 'c':
            case 'oc':
                {
                    // Catch-alls consume every remaining URL part; their cache keys are
                    // the rendered parts joined with '/' (empty string for an empty
                    // optional catch-all). Comparing the joined remainder also catches a
                    // rewrite that appended segments the URL doesn't have.
                    const joinedRemainingParts = pathnameParts.slice(partIndex).map(_routeparams.canonicalizeURLPart).join('/');
                    if (joinedRemainingParts !== paramCacheKey) {
                        return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
                    }
                    break;
                }
            case 'ci(..)(..)':
            case 'ci(.)':
            case 'ci(..)':
            case 'ci(...)':
            case 'di(..)(..)':
            case 'di(.)':
            case 'di(..)':
            case 'di(...)':
                break;
            default:
                paramType;
        }
        if (parentKnownRoutePart.hasConflictingDynamicChildren || parentKnownRoutePart.dynamicChild !== null && (parentKnownRoutePart.dynamicChildParamName !== paramName || parentKnownRoutePart.dynamicChildParamType !== paramType)) {
            // A different parallel route branch already claimed the dynamic child
            // at this level with a different param. Mark the level as conflicted
            // so matching bails out, and don't store a pattern via this branch.
            parentKnownRoutePart.hasConflictingDynamicChildren = true;
            return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
        }
        // URL matches route structure. Build the known route tree.
        knownRoutePart = discoverDynamicChild(parentKnownRoutePart, paramName, paramType);
        // Record static siblings as placeholder parts.
        // IMPORTANT: We use the null vs Map distinction to track whether
        // siblings are known at this level:
        // - staticChildren: null = siblings unknown (can't safely match dynamic)
        // - staticChildren: Map = siblings known (even if empty)
        // This matters in dev mode where webpack may not know all siblings yet.
        if (staticSiblings !== null) {
            // Siblings are known - ensure we have a Map (even if empty)
            if (parentKnownRoutePart.staticChildren === null) {
                parentKnownRoutePart.staticChildren = new Map();
            }
            for (const sibling of staticSiblings){
                if (!parentKnownRoutePart.staticChildren.has(sibling)) {
                    parentKnownRoutePart.staticChildren.set(sibling, createEmptyPart());
                }
            }
        }
        // Advance to next URL part. Catch-all segments (`[...param]` and
        // `[[...param]]`) absorb every remaining URL part at runtime (see
        // `matchKnownRoutePart`, which slices the rest of `pathnameParts`).
        if (paramType === 'c' || paramType === 'oc') {
            nextPartIndex = pathnameParts.length;
        } else {
            nextPartIndex = partIndex + 1;
        }
    }
    // Recurse into child routes. A route tree can have multiple parallel routes
    // (e.g., @modal alongside children). Each parallel route is a separate
    // branch, but they all share the same URL - we just need to traverse all
    // branches to build out the known route tree.
    const slots = routeTree.slots;
    let resultFromChildren = null;
    if (slots !== null) {
        for (const childRouteTree of slots.values()){
            // Skip branches with refreshState set - these were reused from a
            // different route (e.g., a "default" parallel slot) and don't represent
            // the actual route structure for this URL.
            if (childRouteTree.refreshState !== null) {
                continue;
            }
            const result = discoverKnownRoutePart(knownRoutePart, childRouteTree, pathnameParts, nextPartIndex, existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching, hasDynamicRewrite);
            // All parallel route branches share the same URL, so they should all
            // reach compatible leaf nodes. We capture any result.
            resultFromChildren = result;
        }
        if (resultFromChildren !== null) {
            return resultFromChildren;
        }
        // Defensive fallback: no children returned a result. This shouldn't happen
        // for valid route trees, but handle it gracefully.
        return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
    }
    // Reached a page node (`__PAGE__` leaf). If there are still URL parts
    // left to consume, the route tree is shorter than the URL, which means
    // the URL doesn't match the route structure (likely a rewrite).
    if (nextPartIndex < pathnameParts.length) {
        return handleMismatchDueToRewrite(existingEntry, now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
    }
    // Reached a page node. Create/get the route cache entry and store as a
    // pattern. First, check if there's already a pattern for this route.
    const existingPattern = readPattern(now, knownRoutePart);
    if (existingPattern !== null) {
        // If this route has a dynamic rewrite, mark the existing pattern.
        if (hasDynamicRewrite) {
            existingPattern.hasDynamicRewrite = true;
        }
        return existingPattern;
    }
    // Get or create the entry
    let entry;
    if (existingEntry !== null) {
        // Already have a fulfilled entry, use it directly. It's already in the
        // route cache map.
        entry = existingEntry;
    } else {
        // Create the entry and insert it into the route cache map.
        entry = (0, _cache.writeRouteIntoCache)(now, pathname, search, nextUrl, fullTree, metadataVaryPath, couldBeIntercepted, canonicalUrl, supportsPerSegmentPrefetching);
    }
    if (hasDynamicRewrite) {
        entry.hasDynamicRewrite = true;
    }
    // Store as pattern
    knownRoutePart.pattern = entry;
    return entry;
}
function matchKnownRoute(now, pathname, search) {
    const pathnameParts = (0, _cachekey.splitPathnameIntoParts)(pathname);
    const resolvedParams = new Map();
    const match = matchKnownRoutePart(now, knownRouteTreeRoot, pathnameParts, 0, resolvedParams);
    if (match === null) {
        return null;
    }
    const matchedPart = match.part;
    const pattern = match.pattern;
    // If the pattern could be intercepted, we can't safely use it for prediction.
    // Interception routes resolve to different route trees depending on the
    // referrer (the Next-Url header), which means the same URL can map to
    // different page components depending on where the navigation originated.
    // Since the known route tree only stores a single pattern per URL shape, we
    // can't distinguish between the intercepted and non-intercepted cases, so we
    // bail out to server resolution.
    //
    // TODO: We could store interception behavior in the known route tree itself
    // (e.g., which segments use interception markers and what they resolve to).
    // With enough information embedded in the trie, we could match interception
    // routes entirely on the client without a server round-trip.
    if (pattern.couldBeIntercepted) {
        return null;
    }
    // "Reify" the pattern: clone the template tree with concrete param values.
    // This substitutes resolved params (e.g., slug: "hello") into dynamic
    // segments and recomputes vary paths for correct segment cache keying.
    const acc = {
        metadataVaryPath: null
    };
    const reifiedTree = reifyRouteTree(pattern.tree, resolvedParams, search, null, acc);
    // The metadata tree is a flat page node without the intermediate layout
    // structure. Clone it with the updated metadata vary path collected during
    // the main tree traversal.
    const metadataVaryPath = acc.metadataVaryPath;
    if (metadataVaryPath === null) {
        // This shouldn't be reachable for a valid route tree.
        return null;
    }
    const reifiedMetadata = (0, _cache.createMetadataRouteTree)(metadataVaryPath);
    // Create a synthetic (predicted) entry and store it as the new pattern.
    //
    // Why replace the pattern? We intentionally update the pattern with this
    // synthetic entry so that if our prediction was wrong (server returns a
    // different pathname due to dynamic rewrite), the entry gets marked with
    // hasDynamicRewrite. Future predictions for this route will see the flag
    // and bail out to server resolution instead of making the same mistake.
    const syntheticEntry = {
        canonicalUrl: pathname + search,
        status: _cache.EntryStatus.Fulfilled,
        blockedTasks: null,
        tree: reifiedTree,
        metadata: reifiedMetadata,
        couldBeIntercepted: pattern.couldBeIntercepted,
        supportsPerSegmentPrefetching: pattern.supportsPerSegmentPrefetching,
        hasDynamicRewrite: false,
        renderedSearch: search,
        ref: null,
        size: pattern.size,
        staleAt: pattern.staleAt,
        version: pattern.version
    };
    matchedPart.pattern = syntheticEntry;
    return syntheticEntry;
}
/**
 * Recursively matches a URL against the known route tree.
 *
 * Matching priority (most specific first):
 * 1. Static children - exact path segment match
 * 2. Dynamic child - [param], [...param], [[...param]]
 * 3. Direct pattern - when no more URL parts remain
 *
 * Collects resolved param values in resolvedParams as it traverses.
 * Returns null if no match found (caller should fall back to server).
 */ function matchKnownRoutePart(now, part, pathnameParts, partIndex, resolvedParams) {
    const urlPart = partIndex < pathnameParts.length ? pathnameParts[partIndex] : null;
    // If staticChildren is null, we don't know what static routes exist at this
    // level. This happens in webpack dev mode where routes are compiled
    // on-demand. We can't safely match a dynamicChild because the URL part might
    // be a static sibling we haven't discovered yet. Example: We know
    // /blog/[slug] exists, but haven't compiled /blog/featured. A request for
    // /blog/featured would incorrectly match /blog/[slug].
    if (part.staticChildren === null) {
        // The only safe match is a direct pattern when no URL parts remain.
        if (urlPart === null) {
            const pattern = readPattern(now, part);
            if (pattern !== null && !pattern.hasDynamicRewrite) {
                return {
                    part,
                    pattern
                };
            }
        }
        return null;
    }
    // Static children take priority over dynamic. This ensures /blog/featured
    // matches its own route rather than /blog/[slug].
    if (urlPart !== null) {
        const staticChild = part.staticChildren.get(urlPart);
        if (staticChild !== undefined) {
            // Check if this is an "unknown" placeholder part. These are created when
            // we learn about static siblings (from the route tree's staticSiblings
            // field) but haven't prefetched them yet. We know the path exists but
            // don't know its structure, so we can't predict it.
            if (staticChild.pattern === null && staticChild.dynamicChild === null && staticChild.staticChildren === null) {
                // Bail out - server must resolve this route.
                return null;
            }
            const match = matchKnownRoutePart(now, staticChild, pathnameParts, partIndex + 1, resolvedParams);
            if (match !== null) {
                return match;
            }
            // Static child is a real node (not a placeholder) but its subtree
            // didn't match the remaining URL parts. This means the route exists
            // in the static subtree but hasn't been fully discovered yet. Do not
            // fall through to try the dynamic child — the static match is
            // authoritative. Bail out to server resolution.
            return null;
        }
    }
    // Try dynamic child. Skip it entirely if parallel route branches disagree
    // about the dynamic segment at this level — any pattern stored beneath it
    // was learned under a conflicting model.
    if (part.dynamicChild !== null && !part.hasConflictingDynamicChildren) {
        const dynamicPart = part.dynamicChild;
        const paramName = part.dynamicChildParamName;
        const paramType = part.dynamicChildParamType;
        const dynamicPattern = readPattern(now, dynamicPart);
        switch(paramType){
            case 'c':
                // Required catch-all [...param]: consumes 1+ URL parts
                if (dynamicPattern !== null && !dynamicPattern.hasDynamicRewrite && urlPart !== null) {
                    resolvedParams.set(paramName, pathnameParts.slice(partIndex).join('/'));
                    return {
                        part: dynamicPart,
                        pattern: dynamicPattern
                    };
                }
                break;
            case 'oc':
                {
                    // Optional catch-all [[...param]]: consumes 0+ URL parts
                    if (dynamicPattern !== null && !dynamicPattern.hasDynamicRewrite) {
                        if (urlPart !== null) {
                            resolvedParams.set(paramName, pathnameParts.slice(partIndex).join('/'));
                            return {
                                part: dynamicPart,
                                pattern: dynamicPattern
                            };
                        }
                        // urlPart is null - can match with zero parts, but a direct pattern
                        // (e.g., page.tsx alongside [[...param]]) takes precedence.
                        const directPattern = readPattern(now, part);
                        if (directPattern === null || directPattern.hasDynamicRewrite) {
                            resolvedParams.set(paramName, '');
                            return {
                                part: dynamicPart,
                                pattern: dynamicPattern
                            };
                        }
                    }
                    break;
                }
            case 'd':
                // Regular dynamic [param]: consumes exactly 1 URL part.
                // Unlike catch-all which terminates here, regular dynamic must
                // continue recursing to find the leaf pattern.
                if (urlPart !== null) {
                    resolvedParams.set(paramName, urlPart);
                    return matchKnownRoutePart(now, dynamicPart, pathnameParts, partIndex + 1, resolvedParams);
                }
                break;
            // Intercepted routes use relative path markers like (.), (..), (...)
            // Their behavior depends on navigation context (soft vs hard nav),
            // so we can't predict them client-side. Defer to server.
            case 'ci(..)(..)':
            case 'ci(.)':
            case 'ci(..)':
            case 'ci(...)':
            case 'di(..)(..)':
            case 'di(.)':
            case 'di(..)':
            case 'di(...)':
                return null;
            default:
                paramType;
        }
    }
    // No children matched. If we've consumed all URL parts, check for a direct
    // pattern at this node (the route terminates here).
    if (urlPart === null) {
        const pattern = readPattern(now, part);
        if (pattern !== null && !pattern.hasDynamicRewrite) {
            return {
                part,
                pattern
            };
        }
    }
    return null;
}
/**
 * "Reify" means to make concrete - we take an abstract pattern (the template
 * route tree) and produce a concrete instance with actual param values.
 *
 * This function clones a RouteTree, substituting dynamic segment values from
 * resolvedParams and computing new vary paths. The vary path encodes param
 * values so segment cache entries can be correctly keyed.
 *
 * Example: Pattern for /blog/[slug] with resolvedParams { slug: "hello" }
 * produces a tree where segment [slug] has cacheKey "hello".
 */ function reifyRouteTree(pattern, resolvedParams, search, parentPartialVaryPath, acc) {
    const originalSegment = pattern.segment;
    // This segment's param (if any) is a root param iff the segment is at or
    // above the root layout, which the server marks directly.
    const isRootParam = (pattern.prefetchHints & _approutertypes.PrefetchHint.IsRootLayoutOrAbove) !== 0;
    let newSegment = originalSegment;
    let partialVaryPath;
    if (typeof originalSegment !== 'string') {
        // Dynamic segment: compute new cache key and append to partial vary path
        const paramName = originalSegment[0];
        const paramType = originalSegment[2];
        const staticSiblings = originalSegment[3];
        const newValue = resolvedParams.get(paramName);
        if (newValue !== undefined) {
            // Catch-all values are already joined into a single string when they're
            // resolved in matchKnownRoutePart, so the value can be used directly.
            const newCacheKey = newValue;
            newSegment = [
                paramName,
                newCacheKey,
                paramType,
                staticSiblings
            ];
            partialVaryPath = (0, _varypath.appendLayoutVaryPath)(parentPartialVaryPath, newCacheKey, paramName, isRootParam);
        } else {
            // Param not found in resolvedParams - keep original and inherit partial
            // TODO: This should never happen. Bail out with null.
            partialVaryPath = parentPartialVaryPath;
        }
    } else {
        // Static segment: inherit partial vary path from parent
        partialVaryPath = parentPartialVaryPath;
    }
    // Recurse into children with the (possibly updated) partial vary path
    let newSlots = null;
    const patternSlots = pattern.slots;
    if (patternSlots !== null) {
        newSlots = new Map();
        for (const [key, childPattern] of patternSlots){
            newSlots.set(key, reifyRouteTree(childPattern, resolvedParams, search, partialVaryPath, acc));
        }
    }
    if (pattern.isPage) {
        // Page segment: finalize with search params
        const newVaryPath = (0, _varypath.finalizePageVaryPath)(pattern.requestKey, search, partialVaryPath);
        // Collect metadata vary path (first page wins, same as original algorithm)
        if (acc.metadataVaryPath === null) {
            acc.metadataVaryPath = (0, _varypath.finalizeMetadataVaryPath)(pattern.requestKey, search, partialVaryPath);
        }
        return {
            requestKey: pattern.requestKey,
            segment: newSegment,
            shellVaryPath: (0, _varypath.getShellSegmentVaryPath)(newVaryPath),
            refreshState: pattern.refreshState,
            varyPath: newVaryPath,
            isPage: true,
            slots: newSlots,
            prefetchHints: pattern.prefetchHints
        };
    } else {
        // Layout segment: finalize without search params
        const newVaryPath = (0, _varypath.finalizeLayoutVaryPath)(pattern.requestKey, partialVaryPath);
        return {
            requestKey: pattern.requestKey,
            segment: newSegment,
            shellVaryPath: (0, _varypath.getShellSegmentVaryPath)(newVaryPath),
            refreshState: pattern.refreshState,
            varyPath: newVaryPath,
            isPage: false,
            slots: newSlots,
            prefetchHints: pattern.prefetchHints
        };
    }
}
function resetKnownRoutes() {
    knownRouteTreeRoot = createEmptyPart();
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=optimistic-routes.js.map