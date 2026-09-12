"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    isInterceptionAppRoute: null,
    isNormalizedAppRoute: null,
    parseAppRouteSegment: null,
    parseAppRouteWithSlots: null,
    parseNormalizedAppRoute: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    isInterceptionAppRoute: function() {
        return isInterceptionAppRoute;
    },
    isNormalizedAppRoute: function() {
        return isNormalizedAppRoute;
    },
    parseAppRouteSegment: function() {
        return parseAppRouteSegment;
    },
    parseAppRouteWithSlots: function() {
        return parseAppRouteWithSlots;
    },
    parseNormalizedAppRoute: function() {
        return parseNormalizedAppRoute;
    }
});
const _invarianterror = require("../../invariant-error");
const _getsegmentparam = require("../utils/get-segment-param");
const _interceptionroutes = require("../utils/interception-routes");
function normalizeEncodedDynamicPlaceholder(segment) {
    if (!/%5b|%5d/i.test(segment)) {
        return segment;
    }
    try {
        const decodedSegment = decodeURIComponent(segment);
        return (0, _getsegmentparam.getSegmentParam)(decodedSegment) ? decodedSegment : segment;
    } catch  {
        return segment;
    }
}
function parseAppRouteSegment(segment) {
    if (segment === '') {
        return null;
    }
    // Check if the segment starts with an interception marker
    const interceptionMarker = _interceptionroutes.INTERCEPTION_ROUTE_MARKERS.find((m)=>segment.startsWith(m));
    const param = (0, _getsegmentparam.getSegmentParam)(segment);
    if (param) {
        return {
            type: 'dynamic',
            name: segment,
            param,
            interceptionMarker
        };
    } else if (segment.startsWith('(') && segment.endsWith(')')) {
        return {
            type: 'route-group',
            name: segment,
            interceptionMarker
        };
    } else if (segment.startsWith('@')) {
        return {
            type: 'parallel-route',
            name: segment,
            interceptionMarker
        };
    } else {
        return {
            type: 'static',
            name: segment,
            interceptionMarker
        };
    }
}
function isNormalizedAppRoute(route) {
    return route.normalized;
}
function isInterceptionAppRoute(route) {
    return route.interceptionMarker !== undefined && route.interceptingRoute !== undefined && route.interceptedRoute !== undefined;
}
// Bitmask for which non-URL segment types to allow during parsing.
// By default, route groups and parallel routes are rejected because
// they should have been stripped by normalizeAppPath. These flags
// let callers opt in to allowing specific types.
const OnlyRoutableSegments = /*   */ 0;
const AllowParallelSegments = /*  */ 1;
const AllowGroupSegments = /*     */ 2;
function parseAppRouteImpl(pathname, allowedTypes) {
    const pathnameSegments = pathname.split('/').filter(Boolean);
    // Build segments array with static and dynamic segments
    const segments = [];
    // Parse if this is an interception route.
    let interceptionMarker;
    let interceptingRoute;
    let interceptedRoute;
    for (const segment of pathnameSegments){
        const normalizedSegment = normalizeEncodedDynamicPlaceholder(segment);
        // Parse the segment into an AppSegment.
        const appSegment = parseAppRouteSegment(normalizedSegment);
        if (!appSegment) {
            continue;
        }
        if (appSegment.type === 'route-group' && !(allowedTypes & AllowGroupSegments)) {
            throw Object.defineProperty(new _invarianterror.InvariantError(`${pathname} is being parsed as a normalized route, but it has a route group segment.`), "__NEXT_ERROR_CODE", {
                value: "E1151",
                enumerable: false,
                configurable: true
            });
        }
        if (appSegment.type === 'parallel-route' && !(allowedTypes & AllowParallelSegments)) {
            throw Object.defineProperty(new _invarianterror.InvariantError(`${pathname} is being parsed as a normalized route, but it has a parallel route segment.`), "__NEXT_ERROR_CODE", {
                value: "E1152",
                enumerable: false,
                configurable: true
            });
        }
        segments.push(appSegment);
        if (appSegment.interceptionMarker) {
            const parts = pathname.split(appSegment.interceptionMarker);
            if (parts.length !== 2) {
                throw Object.defineProperty(new Error(`Invalid interception route: ${pathname}`), "__NEXT_ERROR_CODE", {
                    value: "E924",
                    enumerable: false,
                    configurable: true
                });
            }
            interceptingRoute = parseAppRouteImpl(parts[0], allowedTypes);
            interceptedRoute = parseAppRouteImpl(parts[1], allowedTypes);
            interceptionMarker = appSegment.interceptionMarker;
        }
    }
    const dynamicSegments = segments.filter((segment)=>segment.type === 'dynamic');
    return {
        normalized: allowedTypes === OnlyRoutableSegments,
        pathname,
        segments,
        dynamicSegments,
        interceptionMarker,
        interceptingRoute,
        interceptedRoute
    };
}
function parseNormalizedAppRoute(pathname) {
    return parseAppRouteImpl(pathname, OnlyRoutableSegments);
}
function parseAppRouteWithSlots(pathname) {
    return parseAppRouteImpl(pathname, AllowParallelSegments);
}

//# sourceMappingURL=app.js.map