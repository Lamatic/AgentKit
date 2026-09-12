"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    config: null,
    default: null,
    handler: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    config: function() {
        return config;
    },
    // Re-export the handler (should be the default export).
    default: function() {
        return _default;
    },
    handler: function() {
        return handler;
    }
});
const _apiutils = require("../../server/api-utils");
const _routekind = require("../../server/route-kind");
const _modulecompiled = require("../../server/route-modules/pages-api/module.compiled");
const _helpers = require("./helpers");
const _VAR_USERLAND = /*#__PURE__*/ _interop_require_wildcard(require("VAR_USERLAND"));
const _tracer = require("../../server/lib/trace/tracer");
const _constants = require("../../server/lib/trace/constants");
const _requestmeta = require("../../server/request-meta");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const _default = (0, _helpers.hoist)(_VAR_USERLAND, 'default');
const config = (0, _helpers.hoist)(_VAR_USERLAND, 'config');
// Create and export the route module that will be consumed.
const routeModule = new _modulecompiled.PagesAPIRouteModule({
    definition: {
        kind: _routekind.RouteKind.PAGES_API,
        page: 'VAR_DEFINITION_PAGE',
        pathname: 'VAR_DEFINITION_PATHNAME',
        // The following aren't used in production.
        bundlePath: '',
        filename: ''
    },
    userland: _VAR_USERLAND,
    distDir: process.env.__NEXT_RELATIVE_DIST_DIR || '',
    relativeProjectDir: process.env.__NEXT_RELATIVE_PROJECT_DIR || ''
});
async function handler(req, res, ctx) {
    if (ctx.requestMeta) {
        (0, _requestmeta.setRequestMeta)(req, ctx.requestMeta);
    }
    if (routeModule.isDev) {
        (0, _requestmeta.addRequestMeta)(req, 'devRequestTimingInternalsEnd', process.hrtime.bigint());
    }
    let srcPage = 'VAR_DEFINITION_PAGE';
    // turbopack doesn't normalize `/index` in the page name
    // so we need to to process dynamic routes properly
    // TODO: fix turbopack providing differing value from webpack
    if (process.env.TURBOPACK) {
        srcPage = srcPage.replace(/\/index$/, '') || '/';
    }
    const prepareResult = await routeModule.prepare(req, res, {
        srcPage
    });
    if (!prepareResult) {
        res.statusCode = 400;
        res.end('Bad Request');
        ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
        return;
    }
    const { query, params, prerenderManifest, routerServerContext } = prepareResult;
    try {
        const method = req.method || 'GET';
        const tracer = (0, _tracer.getTracer)();
        const activeSpan = tracer.getActiveScopeSpan();
        const isWrappedByNextServer = Boolean(routerServerContext == null ? void 0 : routerServerContext.isWrappedByNextServer);
        const onRequestError = routeModule.instrumentationOnRequestError.bind(routeModule);
        let parentSpan;
        const invokeRouteModule = async (span)=>routeModule.render(req, res, {
                query: {
                    ...query,
                    ...params
                },
                params,
                allowedRevalidateHeaderKeys: process.env.__NEXT_ALLOWED_REVALIDATE_HEADERS,
                multiZoneDraftMode: Boolean(process.env.__NEXT_MULTI_ZONE_DRAFT_MODE),
                trustHostHeader: process.env.__NEXT_TRUST_HOST_HEADER,
                // TODO: get this from from runtime env so manifest
                // doesn't need to load
                previewProps: prerenderManifest.preview,
                propagateError: false,
                dev: routeModule.isDev,
                page: 'VAR_DEFINITION_PAGE',
                internalRevalidate: routerServerContext == null ? void 0 : routerServerContext.revalidate,
                onError: (...args)=>onRequestError(req, ...args)
            }).finally(()=>{
                if (!span) return;
                span.setAttributes({
                    'http.status_code': res.statusCode,
                    'next.rsc': false
                });
                if (res.statusCode && res.statusCode >= 500) {
                    // For 5xx status codes: SHOULD be set to 'Error' span status.
                    // x-ref: https://opentelemetry.io/docs/specs/semconv/http/http-spans/#status
                    span.setStatus({
                        code: _tracer.SpanStatusCode.ERROR
                    });
                    // For span status 'Error', SHOULD set 'error.type' attribute.
                    span.setAttribute('error.type', res.statusCode.toString());
                }
                const rootSpanAttributes = tracer.getRootSpanAttributes();
                // We were unable to get attributes, probably OTEL is not enabled
                if (!rootSpanAttributes) {
                    return;
                }
                if (rootSpanAttributes.get('next.span_type') !== _constants.BaseServerSpan.handleRequest) {
                    console.warn(`Unexpected root span type '${rootSpanAttributes.get('next.span_type')}'. Please report this Next.js issue https://github.com/vercel/next.js`);
                    return;
                }
                const route = rootSpanAttributes.get('next.route') || srcPage;
                const name = `${method} ${route}`;
                span.setAttributes({
                    'next.route': route,
                    'http.route': route,
                    'next.span_name': name
                });
                span.updateName(name);
                // Propagate http.route to the parent span if one exists (e.g.
                // a platform-created HTTP span in adapter deployments).
                if (parentSpan && parentSpan !== span) {
                    parentSpan.setAttribute('http.route', route);
                    parentSpan.updateName(name);
                }
            });
        // TODO: activeSpan code path is for when wrapped by
        // next-server can be removed when this is no longer used
        if (isWrappedByNextServer && activeSpan) {
            await invokeRouteModule(activeSpan);
        } else {
            parentSpan = tracer.getActiveScopeSpan();
            await tracer.withPropagatedContext(req.headers, ()=>tracer.trace(_constants.BaseServerSpan.handleRequest, {
                    spanName: `${method} ${srcPage}`,
                    kind: _tracer.SpanKind.SERVER,
                    attributes: {
                        'http.method': method,
                        'http.target': req.url
                    }
                }, invokeRouteModule), undefined, !isWrappedByNextServer);
        }
    } catch (err) {
        // we re-throw in dev to show the error overlay
        if (routeModule.isDev) {
            throw err;
        }
        // this is technically an invariant as error handling
        // should be done inside of api-resolver onError
        (0, _apiutils.sendError)(res, 500, 'Internal Server Error');
    } finally{
        // We don't allow any waitUntil work in pages API routes currently
        // so if callback is present return with resolved promise since no
        // pending work
        ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
    }
}

//# sourceMappingURL=pages-api.js.map