// The client router filter handles app routes that begin with a dynamic segment
// (e.g. `/[locale]/about`). Such routes have no static prefix to anchor the
// prefix-based dynamic filter on, so the build-time producer
// (`createClientRouterFilter`) stores them as a normalized pattern with dynamic
// segments replaced by the placeholder token below, and the pages router
// reconstructs matching candidates from the route it resolved a navigation to.
/**
 * A token that can never collide with a real path segment (dynamic segments are
 * always `[name]`, `[...name]`, or `[[...name]]`, and static segments never
 * equal `[]`). Shared with the builder's `normalizeRouteToFilterPattern`.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DYNAMIC_FILTER_PLACEHOLDER: null,
    hasDynamicFilterCandidate: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DYNAMIC_FILTER_PLACEHOLDER: function() {
        return DYNAMIC_FILTER_PLACEHOLDER;
    },
    hasDynamicFilterCandidate: function() {
        return hasDynamicFilterCandidate;
    }
});
const DYNAMIC_FILTER_PLACEHOLDER = '[]';
/**
 * Beyond this many dynamic segments the 2^n candidate set is skipped. Real
 * routes never approach this; the cap only guards against pathological input.
 */ const MAX_DYNAMIC_SEGMENTS = 8;
function hasDynamicFilterCandidate(routePattern, concretePathname, test) {
    const routeSegments = routePattern.split('/');
    const concreteSegments = concretePathname.split('/');
    const lastSegment = routeSegments[routeSegments.length - 1] ?? '';
    const hasCatchAll = lastSegment.startsWith('[...') || lastSegment.startsWith('[[...');
    // A non-catch-all route always has the same segment count as the path it
    // matched; a mismatch there means the inputs don't line up. A catch-all route
    // legitimately differs because its final param absorbs the remaining
    // segments.
    if (!hasCatchAll && routeSegments.length !== concreteSegments.length) {
        return false;
    }
    // Collect the concrete positions that are dynamic in the matched route: any
    // position without a static route segment (a dynamic param, or one absorbed
    // by the trailing catch-all).
    const dynamicIndices = [];
    for(let i = 1; i < concreteSegments.length; i++){
        // An empty concrete segment is not a real path segment (splitting `/`
        // yields a trailing `''`). A trailing optional catch-all matches it by
        // absorbing nothing, so it must not be treated as a dynamic position:
        // otherwise `/` would reconstruct the `/[]` candidate and spuriously match
        // a root-level dynamic app route such as `/[lang]`, which does not own `/`.
        if (concreteSegments[i] === '') {
            continue;
        }
        const routeSegment = routeSegments[i];
        const isStaticSegment = routeSegment !== undefined && !routeSegment.startsWith('[');
        if (!isStaticSegment) {
            dynamicIndices.push(i);
        }
    }
    if (dynamicIndices.length === 0 || dynamicIndices.length > MAX_DYNAMIC_SEGMENTS) {
        return false;
    }
    // Enumerate the keep-literal/placeholder combinations as a bitmask over those
    // positions (a set bit keeps the concrete value, an unset bit is a
    // placeholder). The all-literal combination is skipped: a fully concrete path
    // is a static route, already covered by the static filter and the early
    // prefix check, so it can never appear in the dynamic filter as a pattern.
    const allLiteral = (1 << dynamicIndices.length) - 1;
    for(let mask = 0; mask < allLiteral; mask++){
        const segments = concreteSegments.slice();
        for(let bit = 0; bit < dynamicIndices.length; bit++){
            if ((mask & 1 << bit) === 0) {
                segments[dynamicIndices[bit]] = DYNAMIC_FILTER_PLACEHOLDER;
            }
        }
        if (test(segments.join('/'))) {
            return true;
        }
    }
    return false;
}

//# sourceMappingURL=dynamic-filter-pattern.js.map