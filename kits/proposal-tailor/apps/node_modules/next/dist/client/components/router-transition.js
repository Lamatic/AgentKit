"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    initializeRouterTransitionModules: null,
    startRouterTransition: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    initializeRouterTransitionModules: function() {
        return initializeRouterTransitionModules;
    },
    startRouterTransition: function() {
        return startRouterTransition;
    }
});
const _segment = require("../../shared/lib/segment");
const _computechangedpath = require("./router-reducer/compute-changed-path");
let instrumentationModules = [];
let nextTransitionId = 0;
function initializeRouterTransitionModules(modules) {
    instrumentationModules = modules.filter((module1)=>module1 != null);
}
function callHooks(invoke) {
    for (const hooks of instrumentationModules){
        try {
            invoke(hooks);
        } catch (error) {
            console.error('An instrumentation-client router transition hook failed', error);
        }
    }
}
function timestamp() {
    return performance.timeOrigin + performance.now();
}
function startRouterTransition(url, type, fromTree, prefetchIntent) {
    // Positive flag check so the instrumentation-only path is removed by DCE when disabled.
    if (process.env.__NEXT_INSTRUMENTATION_CLIENT_ROUTER_TRANSITION_EVENTS) {
        if (!instrumentationModules.some((hooks)=>typeof hooks.onRouterTransitionStart === 'function')) {
            return;
        }
        const id = `${Date.now().toString(36)}-${(++nextTransitionId).toString(36)}`;
        callHooks((hooks)=>hooks.onRouterTransitionStart?.(url, type, {
                id,
                timestamp: timestamp(),
                fromRoutes: getActiveRoutePaths(fromTree),
                prefetchIntent
            }));
    } else {
        callHooks((hooks)=>hooks.onRouterTransitionStart?.(url, type, null));
    }
}
function classifySegment(segment) {
    const sourceSegment = (0, _computechangedpath.segmentToSourcePagePathname)(segment);
    if (sourceSegment === 'page') {
        return {
            path: null,
            isPage: true
        };
    }
    if (sourceSegment === '' || sourceSegment === '(__SLOT__)' || (0, _segment.isGroupSegment)(sourceSegment)) {
        return {
            path: null,
            isPage: false
        };
    }
    if (sourceSegment === _segment.DEFAULT_SEGMENT_KEY) {
        return {
            path: 'default',
            isPage: false
        };
    }
    if (sourceSegment === _segment.NOT_FOUND_SEGMENT_KEY) {
        return {
            path: '_not-found',
            isPage: false
        };
    }
    return {
        path: sourceSegment,
        isPage: false
    };
}
function getActiveRoutePaths(tree) {
    const routes = [];
    function visit(node, segments, primary) {
        const segment = classifySegment(node[0]);
        const nextSegments = segment.path === null ? segments : [
            ...segments,
            segment.path
        ];
        const parallelRoutes = node[1];
        const keys = Object.keys(parallelRoutes);
        if (keys.length === 0 || segment.isPage) {
            routes.push({
                path: `/${nextSegments.join('/')}`,
                primary
            });
            return;
        }
        if (parallelRoutes.children !== undefined) {
            visit(parallelRoutes.children, nextSegments, primary);
        }
        for (const key of keys.sort()){
            if (key === 'children') {
                continue;
            }
            visit(parallelRoutes[key], [
                ...nextSegments,
                `@${key}`
            ], false);
        }
    }
    visit(tree, [], true);
    return routes.sort((a, b)=>{
        if (a.primary !== b.primary) {
            return a.primary ? -1 : 1;
        }
        return a.path.localeCompare(b.path);
    }).map((route)=>route.path);
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=router-transition.js.map