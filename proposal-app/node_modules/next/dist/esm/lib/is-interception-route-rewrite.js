import { NEXT_URL } from '../client/components/app-router-headers';
export function isInterceptionRouteRewrite(route) {
    var _route_has_, _route_has;
    // When we generate interception rewrites in the above implementation, we always do so with only a single `has` condition.
    return ((_route_has = route.has) == null ? void 0 : (_route_has_ = _route_has[0]) == null ? void 0 : _route_has_.key) === NEXT_URL;
}

//# sourceMappingURL=is-interception-route-rewrite.js.map