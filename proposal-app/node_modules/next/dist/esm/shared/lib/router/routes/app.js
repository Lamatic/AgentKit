import { InvariantError } from '../../invariant-error';
import { getSegmentParam } from '../utils/get-segment-param';
import { INTERCEPTION_ROUTE_MARKERS } from '../utils/interception-routes';
function normalizeEncodedDynamicPlaceholder(segment) {
    if (!/%5b|%5d/i.test(segment)) {
        return segment;
    }
    try {
        const decodedSegment = decodeURIComponent(segment);
        return getSegmentParam(decodedSegment) ? decodedSegment : segment;
    } catch  {
        return segment;
    }
}
export function parseAppRouteSegment(segment) {
    if (segment === '') {
        return null;
    }
    // Check if the segment starts with an interception marker
    const interceptionMarker = INTERCEPTION_ROUTE_MARKERS.find((m)=>segment.startsWith(m));
    const param = getSegmentParam(segment);
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
export function isNormalizedAppRoute(route) {
    return route.normalized;
}
export function isInterceptionAppRoute(route) {
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
            throw Object.defineProperty(new InvariantError(`${pathname} is being parsed as a normalized route, but it has a route group segment.`), "__NEXT_ERROR_CODE", {
                value: "E1151",
                enumerable: false,
                configurable: true
            });
        }
        if (appSegment.type === 'parallel-route' && !(allowedTypes & AllowParallelSegments)) {
            throw Object.defineProperty(new InvariantError(`${pathname} is being parsed as a normalized route, but it has a parallel route segment.`), "__NEXT_ERROR_CODE", {
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
/**
 * Parse an app route that has been fully normalized (no @slot or ()
 * group segments). Throws if either is present.
 */ export function parseNormalizedAppRoute(pathname) {
    return parseAppRouteImpl(pathname, OnlyRoutableSegments);
}
/**
 * Parse an app route that may contain @slot segments but not ()
 * group segments. Slot segments are preserved as parallel-route
 * type segments so callers can distinguish routes in different
 * parallel slots.
 */ export function parseAppRouteWithSlots(pathname) {
    return parseAppRouteImpl(pathname, AllowParallelSegments);
}

//# sourceMappingURL=app.js.map