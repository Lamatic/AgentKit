"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    PrefetchingMode: null,
    renderToHTMLOrFlight: null,
    runValidationInDevFromSnapshot: null,
    toValidationRenderContext: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    PrefetchingMode: function() {
        return PrefetchingMode;
    },
    renderToHTMLOrFlight: function() {
        return renderToHTMLOrFlight;
    },
    runValidationInDevFromSnapshot: function() {
        return runValidationInDevFromSnapshot;
    },
    toValidationRenderContext: function() {
        return toValidationRenderContext;
    }
});
const _jsxruntime = require("react/jsx-runtime");
const _approutertypes = require("../../shared/lib/app-router-types");
const _workasyncstorageexternal = require("../app-render/work-async-storage.external");
const _getpagefiles = require("../get-page-files");
const _entryconstants = require("../../shared/lib/entry-constants");
const _react = /*#__PURE__*/ _interop_require_wildcard(require("react"));
const _renderresult = /*#__PURE__*/ _interop_require_default(require("../render-result"));
const _streamops = require("./stream-ops");
const _instanttestbootstrap = require("./instant-test-bootstrap");
const _internalutils = require("../internal-utils");
const _approuterheaders = require("../../client/components/app-router-headers");
const _metadatacontext = require("../../lib/metadata/metadata-context");
const _requeststore = require("../async-storage/request-store");
const _isrscrequest = require("../lib/is-rsc-request");
const _workstore = require("../async-storage/work-store");
const _devvalidationevents = require("./dev-validation-events");
const _asynclocalstorage = require("./async-local-storage");
const _devvalidationworkerglobals = require("./dev-validation-worker-globals");
const _devvalidationworkersnapshot = require("./dev-validation-worker-snapshot");
const _httpaccessfallback = require("../../client/components/http-access-fallback/http-access-fallback");
const _redirect = require("../../client/components/redirect");
const _redirecterror = require("../../client/components/redirect-error");
const _implicittags = require("../lib/implicit-tags");
const _constants = require("../lib/trace/constants");
const _requestinsightsidentity = require("../lib/trace/request-insights-identity");
const _tracer = require("../lib/trace/tracer");
const _localspanrecorder = require("../lib/trace/local-span-recorder");
const _requestinsights = require("../lib/trace/request-insights");
const _flightrenderresult = require("./flight-render-result");
const _createerrorhandler = require("./create-error-handler");
const _getshortdynamicparamtype = require("./get-short-dynamic-param-type");
const _getsegmentparam = require("../../shared/lib/router/utils/get-segment-param");
const _getscriptnoncefromheader = require("./get-script-nonce-from-header");
const _parseandvalidateflightrouterstate = require("./parse-and-validate-flight-router-state");
const _createflightrouterstatefromloadertree = require("./create-flight-router-state-from-loader-tree");
const _actionhandler = require("./action-handler");
const _bailouttocsr = require("../../shared/lib/lazy-dynamic/bailout-to-csr");
const _log = require("../../build/output/log");
const _requestcookies = require("../web/spec-extension/adapters/request-cookies");
const _headers = require("../web/spec-extension/adapters/headers");
const _serverinsertedhtml = require("./server-inserted-html");
const _requiredscripts = require("./required-scripts");
const _addpathprefix = require("../../shared/lib/router/utils/add-path-prefix");
const _makegetserverinsertedhtml = require("./make-get-server-inserted-html");
const _walktreewithflightrouterstate = require("./walk-tree-with-flight-router-state");
const _createcomponenttree = require("./create-component-tree");
const _getassetquerystring = require("./get-asset-query-string");
const _manifestssingleton = require("./manifests-singleton");
const _postponedstate = require("./postponed-state");
const _hooksservercontext = require("../../client/components/hooks-server-context");
const _useflightresponse = require("./use-flight-response");
const _staticgenerationbailout = require("../../client/components/static-generation-bailout");
const _formatservererror = require("../../lib/format-server-error");
const _errortelemetryutils = require("../../lib/error-telemetry-utils");
const _dynamicrendering = require("./dynamic-rendering");
const _blockingroutemessages = require("./blocking-route-messages");
const _clientcomponentrendererlogger = require("../client-component-renderer-logger");
const _helpers = require("../base-http/helpers");
const _waitforresponse = require("./wait-for-response");
const _devvalidationscheduler = require("./dev-validation-scheduler");
const _nextrequest = require("../web/spec-extension/adapters/next-request");
const _parserelativeurl = require("../../shared/lib/router/utils/parse-relative-url");
const _approuter = /*#__PURE__*/ _interop_require_default(require("../../client/components/app-router"));
const _serveractionrequestmeta = require("../lib/server-action-request-meta");
const _createinitialrouterstate = require("../../client/components/router-reducer/create-initial-router-state");
const _approuterinstance = require("../../client/components/app-router-instance");
const _utils = require("../instrumentation/utils");
const _segment = require("../../shared/lib/segment");
const _fallbackparams = require("../request/fallback-params");
const _apprenderprerenderutils = require("./app-render-prerender-utils");
const _prospectiverenderutils = require("./prospective-render-utils");
const _apprenderrenderutils = require("./app-render-render-utils");
const _scheduler = require("../../lib/scheduler");
const _workunitasyncstorageexternal = require("./work-unit-async-storage.external");
const _consoleasyncstorageexternal = require("./console-async-storage.external");
const _cachesignal = require("./cache-signal");
const _varyparams = require("./vary-params");
const _utils1 = require("../lib/trace/utils");
const _invarianterror = require("../../shared/lib/invariant-error");
const _staletime = require("./stale-time");
const _constants1 = require("../../lib/constants");
const _createcomponentstylesandscripts = require("./create-component-styles-and-scripts");
const _parseloadertree = require("../../shared/lib/router/utils/parse-loader-tree");
const _resumedatacache = require("../resume-data-cache/resume-data-cache");
const _iserror = /*#__PURE__*/ _interop_require_default(require("../../lib/is-error"));
const _createserverinsertedmetadata = require("./metadata-insertion/create-server-inserted-metadata");
const _serverutils = require("../server-utils");
const _revalidationutils = require("../revalidation-utils");
const _trackmoduleloadingexternal = require("./module-loading/track-module-loading.external");
const _reactlargeshellerror = require("./react-large-shell-error");
const _segmentexplorerpath = require("./segment-explorer-path");
const _requestmeta = require("../request-meta");
const _getdynamicparam = require("../../shared/lib/router/utils/get-dynamic-param");
const _imageconfigcontextsharedruntime = require("../../shared/lib/image-config-context.shared-runtime");
const _imageconfig = require("../../shared/lib/image-config");
const _stagedrendering = require("./staged-rendering");
const _instantconfig = require("./instant-validation/instant-config");
const _warnonce = require("../../shared/lib/utils/warn-once");
const _debugchannelserver = require("./debug-channel-server");
const _streamutils = require("./instant-validation/stream-utils");
const _boundarytracking = require("./instant-validation/boundary-tracking");
const _cookies = require("../web/spec-extension/cookies");
const _instantvalidationerror = require("./instant-validation/instant-validation-error");
const _promisewithresolvers = require("../../shared/lib/promise-with-resolvers");
const _dynamicrenderingutils = require("../dynamic-rendering-utils");
const _paramsutils = require("../lib/params-utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
function maybeAppendBuildIdToRSCPayload(ctx, payload) {
    if (!ctx.sharedContext.deploymentId) {
        // When using the build id, we need to initialize the id on initial page load, so a build id
        // header wouldn't be enough.
        payload.b = ctx.sharedContext.buildId;
    }
    return payload;
}
const flightDataPathHeadKey = 'h';
const getFlightViewportKey = (requestId)=>requestId + 'v';
const getFlightMetadataKey = (requestId)=>requestId + 'm';
const filterStackFrame = process.env.NODE_ENV !== 'production' ? require('../lib/source-maps').filterStackFrameDEV : undefined;
function parseRequestHeaders(headers, options) {
    const isRSCRequest = (0, _isrscrequest.isRSCRequestHeader)(headers[_approuterheaders.RSC_HEADER]);
    // runtime prefetch requests are *not* treated as prefetch requests
    // (TODO: this is confusing, we should refactor this to express this better)
    const isPrefetchRequest = isRSCRequest && headers[_approuterheaders.NEXT_ROUTER_PREFETCH_HEADER] === '1';
    const isAppShellPrefetchRequest = isRSCRequest && headers[_approuterheaders.NEXT_ROUTER_PREFETCH_HEADER] === '3';
    // App Shell prefetches are a subtype of runtime prefetch — same code path,
    // but with less resolved content (omitting link data)
    const isRuntimePrefetchRequest = isRSCRequest && (headers[_approuterheaders.NEXT_ROUTER_PREFETCH_HEADER] === '2' || isAppShellPrefetchRequest);
    const isHmrRefresh = headers[_approuterheaders.NEXT_HMR_REFRESH_HEADER] !== undefined;
    const shouldProvideFlightRouterState = isRSCRequest && (!isPrefetchRequest || !options.isRoutePPREnabled);
    const flightRouterState = shouldProvideFlightRouterState ? (0, _parseandvalidateflightrouterstate.parseAndValidateFlightRouterState)(headers[_approuterheaders.NEXT_ROUTER_STATE_TREE_HEADER]) : undefined;
    // Checks if this is a prefetch of the Route Tree by the Segment Cache
    const isRouteTreePrefetchRequest = isRSCRequest && headers[_approuterheaders.NEXT_ROUTER_SEGMENT_PREFETCH_HEADER] === '/_tree';
    const csp = headers['content-security-policy'] || headers['content-security-policy-report-only'];
    const nonce = typeof csp === 'string' ? (0, _getscriptnoncefromheader.getScriptNonceFromHeader)(csp) : undefined;
    const previouslyRevalidatedTags = (0, _serverutils.getPreviouslyRevalidatedTags)(headers, options.previewModeId);
    let requestId;
    let htmlRequestId;
    if (process.env.__NEXT_DEV_SERVER) {
        // The request IDs are only used for the dev server to send debug
        // information to the matching client (identified by the HTML request ID
        // that was sent to the client with the HTML document) for the current
        // request (identified by the request ID, as defined by the client).
        requestId = typeof headers[_approuterheaders.NEXT_REQUEST_ID_HEADER] === 'string' ? headers[_approuterheaders.NEXT_REQUEST_ID_HEADER] : undefined;
        htmlRequestId = typeof headers[_approuterheaders.NEXT_HTML_REQUEST_ID_HEADER] === 'string' ? headers[_approuterheaders.NEXT_HTML_REQUEST_ID_HEADER] : undefined;
    }
    return {
        flightRouterState,
        isPrefetchRequest,
        isRuntimePrefetchRequest,
        isAppShellPrefetchRequest,
        isRouteTreePrefetchRequest,
        isHmrRefresh,
        isRSCRequest,
        nonce,
        previouslyRevalidatedTags,
        requestId,
        htmlRequestId
    };
}
/**
 * Walks the loader tree to find the minimum `unstable_dynamicStaleTime` exported by
 * any page module. Returns null if no page exports the config.
 *
 * This only reads static exports from page modules — it does not render any
 * server components, so it's cheap to call.
 *
 * TODO: Move this to the prefetch hints file so we don't have to walk the
 * tree on every render.
 */ async function getDynamicStaleTime(tree) {
    const { page, parallelRoutes } = (0, _parseloadertree.parseLoaderTree)(tree);
    let result = null;
    // Only pages (not layouts) can export unstable_dynamicStaleTime.
    if (typeof page !== 'undefined') {
        const pageMod = await page[0]();
        if (pageMod && typeof pageMod.unstable_dynamicStaleTime === 'number') {
            const value1 = pageMod.unstable_dynamicStaleTime;
            result = result !== null ? Math.min(result, value1) : value1;
        }
    }
    const childPromises = [];
    for(const parallelRouteKey in parallelRoutes){
        childPromises.push(getDynamicStaleTime(parallelRoutes[parallelRouteKey]));
    }
    const childResults = await Promise.all(childPromises);
    for (const childResult of childResults){
        if (childResult !== null) {
            result = result !== null ? Math.min(result, childResult) : childResult;
        }
    }
    return result;
}
function createNotFoundLoaderTree(loaderTree) {
    const components = loaderTree[2];
    const hasGlobalNotFound = !!components['global-not-found'];
    const notFoundTreeComponents = hasGlobalNotFound ? {
        layout: components['global-not-found'],
        page: [
            ()=>null,
            'next/dist/client/components/builtin/empty-stub'
        ]
    } : {
        page: components['not-found']
    };
    return [
        '',
        {
            children: [
                _segment.PAGE_SEGMENT_KEY,
                {},
                notFoundTreeComponents,
                null
            ]
        },
        // Always include global-error so that getGlobalErrorStyles can access it.
        // When global-not-found is present, use full components.
        // Otherwise, only include global-error module.
        hasGlobalNotFound ? components : {
            'global-error': components['global-error']
        },
        null
    ];
}
/**
 * Returns a function that parses the dynamic segment and return the associated value.
 */ function makeGetDynamicParamFromSegment(interpolatedParams, fallbackRouteParams, optimisticRouting) {
    return function getDynamicParamFromSegment(loaderTree) {
        const [segment, , , staticSiblings] = loaderTree;
        const segmentParam = (0, _getsegmentparam.getSegmentParam)(segment);
        if (!segmentParam) {
            return null;
        }
        const segmentKey = segmentParam.paramName;
        const dynamicParamType = _getshortdynamicparamtype.dynamicParamTypes[segmentParam.paramType];
        // Static siblings are only included when optimistic routing is enabled
        const siblings = optimisticRouting ? staticSiblings : null;
        return (0, _getdynamicparam.getDynamicParam)(interpolatedParams, segmentKey, dynamicParamType, fallbackRouteParams, siblings);
    };
}
function NonIndex({ createElement, pagePath, statusCode, isPossibleServerAction }) {
    const is404Page = pagePath === '/404';
    const isInvalidStatusCode = typeof statusCode === 'number' && statusCode > 400;
    // Only render noindex for page request, skip for server actions
    // TODO: is this correct if `isPossibleServerAction` is a false positive?
    if (!isPossibleServerAction && (is404Page || isInvalidStatusCode)) {
        return createElement('meta', {
            name: 'robots',
            content: 'noindex'
        });
    }
    return null;
}
/**
 * This is used by server actions & client-side navigations to generate RSC data from a client-side request.
 * This function is only called on "dynamic" requests (ie, there wasn't already a static response).
 * It uses request headers (namely `next-router-state-tree`) to determine where to start rendering.
 */ async function generateDynamicRSCPayload(ctx, options) {
    // Flight data that is going to be passed to the browser.
    // Currently a single item array but in the future multiple patches might be combined in a single request.
    // We initialize `flightData` to an empty string because the client router knows how to tolerate
    // it (treating it as an MPA navigation). The only time this function wouldn't generate flight data
    // is for server actions, if the server action handler instructs this function to skip it. When the server
    // action reducer sees a falsy value, it'll simply resolve the action with no data.
    let flightData = '';
    const { componentMod: { routeModule: { userland: { loaderTree } }, createElement, createMetadataComponents, Fragment }, query, requestId, flightRouterState, workStore, url } = ctx;
    const serveStreamingMetadata = !!ctx.renderOpts.serveStreamingMetadata;
    if (!(options == null ? void 0 : options.skipPageRendering)) {
        var _ctx_renderOpts_prefetchHints;
        const preloadCallbacks = [];
        const requestStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
        // If we're performing instant validation, we need to render the whole tree,
        // without skipping shared layouts.
        const needsFullTree = process.env.__NEXT_DEV_SERVER && ctx.renderOpts.cacheComponents && !((requestStore == null ? void 0 : requestStore.type) === 'request' && isBypassingCachesInDev(requestStore, workStore)) && !(options == null ? void 0 : options.actionResult) && // Only for navigations
        await (0, _instantconfig.anySegmentNeedsInstantValidationInDev)(loaderTree);
        const { Viewport, Metadata, MetadataOutlet } = createMetadataComponents({
            tree: loaderTree,
            parsedQuery: query,
            pathname: url.pathname,
            metadataContext: (0, _metadatacontext.createMetadataContext)(ctx.renderOpts),
            interpolatedParams: ctx.interpolatedParams,
            serveStreamingMetadata
        });
        const rscHead = createElement(Fragment, {
            key: flightDataPathHeadKey
        }, createElement(NonIndex, {
            createElement,
            pagePath: ctx.pagePath,
            statusCode: ctx.res.statusCode,
            isPossibleServerAction: ctx.isPossibleServerAction
        }), createElement(Viewport, {
            key: getFlightViewportKey(requestId)
        }), createElement(Metadata, {
            key: getFlightMetadataKey(requestId)
        }));
        flightData = (needsFullTree ? await (0, _walktreewithflightrouterstate.createFullTreeFlightDataForNavigation)({
            ctx,
            loaderTree,
            rscHead,
            injectedCSS: new Set(),
            injectedJS: new Set(),
            injectedFontPreloadTags: new Set(),
            preloadCallbacks,
            MetadataOutlet
        }) : await (0, _walktreewithflightrouterstate.walkTreeWithFlightRouterState)({
            ctx,
            loaderTreeToFilter: loaderTree,
            parentParams: {},
            flightRouterState,
            rscHead,
            injectedCSS: new Set(),
            injectedJS: new Set(),
            injectedFontPreloadTags: new Set(),
            rootLayoutIncluded: false,
            preloadCallbacks,
            MetadataOutlet,
            hintTree: ((_ctx_renderOpts_prefetchHints = ctx.renderOpts.prefetchHints) == null ? void 0 : _ctx_renderOpts_prefetchHints[ctx.pagePath]) ?? null
        })).map((path)=>path.slice(1)) // remove the '' (root) segment
        ;
    }
    // In dev, the Vary header may not reliably reflect whether a route can
    // be intercepted, because interception routes are compiled on demand.
    // Default to true so the client doesn't cache a stale Fallback entry.
    const varyHeader = ctx.res.getHeader('vary');
    const couldBeIntercepted = !!process.env.__NEXT_DEV_SERVER || typeof varyHeader === 'string' && varyHeader.includes(_approuterheaders.NEXT_URL);
    // If we have an action result, then this is a server action response.
    // We can rely on this because `ActionResult` will always be a promise, even if
    // the result is falsey.
    if (options == null ? void 0 : options.actionResult) {
        return maybeAppendBuildIdToRSCPayload(ctx, {
            a: options.actionResult,
            f: flightData,
            q: getRenderedSearch(query),
            i: !!couldBeIntercepted
        });
    }
    // Otherwise, it's a regular RSC response.
    const baseResponse = maybeAppendBuildIdToRSCPayload(ctx, {
        f: flightData,
        q: getRenderedSearch(query),
        i: !!couldBeIntercepted,
        S: workStore.isStaticGeneration,
        h: (0, _varyparams.getMetadataVaryParamsAccumulator)(),
        r: (0, _varyparams.getRootParamsVaryParamsAccumulator)() ?? undefined
    });
    if ((options == null ? void 0 : options.staleTimeIterable) !== undefined) {
        baseResponse.s = options.staleTimeIterable;
    }
    if ((options == null ? void 0 : options.staticStageByteLengthPromise) !== undefined) {
        baseResponse.l = options.staticStageByteLengthPromise;
    }
    if ((options == null ? void 0 : options.shellByteLengthPromise) !== undefined) {
        baseResponse.a = options.shellByteLengthPromise;
    }
    if ((options == null ? void 0 : options.shellUsedSessionDataPromise) !== undefined) {
        baseResponse.u = options.shellUsedSessionDataPromise;
    }
    if ((options == null ? void 0 : options.runtimePrefetchStream) !== undefined) {
        baseResponse.p = options.runtimePrefetchStream;
    }
    // Include the per-page dynamic stale time from unstable_dynamicStaleTime, but only
    // for dynamic renders (not prerenders/static generation). The client treats
    // its presence as authoritative.
    // TODO: Move this to the prefetch hints file so we don't have to walk the
    // tree on every render.
    if (!workStore.isStaticGeneration) {
        const dynamicStaleTime = await getDynamicStaleTime(ctx.componentMod.routeModule.userland.loaderTree);
        if (dynamicStaleTime !== null) {
            baseResponse.d = dynamicStaleTime;
        }
    }
    return baseResponse;
}
function createErrorContext(ctx, renderSource) {
    return {
        routerKind: 'App Router',
        routePath: ctx.pagePath,
        // TODO: is this correct if `isPossibleServerAction` is a false positive?
        routeType: ctx.isPossibleServerAction ? 'action' : 'render',
        renderSource,
        revalidateReason: (0, _utils.getRevalidateReason)(ctx.workStore)
    };
}
/**
 * Produces a RenderResult containing the Flight data for the given request. See
 * `generateDynamicRSCPayload` for information on the contents of the render result.
 */ async function generateDynamicFlightRenderResult(req, ctx, requestStore, options) {
    const { htmlRequestId, renderOpts, requestId, workStore } = ctx;
    const { onInstrumentationRequestError, setReactDebugChannel, isBuildTimePrerendering = false } = renderOpts;
    function onFlightDataRenderError(err, silenceLog) {
        return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, createErrorContext(ctx, 'react-server-components-payload'), silenceLog);
    }
    const onError = (0, _createerrorhandler.createReactServerErrorHandler)(process.env.NODE_ENV === 'development', isBuildTimePrerendering, workStore.reactServerErrorsByDigest, onFlightDataRenderError);
    // With Server Components HMR cancellation enabled, a superseded HMR refresh
    // aborts its own client fetch, which closes this response. We use that
    // response-close to abort the discarded render. This is the
    // non-Cache-Components dev RSC path; unlike the Cache Components staged path
    // it has no detached validation, so the render is the only work to cancel.
    const requestAbortSignal = process.env.__NEXT_DEV_SERVER && renderOpts.experimental.serverComponentsHmrCancellation === true && requestStore.isHmrRefresh === true && (0, _helpers.isNodeNextResponse)(ctx.res) ? (0, _nextrequest.signalFromNodeResponse)(ctx.res.originalResponse) : undefined;
    if (process.env.__NEXT_USE_NODE_STREAMS) {
        const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createNodeDebugChannel)();
        if (debugChannel) {
            setReactDebugChannel(debugChannel.clientSide, htmlRequestId, requestId);
        }
        const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
        const rscPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, generateDynamicRSCPayload, ctx, options);
        const flightStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ctx.componentMod, rscPayload, clientModules, {
            onError,
            temporaryReferences: options == null ? void 0 : options.temporaryReferences,
            filterStackFrame,
            debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide,
            signal: requestAbortSignal
        });
        return new _flightrenderresult.FlightRenderResult(flightStream, {
            fetchMetrics: workStore.fetchMetrics
        }, options == null ? void 0 : options.waitUntil);
    } else {
        const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createWebDebugChannel)();
        if (debugChannel) {
            setReactDebugChannel(debugChannel.clientSide, htmlRequestId, requestId);
        }
        const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
        const rscPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, generateDynamicRSCPayload, ctx, options);
        const flightStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToWebFlightStream, ctx.componentMod, rscPayload, clientModules, {
            onError,
            temporaryReferences: options == null ? void 0 : options.temporaryReferences,
            filterStackFrame,
            debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide,
            signal: requestAbortSignal
        });
        return new _flightrenderresult.FlightRenderResult(flightStream, {
            fetchMetrics: workStore.fetchMetrics
        }, options == null ? void 0 : options.waitUntil);
    }
}
/**
 * Production-only staged dynamic flight render for cache components (Node.js
 * streams). Uses staged rendering to separate static (RDC-backed) from
 * runtime/dynamic content.
 */ async function generateStagedDynamicFlightRenderResultNode(req, ctx, requestStore) {
    const { componentMod, workStore, renderOpts } = ctx;
    const { routeModule } = componentMod;
    const { loaderTree } = routeModule.userland;
    const { onInstrumentationRequestError, experimental } = renderOpts;
    function onFlightDataRenderError(err, silenceLog) {
        return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, createErrorContext(ctx, 'react-server-components-payload'), silenceLog);
    }
    const onError = (0, _createerrorhandler.createReactServerErrorHandler)(false, false, workStore.reactServerErrorsByDigest, onFlightDataRenderError);
    const selectStaleTime = (0, _staletime.createSelectStaleTime)(experimental);
    const staleTimeIterable = new _staletime.StaleTimeIterable();
    const stageController = new _stagedrendering.StagedRenderingController({
        abortSignal: null,
        abandonController: null,
        // TODO(cached-navs): this assumes that we checked during build that there's no sync IO.
        // but it can happen e.g. after a revalidation or conditionally for a param that wasn't prerendered.
        // we should change this to track sync IO, log an error and advance to dynamic.
        syncIO: _stagedrendering.SyncIOMode.Untracked,
        finalStage: null
    });
    // Initialize stale time tracking on the request store.
    requestStore.stale = _constants1.INFINITE_CACHE;
    requestStore.stagedRendering = stageController;
    requestStore.varyParamsAccumulator = (0, _varyparams.createResponseVaryParamsAccumulator)();
    requestStore.asyncApiPromises = createAsyncApiPromises(stageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
    (0, _staletime.trackStaleTime)(requestStore, staleTimeIterable, selectStaleTime);
    const shellByteLengthDeferred = (0, _promisewithresolvers.createPromiseWithResolvers)();
    const staticStageByteLengthDeferred = (0, _promisewithresolvers.createPromiseWithResolvers)();
    let runtimePrefetchStream;
    // Check if this route should runtime-cache its navigation. This happens when
    // Partial Prefetching is enabled for the route, either per segment (a
    // `prefetch` of 'partial' or 'unstable_eager') or globally (the
    // `partialPrefetching` config). If so, we piggyback on the dynamic render to
    // fill caches and then spawn a final runtime prerender whose result stream
    // is embedded in the RSC payload. This is gated because it adds extra server
    // processing and increases the response payload size.
    if (Boolean(renderOpts.partialPrefetching) || await (0, _instantconfig.anySegmentHasPartialPrefetchingEnabled)(loaderTree)) {
        // Create a mutable cache that gets filled during the dynamic render.
        const prerenderResumeDataCache = (0, _resumedatacache.createPrerenderResumeDataCache)();
        requestStore.resumeDataCache = prerenderResumeDataCache;
        const cacheSignal = new _cachesignal.CacheSignal();
        (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
        requestStore.cacheSignal = cacheSignal;
        // Create a deferred stream for the runtime prefetch result. Its readable
        // side goes into the RSC payload (Flight serializes it lazily). The
        // writable side receives the runtime prerender result once the dynamic
        // render has filled all caches.
        const runtimePrefetchTransform = new TransformStream();
        runtimePrefetchStream = runtimePrefetchTransform.readable;
        // Wait for the dynamic render to fill caches, then run the final runtime
        // prerender (fire-and-forget — does not block the response).
        void cacheSignal.cacheReady().then(()=>spawnRuntimePrefetchWithFilledCaches(runtimePrefetchTransform.writable, ctx, prerenderResumeDataCache, requestStore, onError));
    }
    const rscPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, generateDynamicRSCPayload, ctx, {
        staleTimeIterable,
        staticStageByteLengthPromise: staticStageByteLengthDeferred.promise,
        shellByteLengthPromise: shellByteLengthDeferred.promise,
        runtimePrefetchStream
    });
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    const flightStream = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        const sourceStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ctx.componentMod, rscPayload, clientModules, {
            onError,
            filterStackFrame
        });
        const replayable = new _apprenderprerenderutils.ReplayableNodeStream(sourceStream);
        const dynamicStream = replayable.createReplayStream();
        const staticStream = replayable.createReplayStream();
        void countShellAndStaticStageBytes(staticStream, stageController).then((byteLengths)=>{
            staticStageByteLengthDeferred.resolve(byteLengths[_stagedrendering.RenderStage.Static]);
            shellByteLengthDeferred.resolve(byteLengths[_stagedrendering.RenderStage.ShellStatic]);
        });
        return dynamicStream;
    }, ()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.Static);
    }, ()=>{
        // This is a separate task that doesn't advance a stage. It forces
        // draining the immediate queue so that the stale time iterable and vary
        // params accumulators are flushed before we advance to the dynamic stage.
        staleTimeIterable.close();
        if (requestStore.varyParamsAccumulator) {
            (0, _varyparams.finishAccumulatingVaryParams)(requestStore.varyParamsAccumulator);
        }
    }, ()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.Dynamic);
    });
    return new _flightrenderresult.FlightRenderResult(flightStream, {
        fetchMetrics: workStore.fetchMetrics
    });
}
/**
 * Runs a final runtime prerender using the provided (already filled) cache and
 * pipes its output into the provided writable stream. The caller is responsible
 * for waiting until caches are warm before calling this function.
 */ async function spawnRuntimePrefetchWithFilledCaches(writable, ctx, prerenderResumeDataCache, requestStore, onError) {
    try {
        const { componentMod, getDynamicParamFromSegment } = ctx;
        const { loaderTree } = componentMod.routeModule.userland;
        const rootParams = (0, _createcomponenttree.getRootParams)(loaderTree, getDynamicParamFromSegment);
        const staleTimeIterable = new _staletime.StaleTimeIterable();
        // We want to be able to rewind the result to a session shell.
        const mode = {
            type: 'rewindable-session-shell',
            shellUsedSessionDataDeferred: (0, _promisewithresolvers.createPromiseWithResolvers)(),
            shellByteLengthDeferred: (0, _promisewithresolvers.createPromiseWithResolvers)()
        };
        const { result } = await finalRuntimeServerPrerender(mode, ctx, generateDynamicRSCPayload.bind(null, ctx, {
            staleTimeIterable,
            shellByteLengthPromise: mode.type === 'rewindable-session-shell' ? mode.shellByteLengthDeferred.promise : undefined,
            shellUsedSessionDataPromise: mode.shellUsedSessionDataDeferred.promise
        }), prerenderResumeDataCache, rootParams, requestStore.headers, requestStore.cookies, requestStore.draftMode, onError, staleTimeIterable, // This path is only reached on the production Cache Components + Cached
        // Navigations renders (the staged Flight response and the HTML hydration
        // payload), which set up no React debug channel.
        undefined);
        await result.prelude.pipeTo(writable);
    } catch  {
        // Runtime prerender failed. Close the stream gracefully — the navigation
        // still works, we just won't get cached runtime data.
        try {
            await writable.close();
        } catch  {
        // Writable may already be closed/errored.
        }
    }
}
async function stagedRenderWithoutCachesInDevNode(ctx, requestStore, getPayload, options) {
    // We're rendering while bypassing caches,
    // so we have no hope of showing a useful runtime stage.
    // But we still want things like `params` to show up in devtools correctly,
    // which relies on mechanisms we've set up for staged rendering,
    // so we do a 2-task version (Static -> Dynamic) instead.
    // We aren't filling caches so we don't need to abort this render, it'll
    // stream in a single pass
    const stageController = new _stagedrendering.StagedRenderingController({
        abortSignal: null,
        abandonController: null,
        syncIO: _stagedrendering.SyncIOMode.Untracked,
        finalStage: null
    });
    const environmentName = ()=>{
        const currentStage = stageController.currentStage;
        return getEnvironmentNameForStageWithoutCaches(currentStage);
    };
    requestStore.stagedRendering = stageController;
    requestStore.asyncApiPromises = createAsyncApiPromises(stageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    const rscPayload = await getPayload(requestStore);
    return await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        return _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ctx.componentMod, rscPayload, clientModules, {
            ...options,
            environmentName
        });
    }, ()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.Static);
    }, ()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.Dynamic);
    });
}
function getEnvironmentNameForStageWithoutCaches(stage) {
    switch(stage){
        case _stagedrendering.RenderStage.Before:
        case _stagedrendering.RenderStage.ShellStatic:
        case _stagedrendering.RenderStage.Static:
            return 'Prerender';
        case _stagedrendering.RenderStage.ShellRuntime:
        case _stagedrendering.RenderStage.Runtime:
        case _stagedrendering.RenderStage.Dynamic:
        case _stagedrendering.RenderStage.Abandoned:
            return 'Server';
        default:
            stage;
            throw Object.defineProperty(new _invarianterror.InvariantError(`Invalid render stage: ${stage}`), "__NEXT_ERROR_CODE", {
                value: "E881",
                enumerable: false,
                configurable: true
            });
    }
}
/**
 * Fork of `generateDynamicFlightRenderResult` that renders using `renderWithRestartOnCacheMissInDev`
 * to ensure correct separation of environments Prerender/Server (for use in Cache Components)
 */ async function generateDynamicFlightRenderResultWithStagesInDev(req, ctx, initialRequestStore, createRequestStore, fallbackParams) {
    const { htmlRequestId, renderOpts, requestId, workStore, componentMod: { createElement, routeModule: { userland: { loaderTree } } }, url } = ctx;
    const { onInstrumentationRequestError, setReactDebugChannel, setCacheStatus, isBuildTimePrerendering = false } = renderOpts;
    let didErrorObservably = false;
    function onFlightDataRenderError(err, silenceLog) {
        didErrorObservably = true;
        return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, createErrorContext(ctx, 'react-server-components-payload'), silenceLog);
    }
    const onError = (0, _createerrorhandler.createReactServerErrorHandler)(process.env.NODE_ENV === 'development', isBuildTimePrerendering, workStore.reactServerErrorsByDigest, onFlightDataRenderError);
    // We validate RSC requests for HMR refreshes and client navigations when
    // instant configs exist, since we render all the layouts necessary to perform
    // the validation in those cases.
    const shouldValidate = !ctx.isPrefetch && !isBypassingCachesInDev(initialRequestStore, workStore) && (initialRequestStore.isHmrRefresh === true || await (0, _instantconfig.anySegmentNeedsInstantValidationInDev)(loaderTree));
    const getPayload = async (requestStore)=>{
        const payload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, generateDynamicRSCPayload, ctx, undefined);
        if (isBypassingCachesInDev(requestStore, workStore)) {
            // Mark the RSC payload to indicate that caches were bypassed in dev.
            // This lets the client know not to cache anything based on this render.
            payload._bypassCachesInDev = createElement(WarnForBypassCachesInDev, {
                route: workStore.route
            });
        } else if (shouldValidate) {
            // If this payload will be used for validation, it needs to contain the
            // canonical URL. Without it we'd get an error.
            payload.c = prepareInitialCanonicalUrl(url);
        }
        return payload;
    };
    let debugChannel;
    let stream;
    if (// We only do this flow if we can safely recreate the store from scratch
    // (which is not the case for renders after an action)
    createRequestStore && // We only do this flow if we're not bypassing caches in dev using
    // "disable cache" in devtools, a hard refresh (cache-control: "no-cache"),
    // or draft mode.
    !isBypassingCachesInDev(initialRequestStore, workStore)) {
        // Before we kick off the render, we set the cache status back to it's initial state
        // in case a previous render bypassed the cache.
        if (setCacheStatus) {
            setCacheStatus('ready', htmlRequestId);
        }
        const prefetchMode = await getPrefetchingModeForPage(renderOpts, loaderTree);
        // A client navigation into a Partial Prefetching route extends the shell
        // through the runtime-prefetchable content: it has already settled on the
        // client (via the prefetch) by the time it navigates, so it belongs in this
        // response's shell. Everything else uses the static shell, like an initial
        // load: plain navigations, and HMR refreshes (a fresh render of the current
        // page, with no settled prefetch to draw on). Dynamic content always
        // streams in after the shell.
        let prefetchStage;
        if (initialRequestStore.isHmrRefresh === true) {
            prefetchStage = _stagedrendering.RenderStage.Static;
        } else {
            if (prefetchMode === 2) {
                // TODO(app-shells): model `partialPrefetching: "unstable_eager"`
                // TODO(app-shells): if this navigation came from <Link prefetch={true} />,
                // we should show the shell for a speculative prefetch
                // (which can have more data than the app shell)
                prefetchStage = _stagedrendering.RenderStage.ShellRuntime;
            } else {
                prefetchStage = _stagedrendering.RenderStage.Static;
            }
        }
        // With Server Components HMR cancellation enabled, a superseded HMR refresh
        // aborts its own client fetch (see the client-side supersession logic),
        // which closes this response. We use that response-close as the signal to
        // stop the server work this refresh started that's now discarded: the
        // streaming render below is aborted, and the detached validation is skipped
        // (including aborting the background renders it uses to prepare its
        // inputs). The render's in-flight `'use cache'` fills are left running,
        // since they aren't tied to its controller. A superseding refresh can't
        // reuse those fills today, because each edit changes the HMR hash baked
        // into the cache key; that becomes useful only once those keys use
        // implementation-derived hashes instead (see `use-cache-wrapper.ts`).
        //
        // The detached validation is Cache Components only: it runs only on this
        // staged dev render, so there's nothing to skip on the non-Cache Components
        // dev RSC path. That path (`generateDynamicFlightRenderResult`) aborts its
        // superseded render the same way; it just has no validation to skip.
        //
        // TODO: The gate is `isHmrRefresh` for now because that's the only case we
        // cancel today. The response-close signal itself is general, so this could
        // later be relaxed to also cover a browser stop or a devtools "cancel
        // render" button.
        const requestAbortSignal = renderOpts.experimental.serverComponentsHmrCancellation === true && initialRequestStore.isHmrRefresh === true && (0, _helpers.isNodeNextResponse)(ctx.res) ? (0, _nextrequest.signalFromNodeResponse)(ctx.res.originalResponse) : undefined;
        const result = await stagedRenderWithCachesInDev({
            prefetchMode,
            ctx,
            requestStore: initialRequestStore,
            createRequestStore,
            getPayload,
            onError,
            shouldValidate,
            fallbackRouteParams: fallbackParams,
            getDevRenderDidError: ()=>didErrorObservably,
            navigationKind: {
                type: 'prefetched-client',
                prefetchStage
            },
            requestAbortSignal
        });
        stream = result.stream;
        debugChannel = result.debugChannel;
    } else {
        // We're either bypassing caches or we can't restart the render.
        // Do a dynamic render, but with (basic) environment labels.
        // Set cache status to bypass when specifically bypassing caches in dev
        if (setCacheStatus) {
            setCacheStatus('bypass', htmlRequestId);
        }
        debugChannel = setReactDebugChannel && (0, _debugchannelserver.createNodeDebugChannel)();
        stream = await stagedRenderWithoutCachesInDevNode(ctx, initialRequestStore, getPayload, {
            onError: onError,
            filterStackFrame,
            debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide
        });
    }
    if (debugChannel && setReactDebugChannel) {
        setReactDebugChannel(debugChannel.clientSide, htmlRequestId, requestId);
    }
    return new _flightrenderresult.FlightRenderResult(stream, {
        fetchMetrics: workStore.fetchMetrics
    });
}
async function generateRuntimePrefetchResult(req, ctx, requestStore, isShellPrefetch) {
    const { workStore, renderOpts, htmlRequestId, requestId } = ctx;
    const { isBuildTimePrerendering = false, onInstrumentationRequestError, setReactDebugChannel } = renderOpts;
    function onFlightDataRenderError(err, silenceLog) {
        return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, // TODO(runtime-ppr): should we use a different value?
        createErrorContext(ctx, 'react-server-components-payload'), silenceLog);
    }
    const onError = (0, _createerrorhandler.createReactServerErrorHandler)(false, isBuildTimePrerendering, workStore.reactServerErrorsByDigest, onFlightDataRenderError);
    const metadata = {};
    const staleTimeIterable = new _staletime.StaleTimeIterable();
    const { componentMod: { routeModule: { userland: { loaderTree } } }, getDynamicParamFromSegment } = ctx;
    const rootParams = (0, _createcomponenttree.getRootParams)(loaderTree, getDynamicParamFromSegment);
    // We need to share caches between the prospective prerender and the final prerender,
    // but we're not going to persist this anywhere.
    const prerenderResumeDataCache = (0, _resumedatacache.createPrerenderResumeDataCache)();
    await prospectiveRuntimeServerPrerender(ctx, isShellPrefetch, generateDynamicRSCPayload.bind(null, ctx), prerenderResumeDataCache, rootParams, requestStore.headers, requestStore.cookies, requestStore.draftMode);
    const mode = isShellPrefetch ? {
        type: 'session-shell-only',
        shellUsedSessionDataDeferred: (0, _promisewithresolvers.createPromiseWithResolvers)()
    } : {
        type: 'rewindable-session-shell',
        shellUsedSessionDataDeferred: (0, _promisewithresolvers.createPromiseWithResolvers)(),
        shellByteLengthDeferred: (0, _promisewithresolvers.createPromiseWithResolvers)()
    };
    const debugChannel = setReactDebugChannel ? (0, _debugchannelserver.createWebDebugChannel)() : undefined;
    if (debugChannel && setReactDebugChannel) {
        setReactDebugChannel(debugChannel.clientSide, htmlRequestId, requestId);
    }
    const response = await finalRuntimeServerPrerender(mode, ctx, generateDynamicRSCPayload.bind(null, ctx, {
        staleTimeIterable,
        shellByteLengthPromise: mode.type === 'rewindable-session-shell' ? mode.shellByteLengthDeferred.promise : undefined,
        shellUsedSessionDataPromise: mode.shellUsedSessionDataDeferred.promise
    }), prerenderResumeDataCache, rootParams, requestStore.headers, requestStore.cookies, requestStore.draftMode, onError, staleTimeIterable, debugChannel == null ? void 0 : debugChannel.serverSide);
    applyMetadataFromPrerenderResult(response, metadata, workStore);
    metadata.fetchMetrics = ctx.workStore.fetchMetrics;
    return new _flightrenderresult.FlightRenderResult(response.result.prelude, metadata);
}
async function prospectiveRuntimeServerPrerender(ctx, isShellPrefetch, getPayload, resumeDataCache, rootParams, headers, cookies, draftMode) {
    const { implicitTags, renderOpts, workStore } = ctx;
    const { ComponentMod } = renderOpts;
    // Prerender controller represents the lifetime of the prerender.
    // It will be aborted when a Task is complete or a synchronously aborting
    // API is called. Notably during cache-filling renders this does not actually
    // terminate the render itself which will continue until all caches are filled
    const initialServerPrerenderController = new AbortController();
    // This controller represents the lifetime of the React render call. Notably
    // during the cache-filling render it is different from the prerender controller
    // because we don't want to end the react render until all caches are filled.
    const initialServerRenderController = new AbortController();
    // The cacheSignal helps us track whether caches are still filling or we are ready
    // to cut the render off.
    const cacheSignal = new _cachesignal.CacheSignal();
    const initialServerPrerenderStore = {
        type: 'prerender-runtime',
        phase: 'render',
        rootParams,
        implicitTags,
        renderSignal: initialServerRenderController.signal,
        controller: initialServerPrerenderController,
        // During the initial prerender we need to track all cache reads to ensure
        // we render long enough to fill every cache it is possible to visit during
        // the final prerender.
        cacheSignal,
        // We only need to track dynamic accesses during the final prerender.
        dynamicTracking: null,
        // Runtime prefetches are never cached server-side, only client-side,
        // so we set `expire` and `revalidate` to their minimum values just in case.
        revalidate: 1,
        expire: 0,
        stale: _constants1.INFINITE_CACHE,
        tags: [
            ...implicitTags.tags
        ],
        resumeDataCache,
        hmrRefreshHash: undefined,
        // We don't track vary params during initial prerender, only the final one
        varyParamsAccumulator: null,
        // No stage sequencing needed for prospective renders.
        stagedRendering: null,
        isSessionShell: isShellPrefetch,
        // These are not present in regular prerenders, but allowed in a runtime
        // prerender.
        // Any cache keyed on headers() or cookies() needs to be invalidated.
        // Otherwise some Next.js API semantics leak across render passes.
        headers: _headers.HeadersAdapter.fresh(headers),
        cookies: _requestcookies.RequestCookiesAdapter.fresh(cookies),
        draftMode
    };
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    // We're not going to use the result of this render because the only time it could be used
    // is if it completes in a microtask and that's likely very rare for any non-trivial app
    const initialServerPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialServerPrerenderStore, getPayload);
    const prerenderOptions = {
        filterStackFrame,
        onError: (err)=>{
            const digest = (0, _createerrorhandler.getDigestForWellKnownError)(err);
            if (digest) {
                return digest;
            }
            if (initialServerPrerenderController.signal.aborted) {
                // The render aborted before this error was handled which indicates
                // the error is caused by unfinished components within the render
                return;
            } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
                (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
            }
        },
        // We don't want to stop rendering until the cacheSignal is complete so we pass
        // a different signal to this render call than is used by dynamic APIs to signify
        // transitioning out of the prerender environment
        signal: initialServerRenderController.signal
    };
    const pendingInitialServerResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialServerPrerenderStore, (0, _streamops.getServerPrerender)(ComponentMod), initialServerPayload, clientModules, prerenderOptions);
    // Wait for all caches to be finished filling and for async imports to resolve
    (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
    await cacheSignal.cacheReady();
    initialServerRenderController.abort();
    initialServerPrerenderController.abort();
    // We don't need to continue the prerender process if we already
    // detected invalid dynamic usage in the initial prerender phase.
    if (workStore.invalidDynamicUsageError) {
        throw workStore.invalidDynamicUsageError;
    }
    try {
        return await (0, _apprenderprerenderutils.createReactServerPrerenderResult)(pendingInitialServerResult);
    } catch (err) {
        if (initialServerRenderController.signal.aborted || initialServerPrerenderController.signal.aborted) {
        // These are expected errors that might error the prerender. we ignore them.
        } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
            // We don't normally log these errors because we are going to retry anyway but
            // it can be useful for debugging Next.js itself to get visibility here when needed
            (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
        }
        return null;
    }
}
/**
 * Prepends a single ASCII byte to the chunks indicating whether the response
 * is partial (contains dynamic holes): '~' (0x7e) for partial, '#' (0x23)
 * for complete.
 */ function prependIsPartialByteToChunks(chunks, isPartial) {
    const markerByte = isPartial ? 0x7e : 0x23;
    return [
        new Uint8Array([
            markerByte
        ]),
        ...chunks
    ];
}
async function finalRuntimeServerPrerender(mode, ctx, getPayload, resumeDataCache, rootParams, headers, cookies, draftMode, onError, staleTimeIterable, debugChannel) {
    const { implicitTags, renderOpts } = ctx;
    const { ComponentMod, experimental, isDebugDynamicAccesses } = renderOpts;
    const selectStaleTime = (0, _staletime.createSelectStaleTime)(experimental);
    let resultIsPartial = false;
    const finalServerController = new AbortController();
    const serverDynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(isDebugDynamicAccesses);
    const finalStageController = new _stagedrendering.StagedRenderingController({
        abortSignal: finalServerController.signal,
        abandonController: null,
        // In dynamic renders, we allow Sync IO in the Runtime stage
        // if partialPrefetching is not enabled. However, a runtime prerender
        // (or App Shell) is stricter and never allows sync IO in any stage
        // that we go through here (i.e. < Dynamic)
        syncIO: _stagedrendering.SyncIOMode.AllowedInDynamic,
        // we only reach the runtime stage if we're doing a rewindable render
        finalStage: mode.type === 'session-shell-only' ? _stagedrendering.RenderStage.ShellRuntime : _stagedrendering.RenderStage.Runtime
    });
    const varyParamsAccumulator = (0, _varyparams.createResponseVaryParamsAccumulator)();
    const finalServerPrerenderStore = {
        type: 'prerender-runtime',
        phase: 'render',
        rootParams,
        implicitTags,
        renderSignal: finalServerController.signal,
        controller: finalServerController,
        // All caches we could read must already be filled so no tracking is necessary
        cacheSignal: null,
        dynamicTracking: serverDynamicTracking,
        // Runtime prefetches are never cached server-side, only client-side,
        // so we set `expire` and `revalidate` to their minimum values just in case.
        revalidate: 1,
        expire: 0,
        stale: _constants1.INFINITE_CACHE,
        tags: [
            ...implicitTags.tags
        ],
        resumeDataCache,
        hmrRefreshHash: undefined,
        varyParamsAccumulator,
        stagedRendering: finalStageController,
        isSessionShell: mode.type === 'session-shell-only',
        // These are not present in regular prerenders, but allowed in a runtime
        // prerender.
        headers: _headers.HeadersAdapter.fresh(headers),
        cookies: _requestcookies.RequestCookiesAdapter.fresh(cookies),
        draftMode
    };
    (0, _staletime.trackStaleTime)(finalServerPrerenderStore, staleTimeIterable, selectStaleTime);
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    const finalRSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalServerPrerenderStore, getPayload);
    const streamState = createStreamPendingState();
    const collectedChunks = createPrerenderChunksAccumulator();
    const stageByteLengths = createStageByteLengths();
    const collectChunk = (chunk)=>{
        collectPrerenderChunk(collectedChunks, finalServerController.signal, chunk);
        increaseChunkByteLengths(stageByteLengths, finalStageController.currentStage, chunk.byteLength);
    };
    let didHandleUnexpectedAbort = false;
    /**
   * @returns - whether or not the task should be skipped
   * because the render was already aborted.
   * */ const checkUnexpectedAbort = ()=>{
        if (finalServerController.signal.aborted) {
            // If the server controller is already aborted, then we must have encountered sync IO
            if (!didHandleUnexpectedAbort) {
                didHandleUnexpectedAbort = true;
                onUnexpectedAbort();
            }
            return true;
        }
        // Not aborted.
        return false;
    };
    const onUnexpectedAbort = ()=>{
        resultIsPartial = true;
        // FIXME(NAR-810): If we're already aborted due to Sync IO, there should be no need to
        // finish the accumulators. However, it seems like in `--debug-prerender`
        // the stream will stay open if we don't close the iterable here.
        if (process.env.NODE_ENV === 'development') {
            if (staleTimeIterable !== undefined) {
                staleTimeIterable.close();
            }
            (0, _varyparams.finishAccumulatingVaryParams)(varyParamsAccumulator);
        }
    };
    await (0, _apprenderrenderutils.runInSequentialTasks)(async ()=>{
        finalStageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        let stream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalServerPrerenderStore, ComponentMod.renderToReadableStream, finalRSCPayload, clientModules, {
            filterStackFrame,
            onError,
            signal: finalServerController.signal,
            debugChannel
        });
        // Note: this await will only resolve after the last task (unless sync IO aborts the render earlier)
        // We await it here so that if the stream errors, it's not an unhandled rejection.
        await iterateStreamingPrerenderChunks(stream, finalServerController.signal, collectChunk, streamState);
    }, ()=>{
        if (checkUnexpectedAbort()) return;
        finalStageController.advanceStage(_stagedrendering.RenderStage.Static);
    }, ()=>{
        if (checkUnexpectedAbort()) return;
        finalStageController.advanceStage(_stagedrendering.RenderStage.ShellRuntime);
    }, ()=>{
        if (checkUnexpectedAbort()) return;
        if (mode.type === 'session-shell-only') {
            // We're only rendering a shell, so we do not advance to stages where link data is resolved.
            return;
        }
        finalStageController.advanceStage(_stagedrendering.RenderStage.Runtime);
    }, ()=>{
        if (checkUnexpectedAbort()) return;
        // Finish the accumulators. We need to wait for Flight to flush the result into the stream,
        // which is scheduled in a (fast) immediate, so we do this in a separate task
        // (fast immediates will be drained at the end of the task, so in the next task we know we're done flushing)
        // Check if session data unblocked new content in the shell.
        const didSessionDataUnblockNewContent = stageByteLengths[_stagedrendering.RenderStage.ShellRuntime] > stageByteLengths[_stagedrendering.RenderStage.Static];
        mode.shellUsedSessionDataDeferred.resolve(didSessionDataUnblockNewContent);
        if (mode.type === 'rewindable-session-shell') {
            // If advancing to the runtime stage didn't unblock new content,
            // then the result does not depend on link data and can be used as a shell (indicated via `null`).
            // Otherwise, send a byte length to indicate where the shell content ends.
            const didLinkDataUnblockNewContent = stageByteLengths[_stagedrendering.RenderStage.Runtime] > stageByteLengths[_stagedrendering.RenderStage.ShellRuntime];
            mode.shellByteLengthDeferred.resolve(didLinkDataUnblockNewContent ? stageByteLengths[_stagedrendering.RenderStage.ShellRuntime] : null);
        }
        staleTimeIterable.close();
        (0, _varyparams.finishAccumulatingVaryParams)(varyParamsAccumulator);
    }, ()=>{
        if (checkUnexpectedAbort()) return;
        if (streamState.isPending) {
            // If the prerender is still pending then it must depend on dynamic data
            // (or, if this is a shell prefetch, link data)
            resultIsPartial = true;
        }
        _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalServerPrerenderStore, finalServerController.abort.bind(finalServerController));
    });
    const result = {
        prelude: new _apprenderprerenderutils.ReactServerPrerenderResult(prependIsPartialByteToChunks(collectedChunks.prerenderChunks, resultIsPartial)).consumeAsStream()
    };
    return {
        result,
        // TODO(runtime-ppr): do we need to produce a digest map here?
        // digestErrorsMap: ...,
        dynamicAccess: serverDynamicTracking,
        isPartial: resultIsPartial,
        collectedRevalidate: finalServerPrerenderStore.revalidate,
        collectedExpire: finalServerPrerenderStore.expire,
        collectedStale: staleTimeIterable.currentValue,
        collectedTags: finalServerPrerenderStore.tags
    };
}
/**
 * Crawlers will inadvertently think the canonicalUrl in the RSC payload should be crawled
 * when our intention is to just seed the router state with the current URL.
 * This function splits up the pathname so that we can later join it on
 * when we're ready to consume the path.
 */ function prepareInitialCanonicalUrl(url) {
    return (url.pathname + url.search).split('/');
}
function getRenderedSearch(query) {
    // Inlined implementation of querystring.encode, which is not available in
    // the Edge runtime.
    const pairs = [];
    for(const key in query){
        const value1 = query[key];
        if (value1 == null) continue;
        if (Array.isArray(value1)) {
            for (const v of value1){
                pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
            }
        } else {
            pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value1))}`);
        }
    }
    // The result should match the format of a web URL's `search` property, since
    // this is the format that's stored in the App Router state.
    // TODO: We're a bit inconsistent about this. The x-nextjs-rewritten-query
    // header omits the leading question mark. Should refactor to always do
    // that instead.
    if (pairs.length === 0) {
        // If the search string is empty, return an empty string.
        return '';
    }
    // Prepend '?' to the search params string.
    return '?' + pairs.join('&');
}
// This is the data necessary to render <AppRouter /> when no SSR errors are encountered
async function getRSCPayload(tree, ctx, options) {
    var _ctx_renderOpts_prefetchHints;
    const { is404, staleTimeIterable, staticStageByteLengthPromise, shellByteLengthPromise, runtimePrefetchStream } = options;
    const injectedCSS = new Set();
    const injectedJS = new Set();
    const injectedFontPreloadTags = new Set();
    let missingSlots;
    // We only track missing parallel slots in development
    if (process.env.__NEXT_DEV_SERVER) {
        missingSlots = new Set();
    }
    const { getDynamicParamFromSegment, query, appUsingSizeAdjustment, componentMod: { createMetadataComponents, createElement, Fragment }, url, workStore } = ctx;
    const hints = ((_ctx_renderOpts_prefetchHints = ctx.renderOpts.prefetchHints) == null ? void 0 : _ctx_renderOpts_prefetchHints[ctx.pagePath]) ?? null;
    const prefetchInliningEnabled = Boolean(ctx.renderOpts.experimental.prefetchInlining);
    const initialTree = await (0, _createflightrouterstatefromloadertree.createFlightRouterStateFromLoaderTree)(tree, hints, prefetchInliningEnabled, ctx.renderOpts.cacheComponents, ctx.renderOpts.partialPrefetching, workStore.isStaticGeneration, ctx.renderOpts.isBuildTimePrerendering ?? false, getDynamicParamFromSegment, query);
    const serveStreamingMetadata = !!ctx.renderOpts.serveStreamingMetadata;
    const hasGlobalNotFound = !!tree[2]['global-not-found'];
    const { Viewport, Metadata, MetadataOutlet } = createMetadataComponents({
        tree,
        // When it's using global-not-found, metadata errorType is undefined, which will retrieve the
        // metadata from the page.
        // When it's using not-found, metadata errorType is 'not-found', which will retrieve the
        // metadata from the not-found.js boundary.
        // TODO: remove this condition and keep it undefined when global-not-found is stabilized.
        errorType: is404 && !hasGlobalNotFound ? 'not-found' : undefined,
        parsedQuery: query,
        pathname: url.pathname,
        metadataContext: (0, _metadatacontext.createMetadataContext)(ctx.renderOpts),
        interpolatedParams: ctx.interpolatedParams,
        serveStreamingMetadata
    });
    const preloadCallbacks = [];
    const seedData = await (0, _createcomponenttree.createComponentTree)({
        ctx,
        loaderTree: tree,
        parentParams: {},
        parentOptionalCatchAllParamName: null,
        parentRuntimePrefetchable: false,
        injectedCSS,
        injectedJS,
        injectedFontPreloadTags,
        rootLayoutIncluded: false,
        missingSlots,
        preloadCallbacks,
        authInterrupts: ctx.renderOpts.experimental.authInterrupts,
        MetadataOutlet
    });
    // When the `vary` response header is present with `Next-URL`, that means there's a chance
    // it could respond differently if there's an interception route. We provide this information
    // to `AppRouter` so that it can properly seed the prefetch cache with a prefix, if needed.
    // In dev, the Vary header may not reliably reflect whether a route can
    // be intercepted, because interception routes are compiled on demand.
    // Default to true so the client doesn't cache a stale Fallback entry.
    const varyHeader = ctx.res.getHeader('vary');
    const couldBeIntercepted = !!process.env.__NEXT_DEV_SERVER || typeof varyHeader === 'string' && varyHeader.includes(_approuterheaders.NEXT_URL);
    const initialHead = createElement(Fragment, {
        key: flightDataPathHeadKey
    }, createElement(NonIndex, {
        createElement,
        pagePath: ctx.pagePath,
        statusCode: ctx.res.statusCode,
        isPossibleServerAction: ctx.isPossibleServerAction
    }), createElement(Viewport, null), createElement(Metadata, null), appUsingSizeAdjustment ? createElement('meta', {
        name: 'next-size-adjust',
        content: ''
    }) : null);
    const { GlobalError, styles: globalErrorStyles } = await getGlobalErrorStyles(tree, ctx);
    // Assume the head we're rendering contains only partial data if PPR is
    // enabled and this is a statically generated response. This is used by the
    // client Segment Cache after a prefetch to determine if it can skip the
    // second request to fill in the dynamic data.
    //
    // See similar comment in create-component-tree.tsx for more context.
    const isPossiblyPartialHead = workStore.isStaticGeneration && ctx.renderOpts.experimental.isRoutePPREnabled === true;
    return maybeAppendBuildIdToRSCPayload(ctx, {
        // See the comment above the `Preloads` component (below) for why this is part of the payload
        P: createElement(Preloads, {
            preloadCallbacks: preloadCallbacks
        }),
        c: prepareInitialCanonicalUrl(url),
        q: getRenderedSearch(query),
        i: !!couldBeIntercepted,
        f: [
            [
                initialTree,
                seedData,
                initialHead,
                isPossiblyPartialHead
            ]
        ],
        m: missingSlots,
        G: [
            GlobalError,
            globalErrorStyles
        ],
        // Tells the client whether this route supports per-segment prefetching.
        // With Cache Components, all routes support it. Without it, only fully
        // static pages do, because their per-segment prefetch responses are
        // generated during static generation (build or ISR).
        S: workStore.isStaticGeneration || ctx.renderOpts.cacheComponents,
        h: (0, _varyparams.getMetadataVaryParamsAccumulator)(),
        r: (0, _varyparams.getRootParamsVaryParamsAccumulator)() ?? undefined,
        s: staleTimeIterable,
        a: shellByteLengthPromise,
        l: staticStageByteLengthPromise,
        p: runtimePrefetchStream,
        // Include the per-page dynamic stale time from unstable_dynamicStaleTime, but
        // only for dynamic renders. The client treats its presence as
        // authoritative.
        // TODO: Move this to the prefetch hints file so we don't have to walk
        // the tree on every render.
        d: !workStore.isStaticGeneration ? await getDynamicStaleTime(tree) ?? undefined : undefined
    });
}
/**
 * Preload calls (such as `ReactDOM.preloadStyle` and `ReactDOM.preloadFont`) need to be called during rendering
 * in order to create the appropriate preload tags in the DOM, otherwise they're a no-op. Since we invoke
 * renderToReadableStream with a function that returns component props rather than a component itself, we use
 * this component to "render  " the preload calls.
 */ function Preloads({ preloadCallbacks }) {
    preloadCallbacks.forEach((preloadFn)=>preloadFn());
    return null;
}
// This is the data necessary to render <AppRouter /> when an error state is triggered
async function getErrorRSCPayload(tree, ctx, ssrError, errorType, shouldRenderMetadataAndViewport) {
    var _ctx_renderOpts_prefetchHints;
    const { getDynamicParamFromSegment, query, componentMod: { createMetadataComponents, createElement, Fragment }, url, workStore } = ctx;
    let Viewport = null;
    let Metadata = null;
    if (shouldRenderMetadataAndViewport) {
        const serveStreamingMetadata = !!ctx.renderOpts.serveStreamingMetadata;
        const metadataComponents = createMetadataComponents({
            tree,
            parsedQuery: query,
            pathname: url.pathname,
            metadataContext: (0, _metadatacontext.createMetadataContext)(ctx.renderOpts),
            errorType,
            interpolatedParams: ctx.interpolatedParams,
            serveStreamingMetadata: serveStreamingMetadata
        });
        Viewport = metadataComponents.Viewport;
        Metadata = metadataComponents.Metadata;
    }
    const initialHead = createElement(Fragment, {
        key: flightDataPathHeadKey
    }, createElement(NonIndex, {
        createElement,
        pagePath: ctx.pagePath,
        statusCode: ctx.res.statusCode,
        isPossibleServerAction: ctx.isPossibleServerAction
    }), Viewport ? createElement(Viewport, null) : null, process.env.__NEXT_DEV_SERVER && createElement('meta', {
        name: 'next-error',
        content: 'not-found'
    }), Metadata ? createElement(Metadata, null) : null);
    const errorHints = ((_ctx_renderOpts_prefetchHints = ctx.renderOpts.prefetchHints) == null ? void 0 : _ctx_renderOpts_prefetchHints[ctx.pagePath]) ?? null;
    const errorPrefetchInliningEnabled = Boolean(ctx.renderOpts.experimental.prefetchInlining);
    const initialTree = await (0, _createflightrouterstatefromloadertree.createFlightRouterStateFromLoaderTree)(tree, errorHints, errorPrefetchInliningEnabled, ctx.renderOpts.cacheComponents, ctx.renderOpts.partialPrefetching, workStore.isStaticGeneration, ctx.renderOpts.isBuildTimePrerendering ?? false, getDynamicParamFromSegment, query);
    let err = undefined;
    if (ssrError) {
        err = (0, _iserror.default)(ssrError) ? ssrError : Object.defineProperty(new Error(ssrError + ''), "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
    }
    // For metadata notFound error there's no global not found boundary on top
    // so we create a not found page with AppRouter
    const seedData = [
        createElement('html', {
            id: '__next_error__'
        }, createElement('head', null), createElement('body', null, process.env.__NEXT_DEV_SERVER && err ? createElement('template', {
            'data-next-error-message': err.message,
            'data-next-error-digest': 'digest' in err ? err.digest : '',
            'data-next-error-stack': err.stack
        }) : null)),
        {},
        null,
        false,
        null
    ];
    const { GlobalError, styles: globalErrorStyles } = await getGlobalErrorStyles(tree, ctx);
    const isPossiblyPartialHead = workStore.isStaticGeneration && ctx.renderOpts.experimental.isRoutePPREnabled === true;
    return maybeAppendBuildIdToRSCPayload(ctx, {
        c: prepareInitialCanonicalUrl(url),
        q: getRenderedSearch(query),
        m: undefined,
        i: false,
        f: [
            [
                initialTree,
                seedData,
                initialHead,
                isPossiblyPartialHead
            ]
        ],
        G: [
            GlobalError,
            globalErrorStyles
        ],
        // Tells the client whether this route supports per-segment prefetching.
        // With Cache Components, all routes support it. Without it, only fully
        // static pages do, because their per-segment prefetch responses are
        // generated during static generation (build or ISR).
        S: workStore.isStaticGeneration || ctx.renderOpts.cacheComponents,
        h: (0, _varyparams.getMetadataVaryParamsAccumulator)(),
        r: (0, _varyparams.getRootParamsVaryParamsAccumulator)() ?? undefined
    });
}
// This component must run in an SSR context. It will render the RSC root component
function App({ reactServerStream, reactDebugStream, debugEndTime, preinitScripts, ServerInsertedHTMLProvider, nonce, images }) {
    preinitScripts();
    const response = _react.use((0, _useflightresponse.getFlightStream)(reactServerStream, reactDebugStream, debugEndTime, nonce));
    const initialState = (0, _createinitialrouterstate.createInitialRouterState)({
        // This is not used during hydration, so we don't have to pass a
        // real timestamp.
        navigatedAt: -1,
        initialRSCPayload: response,
        // location is not initialized in the SSR render
        // it's set to window.location during hydration
        location: null
    });
    const actionQueue = (0, _approuterinstance.createMutableActionQueue)(initialState);
    const { HeadManagerContext } = require('../../shared/lib/head-manager-context.shared-runtime');
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(HeadManagerContext.Provider, {
        value: {
            appDir: true,
            nonce
        },
        children: /*#__PURE__*/ (0, _jsxruntime.jsx)(_imageconfigcontextsharedruntime.ImageConfigContext.Provider, {
            value: images ?? _imageconfig.imageConfigDefault,
            children: /*#__PURE__*/ (0, _jsxruntime.jsx)(ServerInsertedHTMLProvider, {
                children: /*#__PURE__*/ (0, _jsxruntime.jsx)(_approuter.default, {
                    actionQueue: actionQueue,
                    globalErrorState: response.G
                })
            })
        })
    });
/* eslint-enable @next/internal/no-ambiguous-jsx -- React Client */ }
// @TODO our error stream should be probably just use the same root component. But it was previously
// different I don't want to figure out if that is meaningful at this time so just keeping the behavior
// consistent for now.
function ErrorApp({ reactServerStream, preinitScripts, ServerInsertedHTMLProvider, nonce, images }) {
    /* eslint-disable @next/internal/no-ambiguous-jsx -- React Client */ preinitScripts();
    const response = _react.use((0, _useflightresponse.getFlightStream)(reactServerStream, undefined, undefined, nonce));
    const initialState = (0, _createinitialrouterstate.createInitialRouterState)({
        // This is not used during hydration, so we don't have to pass a
        // real timestamp.
        navigatedAt: -1,
        initialRSCPayload: response,
        // location is not initialized in the SSR render
        // it's set to window.location during hydration
        location: null
    });
    const actionQueue = (0, _approuterinstance.createMutableActionQueue)(initialState);
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(_imageconfigcontextsharedruntime.ImageConfigContext.Provider, {
        value: images ?? _imageconfig.imageConfigDefault,
        children: /*#__PURE__*/ (0, _jsxruntime.jsx)(ServerInsertedHTMLProvider, {
            children: /*#__PURE__*/ (0, _jsxruntime.jsx)(_approuter.default, {
                actionQueue: actionQueue,
                globalErrorState: response.G
            })
        })
    });
/* eslint-enable @next/internal/no-ambiguous-jsx -- React Client */ }
/**
 * Extracted to a separate function to prevent V8 from retaining the entire
 * `renderToHTMLOrFlightImpl` closure scope through globalThis.__next_require__.
 * V8 shares a single Context object per scope for all closures; by creating
 * these closures in their own function scope, the globalThis references only
 * retain `instrumented` and `cacheComponents`, not request-specific data like
 * req/res/workStore.
 */ function installGlobalModuleLoadingHandlers(ComponentMod, cacheComponents, isTracingEnabled) {
    const instrumented = (0, _clientcomponentrendererlogger.wrapClientComponentLoader)(ComponentMod, isTracingEnabled);
    // When we are prerendering if there is a cacheSignal for tracking
    // cache reads we track calls to `loadChunk` and `require`. This allows us
    // to treat chunk/module loading with similar semantics as cache reads to avoid
    // module loading from causing a prerender to abort too early.
    const shouldTrackModuleLoading = ()=>{
        if (!cacheComponents) {
            return false;
        }
        if (process.env.__NEXT_DEV_SERVER) {
            return true;
        }
        const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
        if (!workUnitStore) {
            return false;
        }
        switch(workUnitStore.type){
            case 'prerender':
            case 'prerender-client':
            case 'validation-client':
            case 'prerender-runtime':
            case 'cache':
            case 'private-cache':
                return true;
            case 'prerender-ppr':
            case 'prerender-legacy':
            case 'request':
            case 'unstable-cache':
            case 'generate-static-params':
                return false;
            default:
                workUnitStore;
        }
    };
    // @ts-expect-error
    globalThis.__next_require__ = (...args)=>{
        const exportsOrPromise = instrumented.require(...args);
        if (shouldTrackModuleLoading()) {
            (0, _trackmoduleloadingexternal.trackPendingImport)(exportsOrPromise);
        }
        return exportsOrPromise;
    };
    // @ts-expect-error
    globalThis.__next_chunk_load__ = (...args)=>{
        const loadingChunk = instrumented.loadChunk(...args);
        if (shouldTrackModuleLoading()) {
            (0, _trackmoduleloadingexternal.trackPendingChunkLoad)(loadingChunk);
        }
        return loadingChunk;
    };
}
async function renderToHTMLOrFlightImpl(req, res, url, pagePath, query, renderOpts, workStore, parsedRequestHeaders, postponedState, serverComponentsHmrCache, sharedContext, interpolatedParams, fallbackRouteParams) {
    const isNotFoundPath = pagePath === '/404';
    if (isNotFoundPath) {
        res.statusCode = 404;
    }
    // A unique request timestamp used by development to ensure that it's
    // consistent and won't change during this request. This is important to
    // avoid that resources can be deduped by React Float if the same resource is
    // rendered or preloaded multiple times: `<link href="a.css?v={Date.now()}"/>`.
    const requestTimestamp = Date.now();
    const { ComponentMod, nextFontManifest, serverActions, assetPrefix = '', enableTainting, cacheComponents, setIsrStatus } = renderOpts;
    const { cachedNavigations } = renderOpts.experimental;
    // We need to expose the bundled `require` API globally for
    // react-server-dom-webpack. This is a hack until we find a better way.
    if (ComponentMod.__next_app__) {
        var _getTracer_getActiveScopeSpan;
        const isTracingEnabled = ((_getTracer_getActiveScopeSpan = (0, _tracer.getTracer)().getActiveScopeSpan()) == null ? void 0 : _getTracer_getActiveScopeSpan.isRecording()) ?? false;
        installGlobalModuleLoadingHandlers(ComponentMod, cacheComponents, isTracingEnabled);
    }
    if (process.env.__NEXT_DEV_SERVER && setIsrStatus && !cacheComponents) {
        // Reset the ISR status at start of request.
        const { pathname } = new URL(req.url || '/', 'http://n');
        setIsrStatus(pathname, // Only pages using the Node runtime can use ISR, Edge is always dynamic.
        process.env.NEXT_RUNTIME === 'edge' ? false : undefined);
    }
    if (// The type check here ensures that `req` is correctly typed, and the
    // environment variable check provides dead code elimination.
    process.env.NEXT_RUNTIME !== 'edge' && (0, _helpers.isNodeNextRequest)(req)) {
        res.onClose(()=>{
            // We stop tracking fetch metrics when the response closes, since we
            // report them at that time.
            workStore.shouldTrackFetchMetrics = false;
        });
        req.originalRequest.on('end', ()=>{
            if ('performance' in globalThis) {
                const metrics = (0, _clientcomponentrendererlogger.getClientComponentLoaderMetrics)({
                    reset: true
                });
                if (metrics) {
                    (0, _tracer.getTracer)().startSpan(_constants.NextNodeServerSpan.clientComponentLoading, {
                        startTime: metrics.clientComponentLoadStart,
                        attributes: {
                            'next.clientComponentLoadCount': metrics.clientComponentLoadCount,
                            'next.span_type': _constants.NextNodeServerSpan.clientComponentLoading
                        }
                    }).end(metrics.clientComponentLoadStart + metrics.clientComponentLoadTimes);
                }
            }
        });
    }
    const metadata = {
        statusCode: isNotFoundPath ? 404 : undefined,
        hasPendingUi: false
    };
    const appUsingSizeAdjustment = !!(nextFontManifest == null ? void 0 : nextFontManifest.appUsingSizeAdjust);
    ComponentMod.patchFetch();
    // Pull out the hooks/references from the component.
    const { routeModule: { userland: { loaderTree } }, taintObjectReference } = ComponentMod;
    if (enableTainting) {
        taintObjectReference('Do not pass process.env to Client Components since it will leak sensitive data', process.env);
    }
    workStore.fetchMetrics = [];
    metadata.fetchMetrics = workStore.fetchMetrics;
    // don't modify original query object
    query = {
        ...query
    };
    (0, _internalutils.stripInternalQueries)(query);
    const { isStaticGeneration } = workStore;
    let requestId;
    let htmlRequestId;
    const requestInsightsIdentity = process.env.__NEXT_REQUEST_INSIGHTS ? (0, _requestinsightsidentity.getRequestInsightsIdentity)() : undefined;
    const { flightRouterState, isPrefetchRequest, isRuntimePrefetchRequest, isAppShellPrefetchRequest, isRSCRequest, isHmrRefresh, nonce } = parsedRequestHeaders;
    if (parsedRequestHeaders.requestId) {
        // If the client has provided a request ID (in development mode), we use it.
        requestId = parsedRequestHeaders.requestId;
    } else if (requestInsightsIdentity) {
        // Request Insights starts recording before the work store exists. Reuse
        // the identity from that outer request scope so all spans stay together.
        requestId = requestInsightsIdentity.requestId;
    } else {
        // Otherwise we generate a new request ID.
        if (isStaticGeneration) {
            requestId = Buffer.from(await crypto.subtle.digest('SHA-1', Buffer.from(req.url))).toString('hex');
        } else if (process.env.NEXT_RUNTIME === 'edge') {
            requestId = crypto.randomUUID();
        } else {
            requestId = require('next/dist/compiled/nanoid').nanoid();
        }
    }
    // If the client has provided an HTML request ID, we use it to associate the
    // request with the HTML document from which it originated, which is used to
    // send debug information to the associated WebSocket client. Otherwise, this
    // is the request for the HTML document, so we use the request ID also as the
    // HTML request ID.
    htmlRequestId = parsedRequestHeaders.htmlRequestId || (requestInsightsIdentity == null ? void 0 : requestInsightsIdentity.htmlRequestId) || requestId;
    workStore.requestId = requestId;
    workStore.htmlRequestId = htmlRequestId;
    const getDynamicParamFromSegment = makeGetDynamicParamFromSegment(interpolatedParams, fallbackRouteParams, renderOpts.experimental.optimisticRouting);
    const isPossibleActionRequest = (0, _serveractionrequestmeta.getIsPossibleServerAction)(req);
    // For implicit tags, we use the resolved pathname which has dynamic params
    // interpolated, is decoded, and has trailing slash removed.
    const resolvedPathname = (0, _requestmeta.getRequestMeta)(req, 'resolvedPathname');
    if (!resolvedPathname) {
        throw Object.defineProperty(new _invarianterror.InvariantError('resolvedPathname must be set in request metadata'), "__NEXT_ERROR_CODE", {
            value: "E981",
            enumerable: false,
            configurable: true
        });
    }
    const implicitTags = await (0, _implicittags.getImplicitTags)(workStore.page, resolvedPathname, fallbackRouteParams);
    const ctx = {
        componentMod: ComponentMod,
        url,
        renderOpts,
        workStore,
        parsedRequestHeaders,
        getDynamicParamFromSegment,
        interpolatedParams,
        fallbackRouteParams,
        query,
        isPrefetch: isPrefetchRequest,
        isPossibleServerAction: isPossibleActionRequest,
        requestTimestamp,
        appUsingSizeAdjustment,
        flightRouterState,
        requestId,
        htmlRequestId,
        pagePath,
        assetPrefix,
        isNotFoundPath,
        nonce,
        res,
        sharedContext,
        implicitTags
    };
    (0, _tracer.getTracer)().setRootSpanAttribute('next.route', pagePath);
    if (isStaticGeneration) {
        // We're either building or revalidating. In either case we need to
        // prerender our page rather than render it.
        const prerenderToStreamWithTracing = (0, _tracer.getTracer)().wrap(_constants.AppRenderSpan.getBodyResult, {
            spanName: `prerender route (app) ${pagePath}`,
            attributes: {
                'next.route': pagePath
            }
        }, prerenderToStream);
        const response = await prerenderToStreamWithTracing(req, res, ctx, metadata, loaderTree, fallbackRouteParams);
        // If we're debugging partial prerendering, print all the dynamic API accesses
        // that occurred during the render.
        // @TODO move into renderToStream function
        if (response.dynamicAccess && (0, _dynamicrendering.accessedDynamicData)(response.dynamicAccess) && renderOpts.isDebugDynamicAccesses) {
            (0, _log.warn)('The following dynamic usage was detected:');
            for (const access of (0, _dynamicrendering.formatDynamicAPIAccesses)(response.dynamicAccess)){
                (0, _log.warn)(access);
            }
        }
        // If we encountered any unexpected errors during build we fail the
        // prerendering phase and the build.
        if (workStore.invalidDynamicUsageError) {
            (0, _dynamicrendering.logDisallowedDynamicError)(workStore, workStore.invalidDynamicUsageError);
            throw new _staticgenerationbailout.StaticGenBailoutError();
        }
        if (response.digestErrorsMap.size) {
            const buildFailingError = response.digestErrorsMap.values().next().value;
            if (buildFailingError) throw buildFailingError;
        }
        // Pick first userland SSR error, which is also not a RSC error.
        if (response.ssrErrors.length) {
            const buildFailingError = response.ssrErrors.find((err)=>(0, _createerrorhandler.isUserLandError)(err));
            if (buildFailingError) throw buildFailingError;
        }
        const options = {
            metadata,
            contentType: _constants1.HTML_CONTENT_TYPE_HEADER
        };
        // If we have pending revalidates, wait until they are all resolved.
        const maybeRevalidatesPromise = (0, _revalidationutils.executeRevalidates)(workStore);
        if (maybeRevalidatesPromise !== false) {
            const revalidatesPromise = maybeRevalidatesPromise.finally(()=>{
                if (process.env.NEXT_PRIVATE_DEBUG_CACHE) {
                    console.log('pending revalidates promise finished for:', url.href);
                }
            });
            if (renderOpts.waitUntil) {
                renderOpts.waitUntil(revalidatesPromise);
            } else {
                options.waitUntil = revalidatesPromise;
            }
        }
        applyMetadataFromPrerenderResult(response, metadata, workStore);
        if (response.renderResumeDataCache) {
            metadata.renderResumeDataCache = response.renderResumeDataCache;
        }
        const streamString = await (0, _streamops.streamToString)(response.stream);
        const result = new _renderresult.default(streamString, options);
        // Run build-time instant validation if the page has instant configs
        // TODO(instant-validation-build): This is not a great place to wire this in.
        if (workStore.cacheComponentsEnabled && workStore.isBuildTimePrerendering && renderOpts.runInstantValidation && await (0, _instantconfig.anySegmentNeedsInstantValidationInBuild)(loaderTree)) {
            // Throws StaticGenBailoutError if validation failed.
            await validateInstantConfigsInBuild(ctx, response.renderResumeDataCache ?? null);
        }
        return result;
    } else {
        // We're rendering dynamically
        const renderResumeDataCache = renderOpts.renderResumeDataCache ?? (postponedState == null ? void 0 : postponedState.renderResumeDataCache) ?? null;
        const rootParams = (0, _createcomponenttree.getRootParams)(loaderTree, ctx.getDynamicParamFromSegment);
        const fallbackParams = (0, _requestmeta.getRequestMeta)(req, 'fallbackParams') || null;
        const hmrRefreshHash = (0, _requestmeta.getRequestMeta)(req, 'hmrRefreshHash');
        const createRequestStore = _requeststore.createRequestStoreForRender.bind(null, req, res, url, rootParams, implicitTags, renderOpts.onUpdateCookies, renderOpts.previewProps, isHmrRefresh, serverComponentsHmrCache, renderResumeDataCache, fallbackParams, hmrRefreshHash);
        const requestStore = createRequestStore();
        if (process.env.__NEXT_DEV_SERVER && setIsrStatus && !cacheComponents && // Only pages using the Node runtime can use ISR, so we only need to
        // update the status for those.
        // The type check here ensures that `req` is correctly typed, and the
        // environment variable check provides dead code elimination.
        process.env.NEXT_RUNTIME !== 'edge' && (0, _helpers.isNodeNextRequest)(req)) {
            req.originalRequest.on('end', ()=>{
                const { pathname } = new URL(req.url || '/', 'http://n');
                const isStatic = !requestStore.usedDynamic && !workStore.forceDynamic;
                setIsrStatus(pathname, isStatic);
            });
        }
        // MARK: RSC request
        if (isRSCRequest) {
            if (isRuntimePrefetchRequest) {
                // MARK: RSC runtimePrefetch
                return generateRuntimePrefetchResult(req, ctx, requestStore, isAppShellPrefetchRequest);
            } else {
                if (process.env.__NEXT_DEV_SERVER && process.env.NEXT_RUNTIME !== 'edge' && cacheComponents) {
                    // MARK: RSC devCacheComponents
                    return generateDynamicFlightRenderResultWithStagesInDev(req, ctx, requestStore, createRequestStore, fallbackParams);
                } else if (cacheComponents && cachedNavigations) {
                    // MARK: RSC cacheComponents
                    return generateStagedDynamicFlightRenderResultNode(req, ctx, requestStore);
                } else {
                    // MARK: RSC dynamic
                    return generateDynamicFlightRenderResult(req, ctx, requestStore);
                }
            }
        }
        let didExecuteServerAction = false;
        let formState = null;
        if (isPossibleActionRequest) {
            // For action requests, we handle them differently with a special render result.
            const actionRequestResult = await (0, _actionhandler.handleAction)({
                req,
                res,
                ComponentMod,
                generateFlight: generateDynamicFlightRenderResult,
                workStore,
                requestStore,
                serverActions,
                ctx,
                metadata
            });
            if (actionRequestResult) {
                if (actionRequestResult.type === 'not-found') {
                    const notFoundLoaderTree = createNotFoundLoaderTree(loaderTree);
                    res.statusCode = 404;
                    metadata.statusCode = 404;
                    const stream = await renderToStream(requestStore, req, res, ctx, notFoundLoaderTree, formState, postponedState, metadata, undefined, fallbackParams);
                    return new _renderresult.default(stream, {
                        metadata,
                        contentType: _constants1.HTML_CONTENT_TYPE_HEADER
                    });
                } else if (actionRequestResult.type === 'done') {
                    if (actionRequestResult.result) {
                        actionRequestResult.result.assignMetadata(metadata);
                        return actionRequestResult.result;
                    } else if (actionRequestResult.formState) {
                        formState = actionRequestResult.formState;
                    }
                }
            }
            didExecuteServerAction = true;
        }
        const options = {
            metadata,
            contentType: _constants1.HTML_CONTENT_TYPE_HEADER
        };
        const stream = await renderToStream(// NOTE: in Cache Components (dev), if the render is restarted, it will use a different requestStore
        // than the one that we're passing in here.
        requestStore, req, res, ctx, loaderTree, formState, postponedState, metadata, // If we're rendering HTML after an action, we don't want restartable-render behavior
        // because the result should be dynamic, like it is in prod.
        // Also, the request store might have been mutated by the action (e.g. enabling draftMode)
        // and we currently we don't copy changes over when creating a new store,
        // so the restarted render wouldn't be correct.
        didExecuteServerAction ? undefined : createRequestStore, fallbackParams);
        // Forward an invalid-dynamic-usage error recorded by `'use cache'` only
        // when userland caught it (try/catch around the cache call). If userland
        // didn't catch, the rejection propagated into the React render, and React's
        // `serverComponentsErrorHandler` already stamped a digest on the error and
        // emitted it as a Flight error chunk — surfacing it again here would
        // duplicate the entry in the dev overlay.
        //
        // The cacheComponents paths forward this themselves via
        // `runValidationInDev` and the validation-skipped fallback in
        // `generateDynamicFlightRenderResultWithStagesInDev`. Here we cover the
        // non-cacheComponents dev path where neither runs.
        if (process.env.__NEXT_DEV_SERVER && !cacheComponents && workStore.invalidDynamicUsageError && !workStore.invalidDynamicUsageError.digest) {
            void logMessagesAndSendErrorsToBrowser([
                workStore.invalidDynamicUsageError
            ], ctx);
        }
        // If we have pending revalidates, wait until they are all resolved.
        const maybeRevalidatesPromise = (0, _revalidationutils.executeRevalidates)(workStore);
        if (maybeRevalidatesPromise !== false) {
            const revalidatesPromise = maybeRevalidatesPromise.finally(()=>{
                if (process.env.NEXT_PRIVATE_DEBUG_CACHE) {
                    console.log('pending revalidates promise finished for:', url.href);
                }
            });
            if (renderOpts.waitUntil) {
                renderOpts.waitUntil(revalidatesPromise);
            } else {
                options.waitUntil = revalidatesPromise;
            }
        }
        // Create the new render result for the response.
        return new _renderresult.default(stream, options);
    }
}
const renderToHTMLOrFlight = (req, res, pagePath, query, fallbackRouteParams, renderOpts, serverComponentsHmrCache, sharedContext)=>{
    var _renderOpts_previewProps;
    if (!req.url) {
        throw Object.defineProperty(new Error('Invalid URL'), "__NEXT_ERROR_CODE", {
            value: "E182",
            enumerable: false,
            configurable: true
        });
    }
    const url = (0, _parserelativeurl.parseRelativeUrl)(req.url, undefined, false);
    // We read these values from the request object as, in certain cases,
    // base-server will strip them to opt into different rendering behavior.
    const parsedRequestHeaders = parseRequestHeaders(req.headers, {
        isRoutePPREnabled: renderOpts.experimental.isRoutePPREnabled === true,
        previewModeId: (_renderOpts_previewProps = renderOpts.previewProps) == null ? void 0 : _renderOpts_previewProps.previewModeId
    });
    const { isPrefetchRequest, previouslyRevalidatedTags, nonce } = parsedRequestHeaders;
    let interpolatedParams;
    let postponedState = null;
    // If provided, the postpone state should be parsed so it can be provided to
    // React.
    if (typeof renderOpts.postponed === 'string') {
        if (fallbackRouteParams) {
            throw Object.defineProperty(new _invarianterror.InvariantError('postponed state should not be provided when fallback params are provided'), "__NEXT_ERROR_CODE", {
                value: "E592",
                enumerable: false,
                configurable: true
            });
        }
        interpolatedParams = (0, _getdynamicparam.interpolateParallelRouteParams)(renderOpts.ComponentMod.routeModule.userland.loaderTree, renderOpts.params ?? {}, pagePath, fallbackRouteParams);
        postponedState = (0, _postponedstate.parsePostponedState)(renderOpts.postponed, interpolatedParams, renderOpts.experimental.maxPostponedStateSizeBytes);
    } else {
        interpolatedParams = (0, _getdynamicparam.interpolateParallelRouteParams)(renderOpts.ComponentMod.routeModule.userland.loaderTree, renderOpts.params ?? {}, pagePath, fallbackRouteParams);
    }
    if ((postponedState == null ? void 0 : postponedState.renderResumeDataCache) && renderOpts.renderResumeDataCache) {
        throw Object.defineProperty(new _invarianterror.InvariantError('postponed state and dev warmup immutable resume data cache should not be provided together'), "__NEXT_ERROR_CODE", {
            value: "E589",
            enumerable: false,
            configurable: true
        });
    }
    const workStore = (0, _workstore.createWorkStore)({
        page: renderOpts.routeModule.definition.page,
        renderOpts,
        // @TODO move to workUnitStore of type Request
        isPrefetchRequest,
        buildId: sharedContext.buildId,
        deploymentId: sharedContext.deploymentId,
        previouslyRevalidatedTags,
        nonce
    });
    return _workasyncstorageexternal.workAsyncStorage.run(workStore, // The function to run
    renderToHTMLOrFlightImpl, // all of it's args
    req, res, url, pagePath, query, renderOpts, workStore, parsedRequestHeaders, postponedState, serverComponentsHmrCache, sharedContext, interpolatedParams, fallbackRouteParams);
};
function applyMetadataFromPrerenderResult(response, metadata, workStore) {
    if (response.collectedTags) {
        metadata.fetchTags = response.collectedTags.join(',');
    }
    // Let the client router know how long to keep the cached entry around.
    const staleHeader = String(response.collectedStale);
    metadata.headers ??= {};
    metadata.headers[_approuterheaders.NEXT_ROUTER_STALE_TIME_HEADER] = staleHeader;
    // If force static is specifically set to false, we should not revalidate
    // the page.
    if (workStore.forceStatic === false || response.collectedRevalidate === 0) {
        metadata.cacheControl = {
            revalidate: 0,
            expire: undefined
        };
    } else {
        // Copy the cache control value onto the render result metadata.
        metadata.cacheControl = {
            revalidate: response.collectedRevalidate >= _constants1.INFINITE_CACHE ? false : response.collectedRevalidate,
            expire: response.collectedExpire >= _constants1.INFINITE_CACHE ? undefined : response.collectedExpire
        };
    }
    // provide bailout info for debugging
    if (metadata.cacheControl.revalidate === 0) {
        metadata.staticBailoutInfo = {
            description: workStore.dynamicUsageDescription,
            stack: workStore.dynamicUsageStack
        };
    }
}
async function renderToStream(requestStore, req, res, ctx, tree, formState, postponedState, metadata, createRequestStore, fallbackParams) {
    /* eslint-disable @next/internal/no-ambiguous-jsx -- React Client */ // MARK: renderToStream setup
    const { assetPrefix, htmlRequestId, nonce, pagePath, renderOpts, requestId, workStore } = ctx;
    const { basePath, buildManifest, ComponentMod: { createElement }, crossOrigin, experimental, isBuildTimePrerendering = false, onInstrumentationRequestError, page, reactMaxHeadersLength, setReactDebugChannel, subresourceIntegrityManifest, supportsDynamicResponse, cacheComponents } = renderOpts;
    const { cachedNavigations } = renderOpts.experimental;
    const { ServerInsertedHTMLProvider, renderServerInsertedHTML } = (0, _serverinsertedhtml.createServerInsertedHTML)();
    const getServerInsertedMetadata = (0, _createserverinsertedmetadata.createServerInsertedMetadata)(nonce);
    const tracingMetadata = (0, _utils1.getTracedMetadata)((0, _tracer.getTracer)().getTracePropagationData(), experimental.clientTraceMetadata);
    const polyfills = buildManifest.polyfillFiles.filter((polyfill)=>polyfill.endsWith('.js') && !polyfill.endsWith('.module.js')).map((polyfill)=>({
            src: `${assetPrefix}/_next/${polyfill}${(0, _getassetquerystring.getAssetQueryString)(ctx, false)}`,
            integrity: subresourceIntegrityManifest == null ? void 0 : subresourceIntegrityManifest[polyfill],
            crossOrigin,
            noModule: true,
            nonce
        }));
    const [preinitScripts, bootstrapScript] = (0, _requiredscripts.getRequiredScripts)(buildManifest, // Why is assetPrefix optional on renderOpts?
    // @TODO make it default empty string on renderOpts and get rid of it from ctx
    assetPrefix, crossOrigin, subresourceIntegrityManifest, (0, _getassetquerystring.getAssetQueryString)(ctx, true), nonce, page);
    // In development mode, set the request ID as a global variable, before the
    // bootstrap script is executed, which depends on it during hydration.
    // For MPA navigations (page reload, direct URL entry), the request ID
    // header is not present, so we generate a random one.
    let bootstrapScriptContent;
    if (process.env.__NEXT_DEV_SERVER) {
        bootstrapScriptContent = `self.__next_r=${JSON.stringify(requestId ?? crypto.randomUUID())}`;
    } else if (buildManifest.pagesChunkGroupBootstrapParams && buildManifest.chunkLoadingGlobal) {
        bootstrapScriptContent = (0, _getpagefiles.getTurbopackChunkGroupBootstrap)(buildManifest.pagesChunkGroupBootstrapParams, buildManifest.chunkLoadingGlobal, [
            page
        ]);
    }
    // Instant Navigation Testing API: embed the cookie-guarded bootstrap so it
    // runs before the client bootstrap module reads self.__next_instant_test as
    // its hydration source. This mirrors the prerender path so a dynamically
    // rendered document carries the same script as the cached static prelude.
    if (ctx.renderOpts.experimental.exposeTestingApi) {
        bootstrapScriptContent = (bootstrapScriptContent ? `${bootstrapScriptContent};` : '') + await (0, _instanttestbootstrap.getInstantTestBootstrapScriptContent)();
    }
    // Create the "render route (app)" span manually so we can keep it open during streaming.
    // This is necessary because errors inside Suspense boundaries are reported asynchronously
    // during stream consumption, after a typical wrapped function would have ended the span.
    // Note: We pass the full span name as the first argument since startSpan uses it directly.
    const renderSpan = (0, _tracer.getTracer)().startSpan(`render route (app) ${pagePath}`, {
        attributes: {
            'next.span_name': `render route (app) ${pagePath}`,
            'next.span_type': _constants.AppRenderSpan.getBodyResult,
            'next.route': pagePath
        }
    });
    // Helper to end the span with error status (used when throwing from catch blocks)
    const endSpanWithError = (err)=>{
        if (!renderSpan.isRecording()) return;
        if (err instanceof Error) {
            renderSpan.recordException(err);
            renderSpan.setAttribute('error.type', err.name);
        }
        renderSpan.setStatus({
            code: _tracer.SpanStatusCode.ERROR,
            message: err instanceof Error ? err.message : undefined
        });
        renderSpan.end();
    };
    // Run the rest of the function within the span's context so child spans
    // (like "build component tree", "generateMetadata") are properly parented.
    return (0, _tracer.getTracer)().withSpan(renderSpan, async ()=>{
        // MARK: renderToStream errorHandlers
        const { reactServerErrorsByDigest } = workStore;
        // We use this to determine if we should suppress other derivative errors
        let didErrorObservably = false;
        function onHTMLRenderRSCError(err, silenceLog) {
            didErrorObservably = true;
            return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, createErrorContext(ctx, 'react-server-components'), silenceLog);
        }
        const serverComponentsErrorHandler = (0, _createerrorhandler.createReactServerErrorHandler)(process.env.NODE_ENV === 'development', isBuildTimePrerendering, reactServerErrorsByDigest, onHTMLRenderRSCError, renderSpan);
        function onHTMLRenderSSRError(err) {
            // We don't need to silence logs here. onHTMLRenderSSRError won't be called
            // at all if the error was logged before in the RSC error handler.
            const silenceLog = false;
            return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, createErrorContext(ctx, 'server-rendering'), silenceLog);
        }
        const allCapturedErrors = [];
        const htmlRendererErrorHandler = (0, _createerrorhandler.createHTMLErrorHandler)(process.env.NODE_ENV === 'development', isBuildTimePrerendering, reactServerErrorsByDigest, allCapturedErrors, onHTMLRenderSSRError, renderSpan);
        let reactServerResult = null;
        let reactDebugStream;
        const setHeader = res.setHeader.bind(res);
        const appendHeader = res.appendHeader.bind(res);
        const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
        try {
            if (process.env.__NEXT_DEV_SERVER && // Edge routes never prerender so we don't have a Prerender environment for anything in edge runtime
            process.env.NEXT_RUNTIME !== 'edge' && // We only have a Prerender environment for projects opted into cacheComponents
            cacheComponents) {
                let debugChannelClientStream;
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const getPayload = async (requestStore)=>{
                    const payload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, getRSCPayload, tree, ctx, {
                        is404: res.statusCode === 404
                    });
                    if (isBypassingCachesInDev(requestStore, workStore)) {
                        // Mark the RSC payload to indicate that caches were bypassed in dev.
                        // This lets the client know not to cache anything based on this render.
                        if (renderOpts.setCacheStatus) {
                            // we know this is available  when cacheComponents is enabled, but typeguard to be safe
                            renderOpts.setCacheStatus('bypass', htmlRequestId);
                        }
                        payload._bypassCachesInDev = createElement(WarnForBypassCachesInDev, {
                            route: workStore.route
                        });
                    }
                    return payload;
                };
                if (// We only do this flow if we can safely recreate the store from scratch
                // (which is not the case for renders after an action)
                createRequestStore && // We only do this flow if we're not bypassing caches in dev using
                // "disable cache" in devtools, a hard refresh (cache-control: "no-cache"),
                // or draft mode.
                !isBypassingCachesInDev(requestStore, workStore)) {
                    const loaderTree = ctx.componentMod.routeModule.userland.loaderTree;
                    const prefetchMode = await getPrefetchingModeForPage(renderOpts, loaderTree);
                    const { stream: serverStream, debugChannel: returnedDebugChannel } = await stagedRenderWithCachesInDev({
                        prefetchMode,
                        ctx,
                        requestStore,
                        createRequestStore,
                        getPayload,
                        onError: serverComponentsErrorHandler,
                        shouldValidate: true,
                        fallbackRouteParams: fallbackParams,
                        getDevRenderDidError: ()=>didErrorObservably,
                        // An initial HTML load serves the static shell; runtime and
                        // dynamic content stream in afterward.
                        navigationKind: {
                            type: 'initial-load'
                        },
                        // We currently only abort HMR refresh requests.
                        requestAbortSignal: undefined
                    });
                    reactServerResult = new _apprenderprerenderutils.ReactServerResult(serverStream);
                    if (returnedDebugChannel) {
                        debugChannelClientStream = new _apprenderprerenderutils.ReplayableNodeStream(returnedDebugChannel.clientSide.readable);
                    }
                } else {
                    logValidationSkipped(ctx);
                    // We're either bypassing caches or we can't restart the render.
                    // Do a dynamic render, but with (basic) environment labels.
                    const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createNodeDebugChannel)();
                    const serverStream = await stagedRenderWithoutCachesInDevNode(ctx, requestStore, getPayload, {
                        onError: serverComponentsErrorHandler,
                        filterStackFrame,
                        debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide
                    });
                    reactServerResult = new _apprenderprerenderutils.ReactServerResult(serverStream);
                    if (debugChannel) {
                        debugChannelClientStream = new _apprenderprerenderutils.ReplayableNodeStream(debugChannel.clientSide.readable);
                    }
                }
                if (debugChannelClientStream && setReactDebugChannel) {
                    reactDebugStream = debugChannelClientStream.createReplayStream();
                    setReactDebugChannel({
                        readable: debugChannelClientStream.createReplayStream()
                    }, htmlRequestId, requestId);
                }
            } else if (cacheComponents && cachedNavigations) {
                // Production Cache Components + Cached Navigations: use staged
                // rendering so the RSC payload includes the static stage byte length
                // (`l` field), enabling the client to cache the static subset during
                // hydration.
                const selectStaleTime = (0, _staletime.createSelectStaleTime)(experimental);
                const staleTimeIterable = new _staletime.StaleTimeIterable();
                const stageController = new _stagedrendering.StagedRenderingController({
                    abortSignal: null,
                    abandonController: null,
                    // TODO(cached-navs): this assumes that we checked during build that there's no sync IO.
                    // but it can happen e.g. after a revalidation or conditionally for a param that wasn't prerendered.
                    // we should change this to track sync IO, log an error and advance to dynamic.
                    syncIO: _stagedrendering.SyncIOMode.Untracked,
                    finalStage: null
                });
                requestStore.stale = _constants1.INFINITE_CACHE;
                requestStore.stagedRendering = stageController;
                requestStore.asyncApiPromises = createAsyncApiPromises(stageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
                requestStore.varyParamsAccumulator = (0, _varyparams.createResponseVaryParamsAccumulator)();
                (0, _staletime.trackStaleTime)(requestStore, staleTimeIterable, selectStaleTime);
                const shellByteLengthDeferred = (0, _promisewithresolvers.createPromiseWithResolvers)();
                const staticStageByteLengthDeferred = (0, _promisewithresolvers.createPromiseWithResolvers)();
                let runtimePrefetchStream;
                // If the route should runtime-cache its navigation, spawn a runtime
                // prerender after the resume render fills caches. The result is
                // embedded in the initial RSC payload so the client can cache
                // runtime-prefetchable content during hydration. This is enabled when
                // Partial Prefetching is on for the route, either per segment (a
                // `prefetch` of 'partial' or 'unstable_eager') or globally (the
                // `partialPrefetching` config).
                if (Boolean(renderOpts.partialPrefetching) || await (0, _instantconfig.anySegmentHasPartialPrefetchingEnabled)(tree)) {
                    const prerenderResumeDataCache = (0, _resumedatacache.createPrerenderResumeDataCache)();
                    requestStore.resumeDataCache = prerenderResumeDataCache;
                    const cacheSignal = new _cachesignal.CacheSignal();
                    (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
                    requestStore.cacheSignal = cacheSignal;
                    const runtimePrefetchTransform = new TransformStream();
                    runtimePrefetchStream = runtimePrefetchTransform.readable;
                    void cacheSignal.cacheReady().then(()=>spawnRuntimePrefetchWithFilledCaches(runtimePrefetchTransform.writable, ctx, prerenderResumeDataCache, requestStore, serverComponentsErrorHandler));
                }
                const RSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, getRSCPayload, tree, ctx, {
                    is404: res.statusCode === 404,
                    staleTimeIterable,
                    shellByteLengthPromise: shellByteLengthDeferred.promise,
                    staticStageByteLengthPromise: staticStageByteLengthDeferred.promise,
                    runtimePrefetchStream
                });
                const flightStream = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
                    stageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
                    const stream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ctx.componentMod, RSCPayload, clientModules, {
                        onError: serverComponentsErrorHandler,
                        filterStackFrame
                    });
                    const replayable = new _apprenderprerenderutils.ReplayableNodeStream(stream);
                    const dynamicStream = replayable.createReplayStream();
                    const staticStream = replayable.createReplayStream();
                    void countShellAndStaticStageBytes(staticStream, stageController).then((byteLengths)=>{
                        staticStageByteLengthDeferred.resolve(byteLengths[_stagedrendering.RenderStage.Static]);
                        shellByteLengthDeferred.resolve(byteLengths[_stagedrendering.RenderStage.ShellStatic]);
                    });
                    return dynamicStream;
                }, ()=>{
                    stageController.advanceStage(_stagedrendering.RenderStage.Static);
                }, ()=>{
                    // This is a separate task that doesn't advance a stage. It forces
                    // draining the immediate queue so that the stale time iterable and vary
                    // params accumulators are flushed before we advance to the dynamic stage.
                    staleTimeIterable.close();
                    if (requestStore.varyParamsAccumulator) {
                        (0, _varyparams.finishAccumulatingVaryParams)(requestStore.varyParamsAccumulator);
                    }
                }, ()=>{
                    stageController.advanceStage(_stagedrendering.RenderStage.Dynamic);
                });
                reactServerResult = new _apprenderprerenderutils.ReactServerResult(flightStream);
            } else {
                // MARK: nodeStreams RSC
                if (process.env.__NEXT_USE_NODE_STREAMS) {
                    // This is a dynamic render. We don't do dynamic tracking because we're not prerendering
                    const RSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, getRSCPayload, tree, ctx, {
                        is404: res.statusCode === 404
                    });
                    const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createNodeDebugChannel)();
                    if (debugChannel) {
                        const [readableSsr, readableBrowser] = (0, _streamops.teeStream)(debugChannel.clientSide.readable);
                        reactDebugStream = readableSsr;
                        setReactDebugChannel({
                            readable: readableBrowser
                        }, htmlRequestId, requestId);
                    }
                    reactServerResult = new _apprenderprerenderutils.ReactServerResult(_workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ctx.componentMod, RSCPayload, clientModules, {
                        filterStackFrame,
                        onError: serverComponentsErrorHandler,
                        debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide
                    }));
                } else {
                    // MARK: webStreams RSC
                    // This is a dynamic render. We don't do dynamic tracking because we're not prerendering
                    const RSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, getRSCPayload, tree, ctx, {
                        is404: res.statusCode === 404
                    });
                    const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createWebDebugChannel)();
                    if (debugChannel) {
                        const [readableSsr, readableBrowser] = (0, _streamops.teeStream)(debugChannel.clientSide.readable);
                        reactDebugStream = readableSsr;
                        setReactDebugChannel({
                            readable: readableBrowser
                        }, htmlRequestId, requestId);
                    }
                    reactServerResult = new _apprenderprerenderutils.ReactServerResult(_workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToWebFlightStream, ctx.componentMod, RSCPayload, clientModules, {
                        filterStackFrame,
                        onError: serverComponentsErrorHandler,
                        debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide
                    }));
                }
            }
            // React doesn't start rendering synchronously but we want the RSC render to have a chance to start
            // before we begin SSR rendering because we want to capture any available preload headers so we tick
            // one task before continuing
            await (0, _scheduler.waitAtLeastOneReactRenderTask)();
            // MARK: nodeStreams HTML
            if (process.env.__NEXT_USE_NODE_STREAMS) {
                // If provided, the postpone state should be parsed as JSON so it can be
                // provided to React.
                if (typeof renderOpts.postponed === 'string') {
                    if ((postponedState == null ? void 0 : postponedState.type) === _postponedstate.DynamicState.DATA) {
                        // We have a complete HTML Document in the prerender but we need to
                        // still include the new server component render because it was not included
                        // in the static prelude.
                        const inlinedDataStream = (0, _streamops.createNodeInlinedDataStream)(reactServerResult.tee(), nonce, formState);
                        // End the span since there's no async rendering in this path
                        if (renderSpan.isRecording()) renderSpan.end();
                        return (0, _streamops.chainStreams)(inlinedDataStream, (0, _streamops.createDocumentClosingStream)());
                    } else if (postponedState) {
                        // We assume we have dynamic HTML requiring a resume render to complete
                        const { postponed, preludeState } = (0, _postponedstate.getPostponedFromState)(postponedState);
                        const resumeAppElement = /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                            reactServerStream: reactServerResult.tee(),
                            reactDebugStream: reactDebugStream,
                            debugEndTime: undefined,
                            preinitScripts: preinitScripts,
                            ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                            nonce: nonce,
                            images: ctx.renderOpts.images
                        });
                        const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                            polyfills,
                            renderServerInsertedHTML,
                            serverCapturedErrors: allCapturedErrors,
                            basePath,
                            tracingMetadata: tracingMetadata
                        });
                        const { stream: htmlStream, allReady } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.resumeToFizzStream, resumeAppElement, postponed, {
                            onError: htmlRendererErrorHandler,
                            nonce
                        });
                        // End the render span only after React completed rendering (including anything inside Suspense boundaries)
                        allReady.finally(()=>{
                            if (renderSpan.isRecording()) renderSpan.end();
                        });
                        return await (0, _streamops.continueDynamicHTMLResumeNode)(htmlStream, {
                            delayDataUntilFirstHtmlChunk: preludeState === _postponedstate.DynamicHTMLPreludeState.Empty,
                            inlinedDataStream: (0, _streamops.createNodeInlinedDataStream)(reactServerResult.consume(), nonce, formState),
                            getServerInsertedHTML,
                            getServerInsertedMetadata,
                            deploymentId: ctx.sharedContext.deploymentId
                        });
                    }
                }
                // This is a regular dynamic render
                const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                    polyfills,
                    renderServerInsertedHTML,
                    serverCapturedErrors: allCapturedErrors,
                    basePath,
                    tracingMetadata: tracingMetadata
                });
                const generateStaticHTML = supportsDynamicResponse !== true;
                const appElement = /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                    reactServerStream: reactServerResult.tee(),
                    // TODO: Pass Node.js debugStream
                    reactDebugStream: reactDebugStream,
                    debugEndTime: undefined,
                    preinitScripts: preinitScripts,
                    ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                    nonce: nonce,
                    images: ctx.renderOpts.images
                });
                const fizzOptions = {
                    onError: htmlRendererErrorHandler,
                    nonce,
                    onHeaders: (headers)=>{
                        for(const key in headers){
                            appendHeader(key, headers[key]);
                        }
                    },
                    maxHeadersLength: reactMaxHeadersLength,
                    bootstrapScriptContent,
                    bootstrapScripts: [
                        bootstrapScript
                    ],
                    formState
                };
                const { stream: htmlStream, allReady } = await (0, _tracer.getTracer)().trace(_constants.AppRenderSpan.renderToNodeFizzStream, ()=>_workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFizzStream, appElement, fizzOptions, {
                        waitForAllReady: generateStaticHTML
                    }));
                // End the render span only after React completed rendering (including anything inside Suspense boundaries)
                allReady.finally(()=>{
                    if (renderSpan.isRecording()) renderSpan.end();
                });
                return await (0, _streamops.continueFizzStream)(htmlStream, {
                    inlinedDataStream: (0, _streamops.createNodeInlinedDataStream)(reactServerResult.consume(), nonce, formState),
                    isStaticGeneration: generateStaticHTML,
                    allReady,
                    deploymentId: ctx.sharedContext.deploymentId,
                    getServerInsertedHTML,
                    getServerInsertedMetadata,
                    validateRootLayout: !!process.env.__NEXT_DEV_SERVER
                });
            } else {
                // MARK: webStreams HTML
                // If provided, the postpone state should be parsed as JSON so it can be
                // provided to React.
                if (typeof renderOpts.postponed === 'string') {
                    if ((postponedState == null ? void 0 : postponedState.type) === _postponedstate.DynamicState.DATA) {
                        // We have a complete HTML Document in the prerender but we need to
                        // still include the new server component render because it was not included
                        // in the static prelude.
                        const inlinedDataStream = (0, _streamops.createWebInlinedDataStream)(reactServerResult.tee(), nonce, formState);
                        // End the span since there's no async rendering in this path
                        if (renderSpan.isRecording()) renderSpan.end();
                        return (0, _streamops.chainStreams)(inlinedDataStream, (0, _streamops.createDocumentClosingStream)());
                    } else if (postponedState) {
                        // We assume we have dynamic HTML requiring a resume render to complete
                        const { postponed, preludeState } = (0, _postponedstate.getPostponedFromState)(postponedState);
                        const resumeAppElement = /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                            reactServerStream: reactServerResult.tee(),
                            reactDebugStream: reactDebugStream,
                            debugEndTime: undefined,
                            preinitScripts: preinitScripts,
                            ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                            nonce: nonce,
                            images: ctx.renderOpts.images
                        });
                        const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                            polyfills,
                            renderServerInsertedHTML,
                            serverCapturedErrors: allCapturedErrors,
                            basePath,
                            tracingMetadata: tracingMetadata
                        });
                        const { stream: htmlStream, allReady } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.resumeToFizzStream, resumeAppElement, postponed, {
                            onError: htmlRendererErrorHandler,
                            nonce
                        });
                        // End the render span only after React completed rendering (including anything inside Suspense boundaries)
                        allReady.finally(()=>{
                            if (renderSpan.isRecording()) renderSpan.end();
                        });
                        return await (0, _streamops.continueDynamicHTMLResumeWeb)(htmlStream, {
                            delayDataUntilFirstHtmlChunk: preludeState === _postponedstate.DynamicHTMLPreludeState.Empty,
                            inlinedDataStream: (0, _streamops.createWebInlinedDataStream)(reactServerResult.consume(), nonce, formState),
                            getServerInsertedHTML,
                            getServerInsertedMetadata,
                            deploymentId: ctx.sharedContext.deploymentId
                        });
                    }
                }
                // This is a regular dynamic render
                const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                    polyfills,
                    renderServerInsertedHTML,
                    serverCapturedErrors: allCapturedErrors,
                    basePath,
                    tracingMetadata: tracingMetadata
                });
                const generateStaticHTML = supportsDynamicResponse !== true;
                const appElement = /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                    reactServerStream: reactServerResult.tee(),
                    reactDebugStream: reactDebugStream,
                    debugEndTime: undefined,
                    preinitScripts: preinitScripts,
                    ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                    nonce: nonce,
                    images: ctx.renderOpts.images
                });
                const fizzOptions = {
                    onError: htmlRendererErrorHandler,
                    nonce,
                    onHeaders: (headers)=>{
                        headers.forEach((value1, key)=>{
                            appendHeader(key, value1);
                        });
                    },
                    maxHeadersLength: reactMaxHeadersLength,
                    bootstrapScriptContent,
                    bootstrapScripts: [
                        bootstrapScript
                    ],
                    formState
                };
                const { stream: htmlStream, allReady } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToWebFizzStream, appElement, fizzOptions);
                // End the render span only after React completed rendering (including anything inside Suspense boundaries)
                allReady.finally(()=>{
                    if (renderSpan.isRecording()) renderSpan.end();
                });
                return await (0, _streamops.continueFizzStream)(htmlStream, {
                    inlinedDataStream: (0, _streamops.createWebInlinedDataStream)(reactServerResult.consume(), nonce, formState),
                    isStaticGeneration: generateStaticHTML,
                    allReady,
                    deploymentId: ctx.sharedContext.deploymentId,
                    getServerInsertedHTML,
                    getServerInsertedMetadata,
                    validateRootLayout: !!process.env.__NEXT_DEV_SERVER
                });
            }
        // MARK: renderToStream errorRecovery
        } catch (err) {
            if ((0, _staticgenerationbailout.isStaticGenBailoutError)(err) || typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' && err.message.includes('https://nextjs.org/docs/advanced-features/static-html-export')) {
                // Ensure that "next dev" prints the red error overlay
                endSpanWithError(err);
                throw err;
            }
            // If a bailout made it to this point, it means it wasn't wrapped inside
            // a suspense boundary.
            const shouldBailoutToCSR = (0, _bailouttocsr.isBailoutToCSRError)(err);
            if (shouldBailoutToCSR) {
                const stack = (0, _formatservererror.getStackWithoutErrorMessage)(err);
                (0, _log.error)(`${err.reason} should be wrapped in a suspense boundary at page "${pagePath}". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout\n${stack}`);
                endSpanWithError(err);
                throw err;
            }
            // MARK: errorRecovery classification
            let errorType;
            if ((0, _httpaccessfallback.isHTTPAccessFallbackError)(err)) {
                res.statusCode = (0, _httpaccessfallback.getAccessFallbackHTTPStatus)(err);
                metadata.statusCode = res.statusCode;
                errorType = (0, _httpaccessfallback.getAccessFallbackErrorTypeByStatus)(res.statusCode);
            } else if ((0, _redirecterror.isRedirectError)(err)) {
                errorType = 'redirect';
                res.statusCode = (0, _redirect.getRedirectStatusCodeFromError)(err);
                metadata.statusCode = res.statusCode;
                const redirectUrl = (0, _addpathprefix.addPathPrefix)((0, _redirect.getURLFromRedirectError)(err), basePath);
                // If there were mutable cookies set, we need to set them on the
                // response.
                const headers = new Headers();
                if ((0, _requestcookies.appendMutableCookies)(headers, requestStore.mutableCookies)) {
                    setHeader('set-cookie', Array.from(headers.values()));
                }
                setHeader('location', redirectUrl);
            } else if (!shouldBailoutToCSR) {
                res.statusCode = 500;
                metadata.statusCode = res.statusCode;
            }
            const [errorPreinitScripts, errorBootstrapScript] = (0, _requiredscripts.getRequiredScripts)(buildManifest, assetPrefix, crossOrigin, subresourceIntegrityManifest, (0, _getassetquerystring.getAssetQueryString)(ctx, false), nonce, _entryconstants.UNDERSCORE_NOT_FOUND_ROUTE_ENTRY);
            let errorBootstrapScriptContent;
            if (process.env.__NEXT_DEV_SERVER) {
                errorBootstrapScriptContent = bootstrapScriptContent;
            } else if (buildManifest.pagesChunkGroupBootstrapParams && buildManifest.chunkLoadingGlobal) {
                errorBootstrapScriptContent = (0, _getpagefiles.getTurbopackChunkGroupBootstrap)(buildManifest.pagesChunkGroupBootstrapParams, buildManifest.chunkLoadingGlobal, [
                    _entryconstants.UNDERSCORE_NOT_FOUND_ROUTE_ENTRY
                ]);
            }
            if (process.env.__NEXT_USE_NODE_STREAMS) {
                // MARK: nodeStreams errorRecovery RSC + HTML
                let errorRSCPayload;
                let errorServerStream;
                try {
                    errorRSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, getErrorRSCPayload, tree, ctx, reactServerErrorsByDigest.has(err.digest) ? null : err, errorType, // Normal error rendering should include the error payload head.
                    true);
                    errorServerStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ctx.componentMod, errorRSCPayload, clientModules, {
                        filterStackFrame,
                        onError: serverComponentsErrorHandler
                    });
                    if (reactServerResult === null) {
                        endSpanWithError(err);
                        throw err;
                    }
                } catch (setupErr) {
                    endSpanWithError(setupErr);
                    throw setupErr;
                }
                try {
                    const generateStaticHTML = supportsDynamicResponse !== true;
                    const { stream: errorHtmlStream, allReady: errorAllReady } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFizzStream, /*#__PURE__*/ (0, _jsxruntime.jsx)(ErrorApp, {
                        reactServerStream: errorServerStream,
                        ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                        preinitScripts: errorPreinitScripts,
                        nonce: nonce,
                        images: ctx.renderOpts.images
                    }), {
                        nonce,
                        bootstrapScriptContent: errorBootstrapScriptContent,
                        bootstrapScripts: [
                            errorBootstrapScript
                        ],
                        formState
                    }, {
                        waitForAllReady: generateStaticHTML
                    });
                    errorAllReady.finally(()=>{
                        if (renderSpan.isRecording()) renderSpan.end();
                    });
                    return await (0, _streamops.continueFizzStream)(errorHtmlStream, {
                        inlinedDataStream: (0, _streamops.createNodeInlinedDataStream)(// This is intentionally using the readable datastream from the
                        // main render rather than the flight data from the error page
                        // render
                        reactServerResult.consume(), nonce, formState),
                        isStaticGeneration: generateStaticHTML,
                        deploymentId: ctx.sharedContext.deploymentId,
                        getServerInsertedHTML: (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                            polyfills,
                            renderServerInsertedHTML,
                            serverCapturedErrors: [],
                            basePath,
                            tracingMetadata: tracingMetadata
                        }),
                        getServerInsertedMetadata,
                        validateRootLayout: !!process.env.__NEXT_DEV_SERVER
                    });
                } catch (finalErr) {
                    if (process.env.__NEXT_DEV_SERVER && (0, _httpaccessfallback.isHTTPAccessFallbackError)(finalErr)) {
                        const { bailOnRootNotFound } = require('../../client/components/dev-root-http-access-fallback-boundary');
                        bailOnRootNotFound();
                    }
                    endSpanWithError(finalErr);
                    throw finalErr;
                }
            } else {
                // MARK: webStreams errorRecovery RSC + HTML
                let errorRSCPayload;
                let errorServerStream;
                try {
                    errorRSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, getErrorRSCPayload, tree, ctx, reactServerErrorsByDigest.has(err.digest) ? null : err, errorType, // Normal error rendering should include the error payload head.
                    true);
                    errorServerStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToWebFlightStream, ctx.componentMod, errorRSCPayload, clientModules, {
                        filterStackFrame,
                        onError: serverComponentsErrorHandler
                    });
                    if (reactServerResult === null) {
                        endSpanWithError(err);
                        throw err;
                    }
                } catch (setupErr) {
                    endSpanWithError(setupErr);
                    throw setupErr;
                }
                try {
                    const generateStaticHTML = supportsDynamicResponse !== true;
                    const { stream: errorHtmlStream, allReady: errorAllReady } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToWebFizzStream, /*#__PURE__*/ (0, _jsxruntime.jsx)(ErrorApp, {
                        reactServerStream: errorServerStream,
                        ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                        preinitScripts: errorPreinitScripts,
                        nonce: nonce,
                        images: ctx.renderOpts.images
                    }), {
                        nonce,
                        bootstrapScriptContent: errorBootstrapScriptContent,
                        bootstrapScripts: [
                            errorBootstrapScript
                        ],
                        formState
                    });
                    errorAllReady.finally(()=>{
                        if (renderSpan.isRecording()) renderSpan.end();
                    });
                    return await (0, _streamops.continueFizzStream)(errorHtmlStream, {
                        inlinedDataStream: (0, _streamops.createWebInlinedDataStream)(// This is intentionally using the readable datastream from the
                        // main render rather than the flight data from the error page
                        // render
                        reactServerResult.consume(), nonce, formState),
                        isStaticGeneration: generateStaticHTML,
                        deploymentId: ctx.sharedContext.deploymentId,
                        getServerInsertedHTML: (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                            polyfills,
                            renderServerInsertedHTML,
                            serverCapturedErrors: [],
                            basePath,
                            tracingMetadata: tracingMetadata
                        }),
                        getServerInsertedMetadata,
                        validateRootLayout: !!process.env.__NEXT_DEV_SERVER
                    });
                } catch (finalErr) {
                    if (process.env.__NEXT_DEV_SERVER && (0, _httpaccessfallback.isHTTPAccessFallbackError)(finalErr)) {
                        const { bailOnRootNotFound } = require('../../client/components/dev-root-http-access-fallback-boundary');
                        bailOnRootNotFound();
                    }
                    endSpanWithError(finalErr);
                    throw finalErr;
                }
            }
        }
    });
/* eslint-enable @next/internal/no-ambiguous-jsx */ }
/**
 * Drops a validation debug channel branch we've decided not to read.
 */ function dropValidationDebugChannel(channel) {
    if (channel instanceof ReadableStream) {
        channel.cancel();
    } else {
        channel == null ? void 0 : channel.destroy();
    }
}
const alreadyForwardedDynamicUsageErrors = new WeakSet();
/**
 * Forwards an `invalidDynamicUsageError` recorded on the work store (e.g. a
 * request API used inside `'use cache'`) to the dev overlay, so client
 * navigations surface the same error as initial HTML loads do via validation.
 *
 * Returns whether an error was present, so callers can skip further validation.
 * That's independent of whether it was forwarded: an error that already carries
 * a digest is not forwarded again (it was emitted into the React render), but
 * it's still present and already shown, so validation should still be skipped.
 */ function forwardInvalidDynamicUsageError(invalidDynamicUsageError, ctx) {
    if (!invalidDynamicUsageError) {
        return false;
    }
    // Forward only if userland caught the rejection. If userland didn't catch,
    // the rejection propagated into the React render and React's
    // `serverComponentsErrorHandler` already stamped a digest on the error and
    // emitted it as a Flight error chunk, so surfacing it again here would
    // duplicate the entry in the dev overlay.
    if (!invalidDynamicUsageError.digest && !alreadyForwardedDynamicUsageErrors.has(invalidDynamicUsageError)) {
        alreadyForwardedDynamicUsageErrors.add(invalidDynamicUsageError);
        void logMessagesAndSendErrorsToBrowser([
            invalidDynamicUsageError
        ], ctx);
    }
    return true;
}
/**
 * Runs Cache Components validation in the background once the response has
 * finished.
 */ function runDevValidationInBackground(prefetchMode, navigationKind, result, requestStore, validationDebugChannel, ctx, fallbackRouteParams, prerenderResumeDataCache, getDevRenderDidError, createRequestStore, getPayload, onError, validationGeneration) {
    const validationAbortSignal = validationGeneration.signal;
    void _consoleasyncstorageexternal.consoleAsyncStorage.run({
        dim: true
    }, async ()=>{
        // Validation is detached diagnostic work, but the renders and error
        // formatting it performs can still monopolize the event loop. Wait until
        // the response has finished so that work cannot delay Flight delivery or
        // the client navigation.
        if ((0, _helpers.isNodeNextResponse)(ctx.res) && !await (0, _waitforresponse.waitForResponseToFinish)(ctx.res.originalResponse)) {
            logValidationAborted(ctx);
            return;
        }
        if (!await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
            logValidationAborted(ctx);
            return;
        }
        return runInstantInsightsWithTracing(ctx, async (runSpan)=>{
            // Read whether the streamed render errored only now that it has fully
            // settled.
            const devRenderDidError = getDevRenderDidError();
            const [instantInputs, staticInputs] = await runSpan(_constants.AppRenderSpan.instantInsightsPrepareValidation, 'Prepare validation inputs', async ()=>{
                const lazyInputs = await prepareValidationInputs(prefetchMode, navigationKind, result, requestStore, validationDebugChannel, ctx, prerenderResumeDataCache, createRequestStore, getPayload, onError, validationAbortSignal);
                // If we need to do multiple renders, do them in parallel.
                // `runValidationInDev` currently needs `instantInputs` eagerly
                // right before using `staticInputs` for static shell validation,
                // so there's no point delaying one of the renders.
                // We bail out (after logging an error during
                // `resolveLazyDevValidationInputs`) if sync IO or invalid dynamic
                // errors happen in either.
                return Promise.all([
                    lazyInputs.instantInputs ? resolveLazyDevValidationInputs(lazyInputs.instantInputs, ctx) : null,
                    resolveLazyDevValidationInputs(lazyInputs.staticInputs, ctx)
                ]);
            });
            if (instantInputs === VALIDATION_BAILOUT || staticInputs === VALIDATION_BAILOUT) {
                return;
            }
            // A newer render may have superseded this work while we prepared the
            // validation inputs above (which can itself render).
            if (validationAbortSignal.aborted) {
                logValidationAborted(ctx);
                return;
            }
            return runSpan(_constants.AppRenderSpan.instantInsightsRunValidation, 'Run validation', async ()=>{
                // Hand the whole validation to the worker when one is installed. It
                // runs on a worker thread (off the main thread), emits its own
                // lifecycle markers, logs code frames on its piped stdio, and
                // returns the overlay Flight bytes for the main thread to forward.
                // The worker is absent when `experimental.devValidationWorker` is
                // false, and validation runs in-process instead.
                const devValidationWorker = (0, _devvalidationworkerglobals.getDevValidationWorker)();
                if (devValidationWorker) {
                    const snapshot = await (0, _devvalidationworkersnapshot.buildDevValidationSnapshot)(ctx, instantInputs, staticInputs, prefetchMode, fallbackRouteParams, devRenderDidError);
                    const chunks = await devValidationWorker(snapshot, validationAbortSignal);
                    // A newer navigation may have superseded this validation while
                    // the worker ran; don't surface stale insights for a page the user
                    // left.
                    if (chunks && !validationAbortSignal.aborted) {
                        const { sendErrorsToBrowser } = ctx.renderOpts;
                        if (!sendErrorsToBrowser) {
                            throw Object.defineProperty(new _invarianterror.InvariantError('Expected `sendErrorsToBrowser` to be defined in renderOpts.'), "__NEXT_ERROR_CODE", {
                                value: "E947",
                                enumerable: false,
                                configurable: true
                            });
                        }
                        sendErrorsToBrowser((0, _streamutils.createNodeStreamFromChunks)(chunks), ctx.htmlRequestId);
                    }
                } else {
                    // In-process path, taken when `experimental.devValidationWorker`
                    // is false or no worker is installed (e.g. during a build).
                    // Validation computes the errors; the caller delivers them to the
                    // dev overlay. `runWithDevValidationLogging` encloses both the
                    // render and the delivery in the test-mode lifecycle markers so
                    // tests that assert the delivered error between
                    // `validation_start` and `validation_end` capture it.
                    await runWithDevValidationLogging(ctx, validationAbortSignal, async ()=>{
                        const validationErrors = await runValidationInDev(prefetchMode, instantInputs, staticInputs, toValidationRenderContext(ctx), fallbackRouteParams, devRenderDidError, validationAbortSignal);
                        if (validationErrors !== undefined && !validationAbortSignal.aborted) {
                            await logMessagesAndSendErrorsToBrowser(validationErrors, ctx);
                        }
                    });
                }
            });
        });
    })// The catch keeps a failed render, or anything thrown inside validation,
    // from surfacing as an unhandled rejection.
    .catch((err)=>{
        // Superseded validation is intentionally torn down. Don't log errors
        // caused by its abort signal.
        if (validationAbortSignal.aborted) {
            return;
        }
        console.error(Object.defineProperty(new _invarianterror.InvariantError('An unexpected error occurred during validation', {
            cause: err
        }), "__NEXT_ERROR_CODE", {
            value: "E1393",
            enumerable: false,
            configurable: true
        }));
    }).finally(()=>validationGeneration.finish());
}
function runInstantInsightsSpan(spanType, spanName, fn) {
    return (0, _localspanrecorder.traceLocalSpan)({
        name: spanName,
        attributes: {
            'next.span_category': 'nextjs',
            'next.span_name': spanName,
            'next.span_type': spanType
        }
    }, fn);
}
function runWithoutInstantInsightsSpan(_spanType, _spanName, fn) {
    return fn();
}
async function runInstantInsightsWithTracing(ctx, fn) {
    if (!(0, _requestinsights.isRequestInsightsEnabled)()) {
        return fn(runWithoutInstantInsightsSpan);
    }
    return (0, _requestinsightsidentity.runWithRequestInsightsIdentity)({
        requestId: ctx.requestId,
        kind: 'instant-insights',
        htmlRequestId: ctx.htmlRequestId,
        url: ctx.url.href
    }, ()=>(0, _localspanrecorder.traceLocalSpan)({
            name: 'Instant Insights',
            parentSpan: null,
            attributes: {
                'next.span_category': 'nextjs',
                'next.span_name': 'Instant Insights',
                'next.span_type': _constants.AppRenderSpan.instantInsights,
                'next.route': ctx.pagePath
            }
        }, ()=>fn(runInstantInsightsSpan)));
}
const VALIDATION_BAILOUT = Symbol('VALIDATION_BAILOUT');
function createLazyDevValidationInputs(create) {
    return createMemoizedThunk(create);
}
function createMemoizedThunk(cb) {
    let cache = null;
    const wrapped = ()=>{
        if (cache === null) {
            cache = {
                value: cb()
            };
        }
        return cache.value;
    };
    return wrapped;
}
async function prepareValidationInputs(prefetchMode, navigationKind, result, requestStore, validationDebugChannel, ctx, prerenderResumeDataCache, createRequestStore, getPayload, onError, validationAbortSignal) {
    // Check if we can re-use the main render for validation.
    let inputsFromNavigation;
    if (!result.hadCacheMiss && !('syncInterruptReason' in result.outcome)) {
        inputsFromNavigation = {
            accumulatedChunks: result.outcome.accumulatedChunks,
            startTime: result.outcome.startTime,
            stageEndTimes: result.outcome.stageEndTimes,
            requestStore,
            debugChannelClient: validationDebugChannel
        };
    } else {
        // Cache miss or sync IO. We can't re-use the main render.
        dropValidationDebugChannel(validationDebugChannel);
        inputsFromNavigation = null;
    }
    if (prefetchMode === 2) {
        return prepareValidationInputsInPartialPrefetching(navigationKind, requestStore, ctx, prerenderResumeDataCache, createRequestStore, getPayload, onError, inputsFromNavigation, validationAbortSignal);
    } else {
        return prepareValidationInputsInLegacyPrefetching(ctx, prerenderResumeDataCache, createRequestStore, getPayload, onError, inputsFromNavigation, validationAbortSignal);
    }
}
async function prepareValidationInputsInPartialPrefetching(navigationKind, requestStore, ctx, prerenderResumeDataCache, createRequestStore, getPayload, onError, inputsFromNavigation, validationAbortSignal) {
    const loaderTree = ctx.componentMod.routeModule.userland.loaderTree;
    const needsInstantValidation = await (0, _instantconfig.anySegmentNeedsInstantValidationInDev)(loaderTree);
    // If we have static params that aren't root params, then the static stages are incompatible
    // between the Static shell and the App Shell, and we can't use the same render for both.
    const areStagesCompatible = !(0, _paramsutils.hasNonRootStaticParams)(ctx.interpolatedParams, requestStore.rootParams, requestStore.fallbackParams);
    const LAZY_FULL_RENDER = createLazyDevValidationInputs(async ()=>{
        const shouldRenderWithAppShell = true;
        const prefetchMode = 2;
        const inputs = await renderWithWarmCachesForValidationInDev(ctx, createRequestStore, getPayload, onError, prerenderResumeDataCache, prefetchMode, shouldRenderWithAppShell, validationAbortSignal);
        if (forwardErrorsFromWarmRender(inputs, ctx)) {
            return VALIDATION_BAILOUT;
        }
        return inputs;
    });
    const LAZY_RUNTIME_PRERENDER = createLazyDevValidationInputs(async ()=>{
        const inputs = await prerenderWithWarmCachesForStaticValidationInDev(ctx, createRequestStore, getPayload, onError, prerenderResumeDataCache, validationAbortSignal);
        if (forwardErrorsFromWarmRender(inputs, ctx)) {
            return VALIDATION_BAILOUT;
        }
        return inputs;
    });
    if (inputsFromNavigation) {
        // We can reuse the main render for at least one of the validation passes.
        if (areStagesCompatible) {
            // Stages are compatible across the static shell and the app shell.
            // We reuse the main render for both.
            const instantInputs = needsInstantValidation ? inputsFromNavigation : null;
            const staticInputs = inputsFromNavigation;
            return {
                instantInputs,
                staticInputs
            };
        }
        // Stages are incompatible across static and instant validation.
        // If this navigation has an accurate app shell, we can use it for instant validation.
        // However, static validation can't use this static stage, so we need to prerender it.
        if (navigationHasAppShell(navigationKind)) {
            const instantInputs = needsInstantValidation ? inputsFromNavigation : null;
            const staticInputs = LAZY_RUNTIME_PRERENDER;
            return {
                instantInputs,
                staticInputs
            };
        }
        // This navigation does not have an accurate app shell, so if we need instant validation, we need to render again.
        // However, this means that it has an accurate static shell, so we can skip prerendering it.
        const instantInputs = needsInstantValidation ? LAZY_FULL_RENDER : null;
        const staticInputs = inputsFromNavigation;
        return {
            instantInputs,
            staticInputs
        };
    }
    // We cannot reuse the main navigation, and need to render again.
    // If stages are compatible and we'll rerender for instant validation,
    // we can reuse the result for static validation.
    const instantInputs = needsInstantValidation ? LAZY_FULL_RENDER : null;
    const staticInputs = areStagesCompatible && instantInputs !== null ? instantInputs : LAZY_RUNTIME_PRERENDER;
    return {
        instantInputs,
        staticInputs
    };
}
async function prepareValidationInputsInLegacyPrefetching(ctx, prerenderResumeDataCache, createRequestStore, getPayload, onError, inputsFromNavigation, validationAbortSignal) {
    const loaderTree = ctx.componentMod.routeModule.userland.loaderTree;
    const needsInstantValidation = await (0, _instantconfig.anySegmentNeedsInstantValidationInDev)(loaderTree);
    // We're not in partialPrefetching, so we can use the same inputs for both
    // instant validation and static shell validation.
    if (inputsFromNavigation) {
        // The main render is reusable.
        const instantInputs = needsInstantValidation ? inputsFromNavigation : null;
        const staticInputs = inputsFromNavigation;
        return {
            instantInputs,
            staticInputs
        };
    }
    const LAZY_FULL_RENDER = createLazyDevValidationInputs(async ()=>{
        const shouldRenderWithAppShell = false;
        const prefetchMode = 1;
        const inputs = await renderWithWarmCachesForValidationInDev(ctx, createRequestStore, getPayload, onError, prerenderResumeDataCache, prefetchMode, shouldRenderWithAppShell, validationAbortSignal);
        if (forwardErrorsFromWarmRender(inputs, ctx)) {
            return VALIDATION_BAILOUT;
        }
        return inputs;
    });
    const LAZY_RUNTIME_PRERENDER = createLazyDevValidationInputs(async ()=>{
        const inputs = await prerenderWithWarmCachesForStaticValidationInDev(ctx, createRequestStore, getPayload, onError, prerenderResumeDataCache, validationAbortSignal);
        if (forwardErrorsFromWarmRender(inputs, ctx)) {
            return VALIDATION_BAILOUT;
        }
        return inputs;
    });
    // If instant validation is needed, we need to perform a full rerender.
    // Otherwise, a prerender is enough.
    if (needsInstantValidation) {
        const instantInputs = LAZY_FULL_RENDER;
        const staticInputs = instantInputs;
        return {
            instantInputs,
            staticInputs
        };
    } else {
        const instantInputs = null;
        const staticInputs = LAZY_RUNTIME_PRERENDER;
        return {
            instantInputs,
            staticInputs
        };
    }
}
async function resolveLazyDevValidationInputs(resolvedOrLazyInputs, ctx) {
    let inputs;
    if (typeof resolvedOrLazyInputs === 'function') {
        const maybeInputs = await resolvedOrLazyInputs();
        if (maybeInputs === VALIDATION_BAILOUT) {
            return maybeInputs;
        }
        inputs = maybeInputs;
    } else {
        inputs = resolvedOrLazyInputs;
    }
    if ('syncInterruptReason' in inputs) {
        await logMessagesAndSendErrorsToBrowser([
            inputs.syncInterruptReason
        ], ctx);
        return VALIDATION_BAILOUT;
    }
    return inputs;
}
function forwardErrorsFromWarmRender(inputs, ctx) {
    if ('syncInterruptReason' in inputs) {
        void logMessagesAndSendErrorsToBrowser([
            inputs.syncInterruptReason
        ], ctx);
        return true;
    }
    // Unlike the cold streamed render, which fills the caches, the warm
    // render reads them back. Reading a `use cache` entry can surface an
    // invalid dynamic usage error that filling can't (e.g. a nested
    // dynamic `use cache` cache life that propagated to a parent with no
    // explicit `cacheLife`). Forward it and skip validation.
    if (forwardInvalidDynamicUsageError(ctx.workStore.invalidDynamicUsageError, ctx)) {
        return true;
    }
    return false;
}
var PrefetchingMode = /*#__PURE__*/ function(PrefetchingMode) {
    PrefetchingMode[PrefetchingMode["LegacySpeculative"] = 1] = "LegacySpeculative";
    PrefetchingMode[PrefetchingMode["Partial"] = 2] = "Partial";
    return PrefetchingMode;
}({});
async function getPrefetchingModeForPage(renderOpts, loaderTree) {
    const debug = process.env.NEXT_PRIVATE_DEBUG_VALIDATION === '1' ? console.log : undefined;
    // TODO(app-shells): support "unstable_eager"
    if (renderOpts.partialPrefetching) {
        debug == null ? void 0 : debug('using prefetching mode Partial because of next.config.js');
        return 2;
    }
    if (await (0, _instantconfig.anySegmentHasPartialPrefetchingEnabled)(loaderTree)) {
        debug == null ? void 0 : debug('using prefetching mode Partial because of segment config');
        return 2;
    }
    debug == null ? void 0 : debug('using prefetching mode LegacySpeculative');
    return 1;
}
function getSyncIOMode(prefetchMode) {
    switch(prefetchMode){
        case 1:
            return _stagedrendering.SyncIOMode.AllowedInRuntimeOrDynamic;
        case 2:
            return _stagedrendering.SyncIOMode.AllowedInDynamic;
    }
}
/**
 * Per-render setup shared by the streaming dev Cache Components renders: a
 * cache signal (so caches fill in the background), a prerender resume data
 * cache, async API promises, and a staged rendering controller, all wired into
 * the request store.
 */ function setUpStagedDevRender(prefetchingMode, navigationKind, requestStore) {
    const shouldRenderWithAppShell = navigationHasAppShell(navigationKind);
    const cacheSignal = new _cachesignal.CacheSignal();
    (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
    const prerenderResumeDataCache = (0, _resumedatacache.createPrerenderResumeDataCache)();
    const stageController = new _stagedrendering.StagedRenderingController({
        abortSignal: null,
        abandonController: null,
        syncIO: getSyncIOMode(prefetchingMode),
        finalStage: null
    });
    requestStore.resumeDataCache = prerenderResumeDataCache;
    requestStore.stagedRendering = stageController;
    requestStore.needsSessionShell = shouldRenderWithAppShell;
    requestStore.asyncApiPromises = createAsyncApiPromises(stageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
    requestStore.cacheSignal = cacheSignal;
    const environmentName = ()=>getEnvironmentNameForStage(stageController.currentStage);
    return {
        cacheSignal,
        prerenderResumeDataCache,
        stageController,
        environmentName
    };
}
function getEnvironmentNameForStage(stage) {
    switch(stage){
        case _stagedrendering.RenderStage.Before:
        case _stagedrendering.RenderStage.ShellStatic:
        case _stagedrendering.RenderStage.Static:
            return 'Prerender';
        case _stagedrendering.RenderStage.ShellRuntime:
        case _stagedrendering.RenderStage.Runtime:
            return 'Prefetch';
        case _stagedrendering.RenderStage.Dynamic:
        case _stagedrendering.RenderStage.Abandoned:
            return 'Server';
        default:
            stage;
            throw Object.defineProperty(new _invarianterror.InvariantError(`Invalid render stage: ${stage}`), "__NEXT_ERROR_CODE", {
                value: "E881",
                enumerable: false,
                configurable: true
            });
    }
}
function navigationHasAppShell(navigationKind) {
    // TODO(app-shells): when we implement `<Link prefetch={true}>/`prefetch = "unstable_eager"` in dev,
    // this might need to be adjusted, because we'll use `Runtime` for the stage
    return navigationKind.type === 'prefetched-client' && navigationKind.prefetchStage === _stagedrendering.RenderStage.ShellRuntime;
}
/**
 * Streams a staged dev render to completion without ever abandoning it, so it
 * streams progressively and fills caches as a side effect. Resolves as soon as
 * the first task creates the stream, handing back the response `stream` and a
 * `result` promise. The `result` settles once the full stream has finished, and
 * reports whether any stage boundary still had pending cache reads (a cold load
 * that streamed Suspense fallbacks for not-yet-cached content), the stage
 * timings, and the accumulated chunks.
 *
 * The chunks are accumulated eagerly because detecting completion requires
 * reading the whole stream anyway; the same accumulation feeds validation when
 * the render turns out to be prod-representative.
 */ async function streamStagedRenderInDev({ ctx, requestStore, rscPayload, stageController, cacheSignal, environmentName, onError, debugChannel, navigationKind, requestAbortSignal }) {
    let holdStreamUntilRevealed;
    let revealAfterStage;
    switch(navigationKind.type){
        case 'initial-load':
            {
                // Hold the stream until the shell content has flushed so the
                // streamed HTML reflects the prerendered HTML shell
                holdStreamUntilRevealed = true;
                revealAfterStage = _stagedrendering.RenderStage.Static;
                break;
            }
        case 'prefetched-client':
            {
                // This stream goes to the browser, which gates revealing the response on
                // the payload's `_revealAfter`, so release it live and let the browser
                // process chunks as they arrive instead of holding it server-side.
                holdStreamUntilRevealed = false;
                revealAfterStage = navigationKind.prefetchStage;
                break;
            }
    }
    const { ComponentMod } = ctx.renderOpts;
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    // The first task creates the stream; `streamReady` carries it (and its chunk
    // accumulation) out of that task into the function body below.
    const streamReady = (0, _promisewithresolvers.createPromiseWithResolvers)();
    // `revealAfter` resolves once the `revealAfterStage` content has flushed (or
    // earlier on a cache miss). When streaming live (a client navigation), it's
    // surfaced through the Flight payload as `_revealAfter`: the client decodes
    // it and defers resolving the response's deferred RSCs on it (see
    // `ppr-navigations`), so a Suspense boundary's children aren't revealed
    // before their row has been decoded, which would flush a premature fallback.
    // React serializes the promise as a pending row whose resolution row is
    // emitted only when we resolve it here, and that row follows the children's
    // row in the payload, so the children are already decoded by the time the
    // client unblocks. The HTML (Fizz) render can't gate like this, so we don't
    // surface the promise on its payload and instead hold the whole stream on
    // `revealAfter` for it (see `holdStreamUntilRevealed` below).
    const revealAfter = (0, _promisewithresolvers.createPromiseWithResolvers)();
    if (!holdStreamUntilRevealed) {
        ;
        rscPayload._revealAfter = revealAfter.promise;
    }
    let startTime = -Infinity;
    // Whether any stage boundary still had pending cache reads (or modules): i.e.
    // the caches weren't filled yet and the render streamed Suspense fallbacks
    // for content that would be cached in production.
    let hadCacheMiss = false;
    // Whether the cold-cache status has already been reported for this render. It
    // is reported at most once, and only for a read that's still pending while a
    // shell stage is flushing (see `checkForCacheMiss`).
    let reportedColdCache = false;
    // Runs at each stage boundary. Latches the running cache-miss verdict and
    // returns it, so a boundary can reveal the shell as soon as a miss is seen
    // (and so dev validation can later tell whether the streamed render is
    // prod-representative). The first miss seen while a shell stage is still
    // flushing also reports the cold-cache status.
    const checkForCacheMiss = ()=>{
        if (cacheSignal.hasPendingReads()) {
            hadCacheMiss = true;
            // The cold-cache indicator reflects the shell only. A cache read still
            // pending while a shell stage flushes (`currentStage <=
            // revealAfterStage`, using the ordered `RenderStage` values) is part of
            // the shell that production serves instantly, so a cold cache there is
            // worth surfacing and we show the indicator. A cache miss after the shell
            // stage is runtime or dynamic content that production reads/fills during
            // the resume at runtime, so a cold cache there is expected and must not
            // show the indicator.
            if (!reportedColdCache && stageController.currentStage <= revealAfterStage) {
                // First in-shell cache miss this render: tell the dev overlay we're
                // streaming with a cold cache now. The per-load `'ready'` reset clears
                // it again on the next load.
                ctx.renderOpts.setCacheStatus == null ? void 0 : ctx.renderOpts.setCacheStatus.call(ctx.renderOpts, 'cold', ctx.htmlRequestId);
                reportedColdCache = true;
            }
        }
        return hadCacheMiss;
    };
    const checkCacheMissAndAdvance = (stage)=>{
        if (checkForCacheMiss()) {
            revealAfter.resolve();
        }
        stageController.advanceStage(stage);
    };
    const checkReveal = (stage)=>{
        if (checkForCacheMiss() || revealAfterStage === stage) {
            revealAfter.resolve();
        }
    };
    const stagesAdvanced = (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        startTime = performance.now() + performance.timeOrigin;
        const replayable = new _apprenderprerenderutils.ReplayableNodeStream(_workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ComponentMod, rscPayload, clientModules, {
            onError,
            environmentName,
            startTime,
            filterStackFrame,
            debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide,
            signal: requestAbortSignal
        }));
        streamReady.resolve({
            stream: replayable.createReplayStream(),
            accumulatedChunksPromise: accumulateStreamChunks(replayable.createReplayStream(), stageController, // Abort accumulation as soon as the signal aborts instead of waiting
            // for the stream to close.
            requestAbortSignal ?? null)
        });
    }, ()=>checkCacheMissAndAdvance(_stagedrendering.RenderStage.Static), ()=>checkReveal(_stagedrendering.RenderStage.Static), ()=>checkCacheMissAndAdvance(_stagedrendering.RenderStage.ShellRuntime), ()=>checkReveal(_stagedrendering.RenderStage.ShellRuntime), ()=>checkCacheMissAndAdvance(_stagedrendering.RenderStage.Runtime), ()=>checkReveal(_stagedrendering.RenderStage.Runtime), ()=>{
        // Advance to the dynamic stage even while caches are still filling, so
        // dynamic content streams to the browser right away instead of being
        // withheld until the slowest cache fill completes. Streaming that content
        // promptly is the whole point of the streaming dev render.
        //
        // The tradeoff is that dev no longer detects a `'use cache'` deadlock: a
        // cache whose fill depends on Dynamic-stage IO used to be held here until
        // it hit the fill timeout, but advancing now unblocks that IO so the
        // cache fills instead. That detection only served to debug a build-time
        // deadlock from within dev, and the streaming render no longer blocks the
        // page on the fill, so we accept losing it here.
        // TODO: Surface `'use cache'` deadlocks at build time instead, e.g. via
        // `next build --debug-prerender`, so they can still be diagnosed.
        stageController.advanceStage(_stagedrendering.RenderStage.Dynamic);
    });
    // If a task throws before the stream is created, surface it to the awaiter
    // below via `streamReady`. Resolve (not reject) `revealAfter` so the client
    // consumers that gate on the payload's `_revealAfter` unblock rather than
    // seeing a rejection; the actual error still surfaces through the stream.
    stagesAdvanced.catch((err)=>{
        streamReady.reject(err);
        revealAfter.resolve();
    });
    const { stream, accumulatedChunksPromise } = await streamReady.promise;
    // For the HTML (Fizz) render, hold the stream until the shell-stage content
    // has flushed (or until a cache miss reveals early) so the HTML reflects the
    // prerendered shell that production streams rather than a premature fallback.
    // The `_revealAfter` gate is client-side and doesn't apply to this render,
    // which consumes the payload directly and would otherwise stream a boundary's
    // fallback before its content arrived. A client navigation doesn't need the
    // hold: it gates revealing the response on `_revealAfter` (whose resolution
    // row follows the children's row in the stream), so we release the stream to
    // it live and let the browser process chunks as they arrive instead of
    // holding it server-side.
    if (holdStreamUntilRevealed) {
        await revealAfter.promise;
    }
    // Advancing the stages only drives the pipeline forward; the render isn't
    // actually complete until its stream has fully finished. The accumulation
    // resolves at that point, so the result is read only once both it and the
    // stages have settled (a late `syncInterruptReason` or
    // `invalidDynamicUsageError` isn't final until the last stage has streamed).
    const resultPromise = Promise.all([
        stagesAdvanced,
        accumulatedChunksPromise
    ]).then(([, accumulatedChunks])=>{
        const syncInterruptReason = stageController.getSyncInterruptReason();
        return {
            hadCacheMiss,
            outcome: syncInterruptReason ? {
                syncInterruptReason
            } : {
                startTime,
                stageEndTimes: getStageEndTimes(stageController),
                accumulatedChunks
            }
        };
    });
    return {
        stream,
        resultPromise
    };
}
function getStageEndTimes(stageController) {
    return {
        [_stagedrendering.RenderStage.Static]: stageController.getStageEndTime(_stagedrendering.RenderStage.Static),
        [_stagedrendering.RenderStage.ShellRuntime]: stageController.getStageEndTime(_stagedrendering.RenderStage.ShellRuntime),
        [_stagedrendering.RenderStage.Runtime]: stageController.getStageEndTime(_stagedrendering.RenderStage.Runtime)
    };
}
async function renderWithWarmCachesForValidationInDev(ctx, createRequestStore, getPayload, onError, prerenderResumeDataCache, prefetchMode, shouldRenderWithAppShell, validationAbortSignal) {
    const { ComponentMod, setReactDebugChannel } = ctx.renderOpts;
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    const stageController = new _stagedrendering.StagedRenderingController({
        abortSignal: null,
        abandonController: null,
        syncIO: getSyncIOMode(prefetchMode),
        finalStage: null
    });
    const requestStore = createRequestStore();
    requestStore.resumeDataCache = (0, _resumedatacache.createRenderResumeDataCache)(prerenderResumeDataCache);
    requestStore.stagedRendering = stageController;
    requestStore.needsSessionShell = shouldRenderWithAppShell;
    requestStore.cacheSignal = null;
    requestStore.asyncApiPromises = createAsyncApiPromises(stageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
    const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createNodeDebugChannel)();
    const environmentName = ()=>getEnvironmentNameForStage(stageController.currentStage);
    const rscPayload = await getPayload(requestStore);
    let startTime = -Infinity;
    const accumulatedChunks = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        startTime = performance.now() + performance.timeOrigin;
        const sourceStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ComponentMod, rscPayload, clientModules, {
            onError,
            environmentName,
            startTime,
            filterStackFrame,
            debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide,
            signal: validationAbortSignal
        });
        return accumulateStreamChunks(sourceStream, stageController, validationAbortSignal);
    }, ()=>stageController.advanceStage(_stagedrendering.RenderStage.Static), ()=>stageController.advanceStage(_stagedrendering.RenderStage.ShellRuntime), ()=>stageController.advanceStage(_stagedrendering.RenderStage.Runtime), ()=>stageController.advanceStage(_stagedrendering.RenderStage.Dynamic));
    const syncInterruptReason = stageController.getSyncInterruptReason();
    if (syncInterruptReason) {
        // Sync IO interrupted the render, so it won't be validated. Drop the debug
        // channel now and return only the interrupt reason: nothing downstream
        // reads the request store or chunks of an interrupted render.
        dropValidationDebugChannel(debugChannel == null ? void 0 : debugChannel.clientSide.readable);
        return {
            syncInterruptReason
        };
    }
    return {
        accumulatedChunks,
        startTime,
        stageEndTimes: getStageEndTimes(stageController),
        requestStore,
        debugChannelClient: debugChannel == null ? void 0 : debugChannel.clientSide.readable
    };
}
async function prerenderWithWarmCachesForStaticValidationInDev(ctx, createRequestStore, getPayload, onError, prerenderResumeDataCache, validationAbortSignal) {
    // This function is currently only used in partialPrefetching.
    const prefetchMode = 2;
    const { ComponentMod, setReactDebugChannel } = ctx.renderOpts;
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    // This render is for validation only, and won't be shown to the user,
    // so we're only rendering until the runtime stage
    // (we need static chunks and runtime chunks for discriminated errors)
    const finalReactController = new AbortController();
    const finalDataController = new AbortController();
    abortWhenSignalAborts(validationAbortSignal, finalReactController);
    const stageController = new _stagedrendering.StagedRenderingController({
        abortSignal: finalDataController.signal,
        abandonController: null,
        syncIO: getSyncIOMode(prefetchMode),
        finalStage: _stagedrendering.RenderStage.Runtime
    });
    const requestStore = createRequestStore();
    requestStore.resumeDataCache = (0, _resumedatacache.createRenderResumeDataCache)(prerenderResumeDataCache);
    requestStore.stagedRendering = stageController;
    requestStore.needsSessionShell = false;
    requestStore.cacheSignal = null;
    requestStore.asyncApiPromises = createAsyncApiPromises(stageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
    // We abort upon reaching the runtime stage or on Sync IO.
    // If sync IO occurs in a place where it's not allowed, then we have to fail validation,
    // and we can abort the render immediately, without waiting for anything else..
    requestStore.controller = finalReactController;
    requestStore.renderSignal = finalDataController.signal;
    const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createNodeDebugChannel)();
    const environmentName = ()=>getEnvironmentNameForStage(stageController.currentStage);
    const rscPayload = await getPayload(requestStore);
    let startTime = -Infinity;
    const collectedChunksByStage = createStageChunksAccumulator();
    const collectChunk = (chunk)=>{
        // We abort the render before the dynamic stage.
        // If we aborted, save the errored chunks as if they were emitted
        // in the dynamic stage so that we can late-release them for debug info.
        const stage = finalReactController.signal.aborted ? _stagedrendering.RenderStage.Dynamic : stageController.currentStage;
        collectStageChunk(collectedChunksByStage, stage, chunk);
    };
    await (0, _apprenderrenderutils.runInSequentialTasks)(async ()=>{
        stageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        startTime = performance.now() + performance.timeOrigin;
        const sourceStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, _streamops.renderToNodeFlightStream, ComponentMod, rscPayload, clientModules, {
            onError,
            environmentName,
            startTime,
            filterStackFrame,
            debugChannel: debugChannel == null ? void 0 : debugChannel.serverSide
        });
        // Only reject hanging promises after react finished aborting.
        abortWhenSignalAborts(finalReactController.signal, finalDataController);
        // Note: this await will only resolve after the last task (unless sync IO aborts the render earlier)
        await iterateStreamingPrerenderChunks(sourceStream, finalReactController.signal, collectChunk);
    }, ()=>stageController.advanceStage(_stagedrendering.RenderStage.Static), ()=>stageController.advanceStage(_stagedrendering.RenderStage.ShellRuntime), ()=>stageController.advanceStage(_stagedrendering.RenderStage.Runtime), ()=>{
        // Do not advance to the dynamic stage, abort instead.
        abortInRenderContext(requestStore, finalReactController);
    });
    const syncInterruptReason = stageController.getSyncInterruptReason();
    if (syncInterruptReason) {
        // Sync IO interrupted the render, so it won't be validated. Drop the debug
        // channel now and return only the interrupt reason: nothing downstream
        // reads the request store or chunks of an interrupted render.
        dropValidationDebugChannel(debugChannel == null ? void 0 : debugChannel.clientSide.readable);
        return {
            syncInterruptReason
        };
    }
    return {
        accumulatedChunks: collectedChunksByStage,
        startTime,
        stageEndTimes: getStageEndTimes(stageController),
        requestStore,
        debugChannelClient: debugChannel == null ? void 0 : debugChannel.clientSide.readable
    };
}
/** When the source signal aborts, abort the controller with its reason. */ function abortWhenSignalAborts(signal, controller) {
    if (signal.aborted) {
        controller.abort(signal.reason);
        return;
    }
    signal.addEventListener('abort', ()=>controller.abort(signal.reason), ABORT_ONCE);
}
const ABORT_ONCE = {
    once: true
};
/** Make sure that any userspace code that might run during abort has access
 * to the workUnitStore that it was rendered in.
 * This is mostly relevant to Fizz where a component suspended on a hanging use()
 * might get rerendered during an abort for debug info reasons, but we defensively
 * also do it in Flight just in case.
 * x-ref: https://github.com/vercel/next.js/pull/94436
 * */ function abortInRenderContext(workUnitStore, controller, reason) {
    if (controller.signal.aborted) {
        return;
    }
    _workunitasyncstorageexternal.workUnitAsyncStorage.run(workUnitStore, reason ? controller.abort.bind(controller, reason) : controller.abort.bind(controller));
}
/**
 * Sets up and streams a dev Cache Components render. Streams immediately and
 * fills caches as a side effect, then runs a background follow-up once the
 * render finishes. When `shouldValidate`, it spawns Cache Components validation
 * (against the streamed render directly when it's prod-representative,
 * otherwise against a separate warm-cache render); otherwise it just forwards
 * any recorded invalid dynamic usage error to the dev overlay.
 */ async function stagedRenderWithCachesInDev({ prefetchMode, ctx, requestStore, createRequestStore, getPayload, onError, shouldValidate, fallbackRouteParams, getDevRenderDidError, navigationKind, requestAbortSignal }) {
    const validationGeneration = shouldValidate ? (0, _devvalidationscheduler.beginDevValidation)(ctx.htmlRequestId) : undefined;
    try {
        const { setReactDebugChannel } = ctx.renderOpts;
        const { cacheSignal, prerenderResumeDataCache, stageController, environmentName } = setUpStagedDevRender(prefetchMode, navigationKind, requestStore);
        let validationDebugChannel;
        const debugChannel = setReactDebugChannel && (0, _debugchannelserver.createNodeDebugChannel)();
        if (validationGeneration !== undefined && debugChannel) {
            const debugChannelReplay = new _apprenderprerenderutils.ReplayableNodeStream(debugChannel.clientSide.readable);
            debugChannel.clientSide.readable = debugChannelReplay.createReplayStream();
            validationDebugChannel = debugChannelReplay.createReplayStream();
        }
        // The stage controller starts in the `Before` stage, where sync IO doesn't
        // abort, so it's fine if it happens while creating the payload.
        const rscPayload = await getPayload(requestStore);
        const { stream, resultPromise } = await streamStagedRenderInDev({
            prefetchMode,
            ctx,
            requestStore,
            rscPayload,
            stageController,
            cacheSignal,
            environmentName,
            onError,
            debugChannel,
            navigationKind,
            requestAbortSignal
        });
        if (validationGeneration === undefined) {
            logValidationSkipped(ctx);
        }
        // The render may record an invalid dynamic usage error (e.g. a request API
        // used inside `'use cache'`). A cache-miss render records it while filling,
        // so the verdict isn't final until the fills settle. Once the render has
        // settled, forward any such error to the dev overlay: it's a real error
        // from the render the user received, so it surfaces whether or not the
        // route validates. When there is one the render isn't prod-representative,
        // so validating it is pointless and we skip it; otherwise validation runs
        // in the background (deferred there until the response has finished).
        void resultPromise.then(async (result)=>{
            if (result.hadCacheMiss) {
                await cacheSignal.cacheReady();
            }
            const hadInvalidDynamicUsage = forwardInvalidDynamicUsageError(ctx.workStore.invalidDynamicUsageError, ctx);
            if (validationGeneration === undefined) {
                return;
            }
            if (hadInvalidDynamicUsage || validationGeneration.signal.aborted) {
                if (validationGeneration.signal.aborted) {
                    logValidationAborted(ctx);
                }
                validationGeneration.finish();
                return;
            }
            runDevValidationInBackground(prefetchMode, navigationKind, result, requestStore, validationDebugChannel, ctx, fallbackRouteParams, prerenderResumeDataCache, getDevRenderDidError, createRequestStore, getPayload, onError, validationGeneration);
        }, ()=>{
            // The render itself rejected; there's nothing to forward or validate.
            validationGeneration == null ? void 0 : validationGeneration.finish();
        });
        return {
            stream,
            debugChannel
        };
    } catch (err) {
        validationGeneration == null ? void 0 : validationGeneration.finish();
        throw err;
    }
}
function createStageChunksAccumulator() {
    return {
        shellStaticChunks: [],
        staticChunks: [],
        shellRuntimeChunks: [],
        runtimeChunks: [],
        dynamicChunks: []
    };
}
async function accumulateStreamChunks(stream, stageController, signal) {
    const accumulator = createStageChunksAccumulator();
    await accumulateStreamChunksInto(accumulator, stream, stageController, signal);
    return accumulator;
}
async function accumulateStreamChunksInto(accumulator, stream, stageController, signal) {
    if (stream instanceof ReadableStream) {
        const reader = stream.getReader();
        let cancelled = false;
        function cancel() {
            if (!cancelled) {
                cancelled = true;
                reader.cancel();
            }
        }
        if (signal) {
            signal.addEventListener('abort', cancel, {
                once: true
            });
        }
        try {
            while(!cancelled){
                const { done, value: value1 } = await reader.read();
                if (done || cancelled) {
                    cancel();
                    break;
                }
                collectStageChunk(accumulator, stageController.currentStage, value1);
            }
        } catch (err) {
            // When we cancel the reader we may reject the read.
            // Only swallow errors caused by our intentional cancel();
            // re-throw unexpected errors to avoid silently returning partial data.
            if (!cancelled) {
                throw err;
            }
        }
    } else {
        const nodeStream = stream;
        let cancelled = false;
        function cancel1() {
            if (!cancelled) {
                cancelled = true;
                nodeStream.destroy();
            }
        }
        if (signal) {
            signal.addEventListener('abort', cancel1, {
                once: true
            });
        }
        try {
            for await (const value1 of nodeStream){
                if (cancelled) break;
                collectStageChunk(accumulator, stageController.currentStage, value1);
            }
        } catch (err) {
            if (!cancelled) {
                throw err;
            }
        }
    }
}
function collectStageChunk(accumulator, stage, value1) {
    switch(stage){
        case _stagedrendering.RenderStage.Before:
            throw Object.defineProperty(new _invarianterror.InvariantError('Unexpected stream chunk while in Before stage'), "__NEXT_ERROR_CODE", {
                value: "E942",
                enumerable: false,
                configurable: true
            });
        case _stagedrendering.RenderStage.ShellStatic:
            accumulator.shellStaticChunks.push(value1);
        // fall through
        case _stagedrendering.RenderStage.Static:
            accumulator.staticChunks.push(value1);
        // fall through
        case _stagedrendering.RenderStage.ShellRuntime:
            accumulator.shellRuntimeChunks.push(value1);
        // fall through
        case _stagedrendering.RenderStage.Runtime:
            accumulator.runtimeChunks.push(value1);
        // fall through
        case _stagedrendering.RenderStage.Dynamic:
            accumulator.dynamicChunks.push(value1);
            break;
        case _stagedrendering.RenderStage.Abandoned:
            break;
        default:
            stage;
            break;
    }
}
async function countShellAndStaticStageBytes(stream, stageController) {
    const byteLengths = createStageByteLengths();
    // Abort the signal whenever we advance to the stage after static.
    const abortController = new AbortController();
    const endStage = (0, _stagedrendering.getNextStage)(_stagedrendering.RenderStage.Static);
    stageController.onStage(endStage, abortController.abort.bind(abortController));
    await countStageBytesUntilAbortNode(byteLengths, stream, stageController, abortController.signal);
    return byteLengths;
}
function createStageByteLengths() {
    const result = {};
    for (const stage of _stagedrendering.RENDER_STAGE_ADVANCE_ORDER){
        result[stage] = 0;
    }
    return result;
}
async function countStageBytesUntilAbortNode(byteLengths, stream, stageController, abortSignal) {
    let cancelled = false;
    abortSignal.addEventListener('abort', ()=>{
        cancelled = true;
        stream.destroy();
    }, {
        once: true
    });
    try {
        for await (const value1 of stream){
            if (cancelled) break;
            increaseChunkByteLengths(byteLengths, stageController.currentStage, value1.byteLength);
        }
    } catch (err) {
        if (!cancelled) {
            throw err;
        }
    }
}
function increaseChunkByteLengths(byteLengths, currentStage, length) {
    if (!(0, _stagedrendering.isAdvanceableRenderStage)(currentStage)) {
        return;
    }
    // Later stages include earlier stages, so we increment
    // the byte count for all that are `>= currentStage`.
    // Iterate in reverse so we don't have to skip the earlier ones.
    for(let i = _stagedrendering.RENDER_STAGE_ADVANCE_ORDER.length - 1; i >= 0; i--){
        const stage = _stagedrendering.RENDER_STAGE_ADVANCE_ORDER[i];
        if (stage < currentStage) {
            break;
        }
        byteLengths[stage] += length;
    }
}
function createAsyncApiPromises(stagedRendering, cookies, mutableCookies, headers) {
    // NOTE: Must be kept in sync with cookies.ts, headers.ts, params.ts, search-params.ts
    const cookiesStage = _dynamicrenderingutils.RENDER_STAGES_BY_DATA_KIND.sessionData;
    const headersStage = _dynamicrenderingutils.RENDER_STAGES_BY_DATA_KIND.sessionData;
    const paramsStage = _dynamicrenderingutils.RENDER_STAGES_BY_DATA_KIND.runtimeLinkData;
    const searchParamsStage = _dynamicrenderingutils.RENDER_STAGES_BY_DATA_KIND.runtimeLinkData;
    return {
        cookies: stagedRendering.delayUntilStage(cookiesStage, 'cookies', cookies),
        mutableCookies: stagedRendering.delayUntilStage(cookiesStage, 'cookies', mutableCookies),
        headers: stagedRendering.delayUntilStage(headersStage, 'headers', headers),
        // These are not used directly, but we chain other `params`/`searchParams` promises off of them.
        sharedParamsParent: stagedRendering.delayUntilStage(paramsStage, undefined, '<internal params>'),
        sharedSearchParamsParent: stagedRendering.delayUntilStage(searchParamsStage, undefined, '<internal searchParams>'),
        connection: stagedRendering.delayUntilStage(_stagedrendering.RenderStage.Dynamic, 'connection', undefined),
        io: stagedRendering.delayUntilStage(_stagedrendering.RenderStage.Dynamic, 'io', undefined)
    };
}
/**
 * Logs the given messages, and sends the error instances to the browser as an
 * RSC stream, where they can be deserialized and logged (or otherwise presented
 * in the devtools), while leveraging React's capabilities to not only
 * source-map the stack frames (via findSourceMapURL), but also create virtual
 * server modules that allow users to inspect the server source code in the
 * browser.
 */ async function logMessagesAndSendErrorsToBrowser(messages, ctx) {
    const { htmlRequestId, renderOpts } = ctx;
    const { sendErrorsToBrowser } = renderOpts;
    const errors = [];
    for (const message of messages){
        // Log the error to the CLI. Prevent the logs from being dimmed, which we
        // apply for other logs during the spawned validation.
        _consoleasyncstorageexternal.consoleAsyncStorage.exit(()=>{
            console.error(message);
        });
        // Error instances are also sent to the browser. We're currently using a
        // non-Error message only in debug build mode as a message that is only
        // meant for the CLI. FIXME: This is a bit spooky action at a distance. We
        // should maybe have a more explicit way of determining which messages
        // should be sent to the browser. Regardless, only real errors with a proper
        // stack make sense to be "replayed" in the browser.
        if (message instanceof Error) {
            errors.push(message);
        }
    }
    if (errors.length > 0) {
        if (!sendErrorsToBrowser) {
            throw Object.defineProperty(new _invarianterror.InvariantError('Expected `sendErrorsToBrowser` to be defined in renderOpts.'), "__NEXT_ERROR_CODE", {
                value: "E947",
                enumerable: false,
                configurable: true
            });
        }
        // Build a Map of error → error code for errors that have one.
        // React doesn't revive __NEXT_ERROR_CODE during RSC deserialization, so we
        // send it as a side-channel Map. RSC preserves object identity, so the
        // deserialized Map keys will reference the same Error objects.
        const errorCodes = new Map();
        for (const err of errors){
            const code = (0, _errortelemetryutils.extractNextErrorCode)(err);
            if (code !== undefined) {
                errorCodes.set(err, code);
            }
        }
        const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
        let errorsFlightStream;
        if (process.env.__NEXT_USE_NODE_STREAMS) {
            errorsFlightStream = (0, _streamops.renderToNodeFlightStream)(ctx.componentMod, {
                errors,
                errorCodes
            }, clientModules, {
                filterStackFrame
            });
        } else {
            errorsFlightStream = (0, _streamops.renderToWebFlightStream)(ctx.componentMod, {
                errors,
                errorCodes
            }, clientModules, {
                filterStackFrame
            });
        }
        sendErrorsToBrowser(errorsFlightStream, htmlRequestId);
    }
}
function logValidationSkipped(ctx) {
    if (process.env.__NEXT_TEST_MODE && process.env.NEXT_TEST_LOG_VALIDATION) {
        const requestId = ctx.requestId;
        const url = ctx.url.href;
        console.log((0, _devvalidationevents.formatValidationEvent)({
            type: 'validation_start',
            requestId,
            url
        }));
        console.log((0, _devvalidationevents.formatValidationEvent)({
            type: 'validation_end',
            requestId,
            url
        }));
    }
}
function logValidationAborted(ctx) {
    if (process.env.__NEXT_TEST_MODE && process.env.NEXT_TEST_LOG_VALIDATION) {
        const requestId = ctx.requestId;
        const url = ctx.url.href;
        console.log((0, _devvalidationevents.formatValidationEvent)({
            type: 'validation_aborted',
            requestId,
            url
        }));
    }
}
/**
 * Runs a dev validation `run` callback (the render plus the error delivery),
 * enclosing it in the `validation_start` / `validation_end` /
 * `validation_aborted` lifecycle markers that E2E tests read from the CLI
 * output. The markers must enclose delivery as well as the render, so tests
 * that assert the error between the markers capture it. Also applies the
 * `NEXT_TEST_DEV_VALIDATION_DELAY_MS` hook that keeps validation in flight for
 * scheduler tests. All of this is test-mode only; otherwise `run` is invoked
 * directly.
 */ async function runWithDevValidationLogging(ctx, validationAbortSignal, run) {
    if (!(process.env.__NEXT_TEST_MODE && process.env.NEXT_TEST_LOG_VALIDATION)) {
        return run();
    }
    const requestId = ctx.requestId;
    const url = ctx.url.href;
    const responseFinished = !(0, _helpers.isNodeNextResponse)(ctx.res) || ctx.res.originalResponse.writableFinished;
    console.log((0, _devvalidationevents.formatValidationEvent)({
        type: 'validation_start',
        requestId,
        url,
        responseFinished
    }));
    try {
        // Keep validation in flight for scheduler E2E tests without relying on
        // timing-sensitive user code. Aborts end the delay immediately.
        const validationDelay = Number(process.env.NEXT_TEST_DEV_VALIDATION_DELAY_MS);
        if (Number.isFinite(validationDelay) && validationDelay > 0 && !validationAbortSignal.aborted) {
            await new Promise((resolve)=>{
                let timeout;
                const finishDelay = ()=>{
                    clearTimeout(timeout);
                    validationAbortSignal.removeEventListener('abort', finishDelay);
                    resolve();
                };
                timeout = setTimeout(finishDelay, validationDelay);
                validationAbortSignal.addEventListener('abort', finishDelay, {
                    once: true
                });
            });
        }
        if (!validationAbortSignal.aborted) {
            await run();
        }
    } finally{
        if (validationAbortSignal.aborted) {
            logValidationAborted(ctx);
        } else {
            console.log((0, _devvalidationevents.formatValidationEvent)({
                type: 'validation_end',
                requestId,
                url
            }));
        }
    }
}
function toValidationRenderContext(ctx) {
    return {
        componentMod: ctx.componentMod,
        getDynamicParamFromSegment: ctx.getDynamicParamFromSegment,
        query: ctx.query,
        implicitTags: ctx.implicitTags,
        nonce: ctx.nonce,
        workStore: ctx.workStore,
        renderOpts: {
            images: ctx.renderOpts.images,
            allowEmptyStaticShell: ctx.renderOpts.allowEmptyStaticShell
        },
        isDebugChannelEnabled: !!ctx.renderOpts.setReactDebugChannel
    };
}
/**
 * Rebuilds the `WorkStore` the worker's dev validation runs under from the
 * transported snapshot, carrying only the fields the validation passes read.
 * `after()` callbacks are routed into a throwaway `AfterContext` whose hooks
 * no-op, because the validation render must not repeat those side effects, and
 * `after()` can't affect the rendered output.
 */ function buildDevValidationWorkStore(message) {
    const { AfterContext } = require('../after/after-context');
    const noopAfterContext = new AfterContext({
        waitUntil (promise) {
            promise.catch(()=>{});
        },
        onClose () {},
        onTaskError () {}
    });
    return {
        isStaticGeneration: false,
        page: message.page,
        route: message.route,
        forceStatic: message.forceStatic,
        isDraftMode: message.request.isDraftMode,
        useCacheTimeout: message.nextConfigSerializable.useCacheTimeout,
        staticPageGenerationTimeout: message.nextConfigSerializable.staticPageGenerationTimeout,
        cacheLifeProfiles: message.nextConfigSerializable.cacheLifeProfiles,
        buildId: message.buildId,
        deploymentId: message.deploymentId,
        requestStartTime: message.request.requestStartTime,
        previouslyRevalidatedTags: [],
        refreshTagsByCacheKind: new Map(),
        runInCleanSnapshot: (0, _asynclocalstorage.createSnapshot)(),
        shouldTrackFetchMetrics: false,
        reactServerErrorsByDigest: new Map(),
        afterContext: noopAfterContext,
        // Dev validation only ever runs under Cache Components.
        cacheComponentsEnabled: true,
        validationLevel: message.validationLevel
    };
}
/**
 * Revives one serialized validation input into the in-memory shape
 * `runValidationInDev` consumes, binding it to the rebuilt request store.
 */ function toDevValidationInputs(serialized, requestStore) {
    return {
        accumulatedChunks: serialized.accumulatedChunks,
        startTime: serialized.startTime,
        stageEndTimes: serialized.stageEndTimes,
        requestStore,
        debugChannelClient: serialized.debugChunks ? (0, _streamutils.createNodeStreamFromChunks)(serialized.debugChunks) : undefined
    };
}
async function runValidationInDevFromSnapshot(message, componentMod, abortSignal) {
    // Expose the reloaded route's bundler `require` / `loadChunk` on `globalThis`
    // so `react-server-dom-*` can resolve client references during the validation
    // prerenders, exactly as the main render does after loading its module.
    if (componentMod.__next_app__) {
        installGlobalModuleLoadingHandlers(componentMod, true, false);
    }
    // `requestFallbackRouteParams` reproduces `ctx.getDynamicParamFromSegment`
    // exactly, so the depth-loop segment keys match the seed render's Flight.
    // `fallbackRouteParams` is separate and only marks params unknown in the
    // prerender stores.
    //
    // TODO: Those two fallback params sets are very confusing in the whole code
    // base. We should maybe refactor this to make their different roles clearer.
    const { requestFallbackRouteParams, fallbackRouteParams } = message;
    const getDynamicParamFromSegment = makeGetDynamicParamFromSegment(message.interpolatedParams, requestFallbackRouteParams, message.optimisticRouting);
    const implicitTags = {
        tags: message.implicitTags,
        expirationsByCacheKind: new Map()
    };
    const workStore = buildDevValidationWorkStore(message);
    const ctx = {
        componentMod,
        getDynamicParamFromSegment,
        query: message.query,
        implicitTags,
        nonce: message.nonce,
        workStore,
        renderOpts: {
            images: message.renderOpts.images,
            allowEmptyStaticShell: message.renderOpts.allowEmptyStaticShell
        },
        isDebugChannelEnabled: message.isDebugChannelEnabled
    };
    const requestStore = (0, _requeststore.createRequestStore)({
        phase: 'render',
        headers: new Headers(message.request.headers),
        onUpdateCookies: undefined,
        url: {
            pathname: message.request.urlPathname,
            search: message.request.urlSearch
        },
        rootParams: message.request.rootParams,
        implicitTags,
        resumeDataCache: null,
        previewProps: undefined,
        isHmrRefresh: message.request.isHmrRefresh,
        hmrRefreshHash: message.request.hmrRefreshHash,
        serverComponentsHmrCache: undefined,
        fallbackParams: requestFallbackRouteParams
    });
    const staticInputs = toDevValidationInputs(message.staticInputs, requestStore);
    const instantInputs = message.instantInputs ? toDevValidationInputs(message.instantInputs, requestStore) : null;
    return _workasyncstorageexternal.workAsyncStorage.run(workStore, runValidationInDev, message.prefetchMode, instantInputs, staticInputs, ctx, fallbackRouteParams, message.devRenderDidError, abortSignal);
}
/**
 * This function is a fork of prerenderToStream cacheComponents branch.
 * While it doesn't return a stream we want it to have identical
 * prerender semantics to prerenderToStream and should update it
 * in conjunction with any changes to that function.
 */ async function runValidationInDev(prefetchMode, instantInputs, staticInputs, ctx, fallbackRouteParams, devRenderDidError, validationAbortSignal) {
    const { componentMod: ComponentMod, getDynamicParamFromSegment } = ctx;
    const loaderTree = ComponentMod.routeModule.userland.loaderTree;
    const rootParams = (0, _createcomponenttree.getRootParams)(loaderTree, getDynamicParamFromSegment);
    const needsInstantValidation = await (0, _instantconfig.anySegmentNeedsInstantValidationInDev)(loaderTree);
    // `samples` from instant config are only used during build
    const validationSamples = null;
    const validationSampleTracking = null;
    //================================
    // Client module warmup
    //================================
    {
        // For warmup, we have to use the shared inputs if present -- the static inputs
        // may not have a proper dynamic stage.
        const { runtimeChunks, dynamicChunks } = (instantInputs ?? staticInputs).accumulatedChunks;
        // First we warmup SSR with the runtime chunks. This ensures that when we do
        // the full prerender pass with dynamic tracking module loading won't
        // interrupt the prerender and can properly observe the entire content
        await warmupClientModulesForStagedValidation(// if we're going to be validating prefetches, we'll be rendering some segments in the dynamic stage.
        // otherwise, for static shell validation, we only need to warm up to the runtime stage.
        // we also need to use a different store type, because instant validation allows more APIs to resolve.
        needsInstantValidation ? 'validation-client' : 'prerender-client', needsInstantValidation ? dynamicChunks : runtimeChunks, dynamicChunks, rootParams, fallbackRouteParams, ctx, validationSamples, validationSampleTracking, validationAbortSignal);
    }
    // React renders used by validation can occupy an entire event-loop turn.
    // Yield between them so a newer navigation can enter app rendering,
    // supersede this validation, and avoid waiting for all remaining attempts.
    if (!await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
        return;
    }
    // instantInputs and staticInputs may be the same,
    // so we have to make sure we only consume the debug channel once.
    let cachedDebugChunks = new WeakMap();
    const getDebugChunksOnce = async (channel)=>{
        let chunks = cachedDebugChunks.get(channel);
        if (!chunks) {
            cachedDebugChunks.set(channel, chunks = await collectDebugChunksFromClientChannel(channel));
        }
        return chunks;
    };
    //================================
    // Static shell validation
    //================================
    {
        // The request may have been aborted during the client module warmup above.
        if (validationAbortSignal.aborted) {
            return;
        }
        const inputs = staticInputs;
        const debugChunks = inputs.debugChannelClient ? await getDebugChunksOnce(inputs.debugChannelClient) : null;
        const hmrRefreshHash = (0, _workunitasyncstorageexternal.getHmrRefreshHash)(inputs.requestStore);
        const result = await validateStaticShell(inputs, ctx, rootParams, fallbackRouteParams, debugChunks, hmrRefreshHash, validationAbortSignal);
        // A newer render superseded this validation while its render ran, so its
        // result is stale. Don't surface errors for a page the user left.
        if (validationAbortSignal.aborted) {
            return;
        }
        if (result.length > 0) {
            if (!await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
                return;
            }
            return result;
        }
    }
    //================================
    // Instant validation
    //================================
    if (needsInstantValidation && instantInputs) {
        if (!await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
            return;
        }
        const inputs = instantInputs;
        const debugChunks = inputs.debugChannelClient ? await getDebugChunksOnce(inputs.debugChannelClient) : null;
        const hmrRefreshHash = (0, _workunitasyncstorageexternal.getHmrRefreshHash)(inputs.requestStore);
        const result = await validateInstantConfigs(prefetchMode, inputs.accumulatedChunks, debugChunks, inputs.startTime, inputs.stageEndTimes, rootParams, fallbackRouteParams, ctx, hmrRefreshHash, validationSamples, devRenderDidError, validationAbortSignal);
        // A newer render superseded this work. Don't surface stale validation
        // errors for a page the user left.
        if (validationAbortSignal.aborted) {
            return;
        }
        if (result.length > 0) {
            if (!await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
                return;
            }
            return result;
        }
    }
}
async function collectDebugChunksFromClientChannel(debugChannel) {
    const debugChunks = [];
    for await (const c of debugChannel){
        debugChunks.push(c);
    }
    return debugChunks;
}
async function validateStaticShell(inputs, ctx, rootParams, fallbackRouteParams, debugChunks, hmrRefreshHash, validationAbortSignal) {
    const debug = process.env.NEXT_PRIVATE_DEBUG_VALIDATION === '1' ? console.log : undefined;
    debug == null ? void 0 : debug(`Starting static shell validation...`);
    const { componentMod: ComponentMod, renderOpts } = ctx;
    const loaderTree = ComponentMod.routeModule.userland.loaderTree;
    const { accumulatedChunks, stageEndTimes } = inputs;
    const { staticChunks, runtimeChunks, dynamicChunks } = accumulatedChunks;
    const allowEmptyStaticShell = (renderOpts.allowEmptyStaticShell ?? false) || await (0, _instantconfig.isPageAllowedToBlock)(loaderTree);
    const runtimeResult = await validateStagedShell(runtimeChunks, dynamicChunks, debugChunks, stageEndTimes[_stagedrendering.RenderStage.Runtime], rootParams, fallbackRouteParams, allowEmptyStaticShell, ctx, hmrRefreshHash, _dynamicrendering.trackDynamicHoleInRuntimeShell, validationAbortSignal);
    if (runtimeResult.length > 0) {
        debug == null ? void 0 : debug(`❌ Failed - ${runtimeResult.length} errors from runtime stage`);
        // We have something to report from the runtime validation
        // We can skip the rest
        return runtimeResult;
    }
    if (!await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
        return [];
    }
    const staticResult = await validateStagedShell(staticChunks, dynamicChunks, debugChunks, stageEndTimes[_stagedrendering.RenderStage.Static], rootParams, fallbackRouteParams, allowEmptyStaticShell, ctx, hmrRefreshHash, _dynamicrendering.trackDynamicHoleInStaticShell, validationAbortSignal);
    if (staticResult.length > 0) {
        debug == null ? void 0 : debug(`❌ Failed - ${staticResult.length} errors from static stage`);
        // We have something to report from the static validation
        // We can skip the rest
        return staticResult;
    }
    debug == null ? void 0 : debug(`✅ Passed`);
    return [];
}
async function warmupClientModulesForStagedValidation(storeType, partialServerChunks, allServerChunks, rootParams, fallbackRouteParams, ctx, validationSamples, validationSampleTracking, validationAbortSignal) {
    const { implicitTags, nonce, workStore } = ctx;
    // Warmup SSR
    const initialClientPrerenderController = new AbortController();
    const initialClientReactController = new AbortController();
    const initialClientRenderController = new AbortController();
    const initialClientReactSignal = validationAbortSignal === undefined ? initialClientReactController.signal : AbortSignal.any([
        initialClientReactController.signal,
        validationAbortSignal
    ]);
    const preinitScripts = ()=>{};
    const { ServerInsertedHTMLProvider } = (0, _serverinsertedhtml.createServerInsertedHTML)();
    let initialClientPrerenderStore;
    if (storeType === 'prerender-client') {
        const store = {
            type: 'prerender-client',
            phase: 'render',
            rootParams,
            fallbackRouteParams,
            implicitTags,
            renderSignal: initialClientRenderController.signal,
            controller: initialClientPrerenderController,
            // For HTML Generation the only cache tracked activity
            // is module loading, which has it's own cache signal
            cacheSignal: null,
            dynamicTracking: null,
            revalidate: _constants1.INFINITE_CACHE,
            expire: _constants1.INFINITE_CACHE,
            stale: _constants1.INFINITE_CACHE,
            tags: [
                ...implicitTags.tags
            ],
            // TODO should this be removed from client stores?
            resumeDataCache: null,
            hmrRefreshHash: undefined,
            // Client prerenders don't track server param access
            varyParamsAccumulator: null
        };
        initialClientPrerenderStore = store;
    } else {
        const store = {
            type: 'validation-client',
            phase: 'render',
            rootParams,
            implicitTags,
            renderSignal: initialClientRenderController.signal,
            controller: initialClientPrerenderController,
            // For HTML Generation the only cache tracked activity
            // is module loading, which has it's own cache signal
            cacheSignal: null,
            dynamicTracking: null,
            revalidate: _constants1.INFINITE_CACHE,
            expire: _constants1.INFINITE_CACHE,
            stale: _constants1.INFINITE_CACHE,
            tags: [
                ...implicitTags.tags
            ],
            // TODO should this be removed from client stores?
            resumeDataCache: null,
            hmrRefreshHash: undefined,
            // Client prerenders don't track server param access
            varyParamsAccumulator: null,
            // We're not rendering any validation boundaries yet.
            boundaryState: null,
            validationSamples,
            validationSampleTracking,
            fallbackRouteParams
        };
        initialClientPrerenderStore = store;
    }
    // TODO: maybe conditionally switch between runtime chunks and all chunks?
    // but warming too much should always be fine, just not always necessary
    const serverStream = (0, _streamutils.createNodeStreamWithLateRelease)(partialServerChunks, allServerChunks, initialClientReactSignal);
    const pendingInitialClientResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialClientPrerenderStore, _streamops.getClientPrerender, // eslint-disable-next-line @next/internal/no-ambiguous-jsx -- React Client
    /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
        reactServerStream: serverStream,
        reactDebugStream: undefined,
        debugEndTime: undefined,
        preinitScripts: preinitScripts,
        ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
        nonce: nonce,
        images: ctx.renderOpts.images
    }), {
        signal: initialClientReactSignal,
        onError: (err)=>{
            const digest = (0, _createerrorhandler.getDigestForWellKnownError)(err);
            if (digest) {
                return digest;
            }
            if ((0, _reactlargeshellerror.isReactLargeShellError)(err)) {
                // TODO: Aggregate
                console.error(err);
                return undefined;
            }
            if (initialClientReactSignal.aborted) {
            // These are expected errors that might error the prerender. we ignore them.
            } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
                // We don't normally log these errors because we are going to retry anyway but
                // it can be useful for debugging Next.js itself to get visibility here when needed
                (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
            }
        }
    });
    // The listener to abort our own render controller must be added after React
    // has added its listener, to ensure that pending I/O is not
    // aborted/rejected too early.
    initialClientReactSignal.addEventListener('abort', ()=>{
        initialClientRenderController.abort();
    }, {
        once: true
    });
    pendingInitialClientResult.catch((err)=>{
        if (initialClientReactSignal.aborted || (0, _dynamicrendering.isPrerenderInterruptedError)(err)) {
        // These are expected errors that might error the prerender. we ignore them.
        } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
            // We don't normally log these errors because we are going to retry anyway but
            // it can be useful for debugging Next.js itself to get visibility here when needed
            (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
        }
    });
    // This is mostly needed for dynamic `import()`s in client components.
    // Promises passed to client were already awaited above (assuming that they came from cached functions)
    const cacheSignal = new _cachesignal.CacheSignal();
    (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
    await cacheSignal.cacheReady();
    _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialClientPrerenderStore, initialClientReactController.abort.bind(initialClientReactController));
}
async function validateStagedShell(stageChunks, allServerChunks, debugChunks, debugEndTime, rootParams, fallbackRouteParams, allowEmptyStaticShell, ctx, hmrRefreshHash, trackDynamicHole, validationAbortSignal) {
    const { implicitTags, nonce, workStore } = ctx;
    const clientDynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(false //isDebugDynamicAccesses
    );
    const clientReactController = new AbortController();
    const clientRenderController = new AbortController();
    const clientReactSignal = AbortSignal.any([
        clientReactController.signal,
        validationAbortSignal
    ]);
    const preinitScripts = ()=>{};
    const { ServerInsertedHTMLProvider } = (0, _serverinsertedhtml.createServerInsertedHTML)();
    const finalClientPrerenderStore = {
        type: 'prerender-client',
        phase: 'render',
        rootParams,
        fallbackRouteParams,
        implicitTags,
        renderSignal: clientRenderController.signal,
        controller: clientReactController,
        // No APIs require a cacheSignal through the workUnitStore during the HTML prerender
        cacheSignal: null,
        dynamicTracking: clientDynamicTracking,
        revalidate: _constants1.INFINITE_CACHE,
        expire: _constants1.INFINITE_CACHE,
        stale: _constants1.INFINITE_CACHE,
        tags: [
            ...implicitTags.tags
        ],
        // TODO should this be removed from client stores?
        resumeDataCache: null,
        hmrRefreshHash,
        // Client prerenders don't track server param access
        varyParamsAccumulator: null
    };
    const dynamicValidation = (0, _dynamicrendering.createDynamicValidationState)();
    const serverStream = (0, _streamutils.createNodeStreamWithLateRelease)(stageChunks, allServerChunks, clientReactSignal);
    const debugChannelClient = debugChunks ? (0, _streamutils.createNodeStreamWithLateRelease)(debugChunks, debugChunks, clientReactSignal) : undefined;
    try {
        let { prelude: unprocessedPrelude } = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
            const pendingFinalClientResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalClientPrerenderStore, _streamops.getClientPrerender, // eslint-disable-next-line @next/internal/no-ambiguous-jsx -- React Client
            /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                reactServerStream: serverStream,
                reactDebugStream: debugChannelClient,
                debugEndTime: debugEndTime,
                preinitScripts: preinitScripts,
                ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                nonce: nonce,
                images: ctx.renderOpts.images
            }), {
                signal: clientReactSignal,
                onError: (err, errorInfo)=>{
                    if ((0, _dynamicrendering.isPrerenderInterruptedError)(err) || clientReactSignal.aborted) {
                        const componentStack = errorInfo.componentStack;
                        if (typeof componentStack === 'string') {
                            trackDynamicHole(err, workStore, componentStack, dynamicValidation, clientDynamicTracking);
                        }
                        return;
                    }
                    if ((0, _reactlargeshellerror.isReactLargeShellError)(err)) {
                        // TODO: Aggregate
                        console.error(err);
                        return undefined;
                    }
                    return (0, _createerrorhandler.getDigestForWellKnownError)(err);
                }
            });
            // The listener to abort our own render controller must be added after
            // React has added its listener, to ensure that pending I/O is not
            // aborted/rejected too early.
            clientReactSignal.addEventListener('abort', ()=>{
                clientRenderController.abort();
            }, {
                once: true
            });
            return pendingFinalClientResult;
        }, ()=>{
            _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalClientPrerenderStore, clientReactController.abort.bind(clientReactController));
        });
        const { preludeIsEmpty } = await (0, _streamops.processPrelude)(unprocessedPrelude);
        return (0, _dynamicrendering.getStaticShellDisallowedDynamicReasons)(workStore, preludeIsEmpty ? _dynamicrendering.PreludeState.Empty : _dynamicrendering.PreludeState.Full, dynamicValidation, allowEmptyStaticShell);
    } catch (thrownValue) {
        // Even if the root errors we still want to report any cache components errors
        // that were discovered before the root errored.
        let errors = (0, _dynamicrendering.getStaticShellDisallowedDynamicReasons)(workStore, _dynamicrendering.PreludeState.Errored, dynamicValidation, allowEmptyStaticShell);
        if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
            errors.unshift('During dynamic validation the root of the page errored. The next logged error is the thrown value. It may be a duplicate of errors reported during the normal development mode render.', thrownValue);
        }
        return errors;
    }
}
/**
 * Validates instant configs by iterating URL depths from deepest to
 * shallowest. At each depth, builds a combined payload where segments
 * above the boundary use Dynamic stage (already mounted) and segments
 * below use Static/Runtime stage (being prefetched). If the new subtree
 * contains any `instant` configs, the payload is rendered to
 * detect dynamic holes without Suspense.
 */ async function validateInstantConfigs(prefetchMode, accumulatedChunks, debugChunks, startTime, stageEndTimes, rootParams, fallbackRouteParams, ctx, hmrRefreshHash, validationSamples, devRenderDidError, validationAbortSignal) {
    const debug = process.env.NEXT_PRIVATE_DEBUG_VALIDATION === '1' ? console.log : undefined;
    const { createCombinedPayloadAtDepth, createCombinedPayloadStream, collectStagedSegmentData, discoverValidationDepths, ValidationPrefetchKind } = ctx.componentMod.InstantValidation();
    const { createValidationSampleTracking } = require('./instant-validation/instant-samples');
    debug == null ? void 0 : debug('\nStarting depth-based instant validation...');
    const prefetchKind = prefetchMode === 2 ? ValidationPrefetchKind.Shell : ValidationPrefetchKind.LegacySpeculative;
    const loaderTree = ctx.componentMod.routeModule.userland.loaderTree;
    const clientReferenceManifest = (0, _manifestssingleton.getClientReferenceManifest)();
    const renderFlightStream = process.env.__NEXT_USE_NODE_STREAMS ? _streamops.renderToNodeFlightStream : _streamops.renderToWebFlightStream;
    const createDebugChannel = process.env.__NEXT_USE_NODE_STREAMS ? _debugchannelserver.createNodeDebugChannel : _debugchannelserver.createWebDebugChannel;
    const { cache, payload: initialRscPayload } = await collectStagedSegmentData(prefetchKind, ctx.componentMod, renderFlightStream, {
        [_stagedrendering.RenderStage.Static]: accumulatedChunks.staticChunks,
        [_stagedrendering.RenderStage.ShellRuntime]: accumulatedChunks.shellRuntimeChunks,
        [_stagedrendering.RenderStage.Runtime]: accumulatedChunks.runtimeChunks,
        [_stagedrendering.RenderStage.Dynamic]: accumulatedChunks.dynamicChunks
    }, debugChunks, startTime, stageEndTimes, clientReferenceManifest, createDebugChannel);
    const { implicitTags, nonce, workStore, isDebugChannelEnabled } = ctx;
    async function validateAtDepth(depth, groupDepthForValidation) {
        return validateAtDepthImpl(depth, groupDepthForValidation, null);
    }
    async function validateAtDepthImpl(depth, groupDepthForValidation, previousBoundaryState) {
        if (validationAbortSignal == null ? void 0 : validationAbortSignal.aborted) {
            return null;
        }
        const extraChunksController = new AbortController();
        const extraChunksSignal = validationAbortSignal === undefined ? extraChunksController.signal : AbortSignal.any([
            extraChunksController.signal,
            validationAbortSignal
        ]);
        const boundaryState = (0, _boundarytracking.createValidationBoundaryTracking)();
        let useRuntimeStageForPartialSegments = false;
        if (previousBoundaryState) {
            // We're doing a followup render to better discriminate error types
            useRuntimeStageForPartialSegments = true;
            for (const [id, filePath] of previousBoundaryState.requiredIds){
                boundaryState.requiredIds.set(id, filePath);
            }
        }
        const payloadResult = await createCombinedPayloadAtDepth(prefetchKind, initialRscPayload, cache, loaderTree, ctx.getDynamicParamFromSegment, ctx.query, depth, groupDepthForValidation, extraChunksSignal, boundaryState, clientReferenceManifest, useRuntimeStageForPartialSegments);
        if (payloadResult === null) {
            return null;
        }
        const reactController = new AbortController();
        const renderController = new AbortController();
        const reactSignal = validationAbortSignal === undefined ? reactController.signal : AbortSignal.any([
            reactController.signal,
            validationAbortSignal
        ]);
        const preinitScripts = ()=>{};
        const { ServerInsertedHTMLProvider } = (0, _serverinsertedhtml.createServerInsertedHTML)();
        const { stream: serverStream, debugStream } = await createCombinedPayloadStream(ctx.componentMod, renderFlightStream, payloadResult.payload, extraChunksController, reactSignal, clientReferenceManifest, startTime, isDebugChannelEnabled, createDebugChannel);
        const instantValidationState = (0, _dynamicrendering.createInstantValidationState)(payloadResult.slotStacks);
        const validationSampleTracking = validationSamples !== null ? createValidationSampleTracking() : null;
        const clientDynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(false);
        const prerenderStore = {
            type: 'validation-client',
            phase: 'render',
            rootParams,
            implicitTags,
            renderSignal: renderController.signal,
            controller: reactController,
            cacheSignal: null,
            dynamicTracking: clientDynamicTracking,
            revalidate: _constants1.INFINITE_CACHE,
            expire: _constants1.INFINITE_CACHE,
            stale: _constants1.INFINITE_CACHE,
            tags: [
                ...implicitTags.tags
            ],
            resumeDataCache: null,
            hmrRefreshHash,
            varyParamsAccumulator: null,
            boundaryState,
            fallbackRouteParams,
            validationSamples,
            validationSampleTracking
        };
        let dynamicHoleKind;
        switch(prefetchKind){
            case ValidationPrefetchKind.Shell:
                {
                    dynamicHoleKind = payloadResult.hasAmbiguousErrors ? _dynamicrendering.DynamicHoleKind.Link : _dynamicrendering.DynamicHoleKind.Dynamic;
                    break;
                }
            case ValidationPrefetchKind.LegacySpeculative:
                {
                    dynamicHoleKind = payloadResult.hasAmbiguousErrors ? _dynamicrendering.DynamicHoleKind.Runtime : _dynamicrendering.DynamicHoleKind.Dynamic;
                    break;
                }
        }
        let result;
        try {
            const { prelude: unprocessedPrelude } = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
                const pendingResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderStore, _streamops.getClientPrerender, // eslint-disable-next-line @next/internal/no-ambiguous-jsx -- React Client
                /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                    reactServerStream: serverStream,
                    reactDebugStream: debugStream ?? undefined,
                    debugEndTime: undefined,
                    preinitScripts: preinitScripts,
                    ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                    nonce: nonce,
                    images: ctx.renderOpts.images
                }), {
                    signal: reactSignal,
                    onError: (err, errorInfo)=>{
                        if ((0, _dynamicrendering.isPrerenderInterruptedError)(err) || reactSignal.aborted) {
                            const componentStack = errorInfo.componentStack;
                            if (typeof componentStack === 'string') {
                                (0, _dynamicrendering.trackDynamicHoleInNavigation)(err, workStore, componentStack, instantValidationState, clientDynamicTracking, dynamicHoleKind, boundaryState);
                            }
                            return;
                        } else if (!reactSignal.aborted) {
                            const componentStack = errorInfo.componentStack;
                            if (typeof componentStack === 'string') {
                                let errorForDisplay = err;
                                if (process.env.NODE_ENV === 'production') {
                                    // In production (i.e. build validation), Flight omits everything except the digest
                                    // when serializing errors, which makes them very unfriendly for debugging.
                                    // Map the deserialized errors back to their original error object to make it more useful.
                                    if (err && typeof err === 'object' && 'digest' in err && typeof err.digest === 'string') {
                                        const serverError = workStore.reactServerErrorsByDigest.get(err.digest);
                                        if (serverError !== undefined) {
                                            errorForDisplay = serverError;
                                        }
                                    }
                                }
                                (0, _dynamicrendering.trackThrownErrorInNavigation)(workStore, instantValidationState, errorForDisplay, componentStack);
                            }
                        }
                        if ((0, _reactlargeshellerror.isReactLargeShellError)(err)) {
                            console.error(err);
                            return undefined;
                        }
                        return (0, _createerrorhandler.getDigestForWellKnownError)(err);
                    }
                });
                reactSignal.addEventListener('abort', ()=>{
                    renderController.abort();
                }, {
                    once: true
                });
                return pendingResult;
            }, ()=>{
                _workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderStore, reactController.abort.bind(reactController));
            });
            const { preludeIsEmpty } = await (0, _streamops.processPrelude)(unprocessedPrelude);
            result = (0, _dynamicrendering.getNavigationDisallowedDynamicReasons)(workStore, preludeIsEmpty ? _dynamicrendering.PreludeState.Empty : _dynamicrendering.PreludeState.Full, instantValidationState, validationSampleTracking, boundaryState, devRenderDidError);
        } catch (thrownValue) {
            result = (0, _dynamicrendering.getNavigationDisallowedDynamicReasons)(workStore, _dynamicrendering.PreludeState.Errored, instantValidationState, validationSampleTracking, boundaryState, devRenderDidError);
        }
        // If the prerender produced no real errors at this depth — either an
        // empty array (clean) or a deferred-only result (Error/AggregateError
        // representing a missing-boundary fallback) — there's nothing to
        // discriminate. Pass it up so the outer loop can hold any deferred
        // fallback back until every depth has been tried.
        if (!Array.isArray(result) || result.length === 0) {
            return result;
        }
        if (previousBoundaryState === null && payloadResult.hasAmbiguousErrors) {
            // This is the first validation attempt. we prepared a payload where dynamic holes might be runtime data dependencies
            // or dynamic data dependencies. We do a followup validation using a payload with only Runtime segments to discriminate
            if (validationAbortSignal !== undefined && !await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
                return [];
            }
            const dynamicOnlyResult = await validateAtDepthImpl(depth, groupDepthForValidation, boundaryState);
            if (Array.isArray(dynamicOnlyResult) && dynamicOnlyResult.length > 0) {
                // The dynamic errors only validation found errors to report so we favor those
                return dynamicOnlyResult;
            }
        }
        // If we didn't return some other errors at this point the only thing to return is this validation's result
        return result;
    }
    // Discover validation depth bounds from the LoaderTree. The array
    // length is the max URL depth; each entry is the max group depth
    // (route group segments) between that URL depth and the next.
    const groupDepthsByUrlDepth = discoverValidationDepths(loaderTree);
    const maxDepth = groupDepthsByUrlDepth.length;
    let impairedValidation = null;
    for(let depth = maxDepth - 1; depth >= 0; depth--){
        const maxGroupDepth = groupDepthsByUrlDepth[depth];
        for(let currentGroupDepth = maxGroupDepth; currentGroupDepth >= 0; currentGroupDepth--){
            const debugKind = ValidationPrefetchKind[prefetchKind];
            debug == null ? void 0 : debug(`Trying ${debugKind} at depth ${depth}` + (currentGroupDepth > 0 ? ` + groupDepth ${currentGroupDepth}...` : '...'));
            if (validationAbortSignal !== undefined && !await (0, _devvalidationscheduler.yieldToForegroundRequest)(validationAbortSignal)) {
                return [];
            }
            const result = await validateAtDepth(depth, currentGroupDepth);
            if (Array.isArray(result)) {
                const errors = result;
                // Validation completed at least partially.
                if (errors.length > 0) {
                    // There were issues with producing an instant UI for this attempted navigation
                    debug == null ? void 0 : debug(`  ${debugKind} at depth ${depth}+${currentGroupDepth}: ❌ Failed (${errors.length} errors)`);
                    return errors;
                } else {
                    // There is nothing blocking instant UI for this simluated navigation
                    debug == null ? void 0 : debug(`  ${debugKind} at depth ${depth}+${currentGroupDepth}: ✅ Passed`);
                }
            } else if (result === null) {
                // There was no validation to perform at this level
                debug == null ? void 0 : debug(`  No config at depth ${depth}+${currentGroupDepth}, skipping.`);
            } else {
                // Something prevented this level from fully validating but there
                // were no detected errors. Always overwrite — prefer the
                // shallowest deferred fallback. If a high-level layout drops
                // children, everything below is unreachable; the shallowest
                // unrendered segment is closest to the actual cause.
                impairedValidation = result;
            }
        }
    }
    if (impairedValidation) {
        debug == null ? void 0 : debug(`⏸ All depths passed without real errors; surfacing deferred missing-boundary fallback`);
        if (impairedValidation instanceof AggregateError) {
            // There is at least one potential cause of the validation blocking
            return impairedValidation.errors;
        } else {
            // There was no known cause but we report something anyway
            return [
                impairedValidation
            ];
        }
    }
    debug == null ? void 0 : debug(`✅ All depths passed`);
    return [];
}
/**
 * Two-pass render for build-time instant validation.
 * The flow is similar to `renderWithRestartOnCacheMissInDev`: pass 1 warms caches,
 * pass 2 renders with warm caches. If pass 1 has no cache misses,
 * its result is returned directly.
 *
 * Differences from `renderWithRestartOnCacheMissInDev`:
 * - both renders are abortable: if we know that we can't use a stream, we can just
 *   throw it away, we don't have to render a complete result.
 * - We don't need to tee the stream, we only care about accumulating chunks.
 */ async function renderWithRestartOnCacheMissInValidation(prefetchMode, ctx, initialRequestStore, createRequestStore, getPayload, createOnError, prefilledDataCache) {
    const { componentMod: ComponentMod } = ctx;
    const shouldRenderAppShell = prefetchMode === 2;
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    const renderFlightStream = process.env.__NEXT_USE_NODE_STREAMS ? _streamops.renderToNodeFlightStream : _streamops.renderToWebFlightStream;
    let startTime = -Infinity;
    let requestStore = initialRequestStore;
    //===============================================
    // Initial render (prospective — may warm caches)
    //===============================================
    const cacheSignal = new _cachesignal.CacheSignal();
    (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
    // The prerender we rean before the validation probably already filled some caches,
    // so we want to save work and re-use them.
    const prerenderResumeDataCache = prefilledDataCache ? (0, _resumedatacache.createPrerenderResumeDataCache)(prefilledDataCache) : (0, _resumedatacache.createPrerenderResumeDataCache)();
    const initialReactController = new AbortController();
    const initialDataController = new AbortController();
    const initialAbandonController = new AbortController();
    const initialStageController = new _stagedrendering.StagedRenderingController({
        abortSignal: initialDataController.signal,
        abandonController: initialAbandonController,
        syncIO: getSyncIOMode(prefetchMode),
        finalStage: null
    });
    requestStore.resumeDataCache = prerenderResumeDataCache;
    requestStore.stagedRendering = initialStageController;
    requestStore.needsSessionShell = shouldRenderAppShell;
    requestStore.cacheSignal = cacheSignal;
    requestStore.asyncApiPromises = createAsyncApiPromises(initialStageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
    // We don't set `requestStore.controller and requestStore.renderSignal here.
    // Right now, we only abort for sync IO, and in the first render, that's just a restart
    // (after waiting for caches)
    requestStore.controller = undefined;
    requestStore.renderSignal = undefined;
    const initialRscPayload = await getPayload(requestStore);
    const advanceStageIfNoCacheMiss = (stage)=>{
        if (initialAbandonController.signal.aborted === true) {
            return;
        } else if (cacheSignal.hasPendingReads()) {
            initialAbandonController.abort();
        } else {
            initialStageController.advanceStage(stage);
        }
    };
    const initialResult = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
        initialStageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        startTime = performance.now() + performance.timeOrigin;
        const stream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, renderFlightStream, ComponentMod, initialRscPayload, clientModules, {
            onError: createOnError(initialReactController.signal, false),
            startTime,
            filterStackFrame,
            signal: initialReactController.signal
        });
        initialReactController.signal.addEventListener('abort', ()=>{
            const { reason } = initialReactController.signal;
            initialDataController.abort(reason);
        }, {
            once: true
        });
        const accumulatedChunksPromise = accumulateStreamChunks(stream, initialStageController, initialDataController.signal);
        accumulatedChunksPromise.catch(()=>{});
        return {
            accumulatedChunksPromise
        };
    }, ()=>{
        advanceStageIfNoCacheMiss(_stagedrendering.RenderStage.Static);
    }, ()=>{
        advanceStageIfNoCacheMiss(_stagedrendering.RenderStage.ShellRuntime);
    }, ()=>{
        advanceStageIfNoCacheMiss(_stagedrendering.RenderStage.Runtime);
    }, ()=>{
        advanceStageIfNoCacheMiss(_stagedrendering.RenderStage.Dynamic);
    });
    if (initialStageController.currentStage !== _stagedrendering.RenderStage.Abandoned) {
        // No cache misses. Use the result as-is.
        return {
            accumulatedChunksPromise: initialResult.accumulatedChunksPromise,
            startTime,
            stageController: initialStageController,
            requestStore
        };
    }
    // Cache miss. Wait for caches to fill, then re-render with warm caches.
    await cacheSignal.cacheReady();
    _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, initialReactController.abort.bind(initialReactController));
    //===============================================
    // Final render (restarted, with warm caches)
    //===============================================
    requestStore = createRequestStore();
    // Unlike dev, where we're re-using the render that'll be visible in the browser,
    // we *can* abort the validation render.
    const finalReactController = new AbortController();
    const finalDataController = new AbortController();
    const finalStageController = new _stagedrendering.StagedRenderingController({
        abortSignal: finalDataController.signal,
        abandonController: null,
        syncIO: getSyncIOMode(prefetchMode),
        finalStage: null
    });
    requestStore.resumeDataCache = (0, _resumedatacache.createRenderResumeDataCache)(prerenderResumeDataCache);
    requestStore.stagedRendering = finalStageController;
    requestStore.needsSessionShell = shouldRenderAppShell;
    requestStore.cacheSignal = null;
    requestStore.asyncApiPromises = createAsyncApiPromises(finalStageController, requestStore.cookies, requestStore.mutableCookies, requestStore.headers);
    // Right now, we only abort for sync IO.
    // If sync IO occurs in a place where it's not allowed, then we have to fail validation,
    // and we can abort the render immediately, without waiting for anything else..
    requestStore.controller = finalReactController;
    requestStore.renderSignal = finalDataController.signal;
    const finalRscPayload = await getPayload(requestStore);
    const finalResult = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
        finalStageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
        startTime = performance.now() + performance.timeOrigin;
        const stream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, renderFlightStream, ComponentMod, finalRscPayload, clientModules, {
            onError: createOnError(finalReactController.signal, true),
            startTime,
            filterStackFrame,
            signal: finalReactController.signal
        });
        finalReactController.signal.addEventListener('abort', ()=>{
            finalDataController.abort(finalReactController.signal.reason);
        }, {
            once: true
        });
        const accumulatedChunksPromise = accumulateStreamChunks(stream, finalStageController, null);
        accumulatedChunksPromise.catch(()=>{});
        return {
            accumulatedChunksPromise
        };
    }, ()=>finalStageController.advanceStage(_stagedrendering.RenderStage.Static), ()=>finalStageController.advanceStage(_stagedrendering.RenderStage.ShellRuntime), ()=>finalStageController.advanceStage(_stagedrendering.RenderStage.Runtime), ()=>finalStageController.advanceStage(_stagedrendering.RenderStage.Dynamic));
    return {
        accumulatedChunksPromise: finalResult.accumulatedChunksPromise,
        startTime,
        stageController: finalStageController,
        requestStore
    };
}
async function validateInstantConfigsInBuild(ctx, prefilledDataCache) {
    const run = async ()=>{
        let success;
        try {
            // The validation renders are separate renders, and use a separate WorkStore.
            // However, we defensively exit the existing workStore to avoid relying on something from there
            // before we shadow it.
            success = await _workasyncstorageexternal.workAsyncStorage.exit(async ()=>validateInstantConfigsInBuildImpl(ctx, prefilledDataCache));
        } catch (err) {
            console.error(Object.defineProperty(new _invarianterror.InvariantError('An unexpected error occurred during instant validation', {
                cause: err
            }), "__NEXT_ERROR_CODE", {
                value: "E1097",
                enumerable: false,
                configurable: true
            }));
            success = false;
        }
        if (!success) {
            console.error('Stopping prerender due to instant validation errors.');
            throw new _staticgenerationbailout.StaticGenBailoutError();
        }
    };
    if (process.env.__NEXT_TEST_MODE && process.env.NEXT_TEST_LOG_VALIDATION) {
        // In tests, we use these markers to extract the relevant portion of the CLI logs.
        // We want consistent ordering of these messages and other console.error calls,
        // so we use console.error here as well. Using console.log leads to non-deterministic
        // log order, likely stdout/stderr can interleave in non-deterministic ways.
        const requestId = String(Date.now());
        const route = ctx.workStore.route;
        console.error((0, _devvalidationevents.formatValidationEvent)({
            type: 'validation_start',
            requestId,
            url: route
        }));
        try {
            return await run();
        } finally{
            console.error((0, _devvalidationevents.formatValidationEvent)({
                type: 'validation_end',
                requestId,
                url: route
            }));
        }
    } else {
        return await run();
    }
}
/**
 * Runs instant validation at build time using the `samples` from `instant`.
 *
 * For each sample, this creates a staged RSC render with a synthetic `RequestStore`
 * populated from sample data, then feeds the accumulated chunks to
 * `validateInstantConfigs` which handles the actual validation.
 */ async function validateInstantConfigsInBuildImpl(ctx, prefilledDataCache) {
    const debug = process.env.NEXT_PRIVATE_DEBUG_VALIDATION === '1' ? console.log : undefined;
    const { workStore: outerWorkStore } = ctx;
    const route = outerWorkStore.route;
    const loaderTree = ctx.componentMod.routeModule.userland.loaderTree;
    let samples = await (0, _instantconfig.resolveInstantConfigSamplesForPage)(loaderTree);
    if (!samples || samples.length === 0) {
        // No samples defined; use a single empty sample to still run validation
        samples = [
            {}
        ];
    }
    debug == null ? void 0 : debug('Resolved samples:', samples);
    const allPossibleFallbackRouteParams = (0, _fallbackparams.getFallbackRouteParams)(route, ctx.componentMod.routeModule);
    for(let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++){
        const sample = samples[sampleIndex];
        debug == null ? void 0 : debug(`Validating sample (${sampleIndex + 1}/${samples.length}):`, sample);
        let errors;
        try {
            errors = await _consoleasyncstorageexternal.consoleAsyncStorage.run({
                dim: true
            }, ()=>validateInstantConfigInBuildWithSample(ctx, sample, allPossibleFallbackRouteParams, prefilledDataCache));
        } catch (err) {
            if ((0, _instantvalidationerror.isInstantValidationError)(err)) {
                errors = [
                    err
                ];
            } else {
                throw err;
            }
        }
        if (errors.length > 0) {
            debug == null ? void 0 : debug(`❌ Sample failed validation (${errors.length} errors)`);
            const sampleDesc = samples.length > 1 ? ` (sample ${sampleIndex + 1} of ${samples.length})` : '';
            for (const err of errors){
                console.error(err);
            }
            console.error(`Build-time instant validation failed for route "${route}"${sampleDesc}.`);
            (0, _blockingroutemessages.logBuildDebugHint)(route);
            return false;
        } else {
            debug == null ? void 0 : debug('✅ Sample validated successfully');
        }
    }
    return true;
}
async function validateInstantConfigInBuildWithSample(outerCtx, sample, allPossibleFallbackRouteParams, prefilledDataCache) {
    // The flow for build mirrors what we do when validating in dev.
    // We have to perform a full dynamic render to get the RSC chunks for each stage.
    // In order to do that, we have to set up a mock AppRenderContext, workStore, and requestStore
    // based on the `sample` we're using.
    const { workStore: outerWorkStore } = outerCtx;
    const loaderTree = outerCtx.componentMod.routeModule.userland.loaderTree;
    const prefetchMode = await getPrefetchingModeForPage(outerCtx.renderOpts, loaderTree);
    const route = outerWorkStore.route;
    const { createCookiesFromSample, createHeadersFromSample, createDraftModeForValidation, createRelativeURLFromSamples, createValidationSampleTracking } = require('./instant-validation/instant-samples');
    // TODO(instant-validation-build): it feels like this should happen higher up
    // and go through existing URL parsing/generation logic?
    const sampleUrl = createRelativeURLFromSamples(route, sample.params, sample.searchParams);
    const sampleParams = sample.params ?? {};
    let fallbackRouteParams = null;
    if (allPossibleFallbackRouteParams) {
        const fallbackRouteParamsMut = new Map();
        for (const [paramKey, value1] of allPossibleFallbackRouteParams){
            if (!(paramKey in sampleParams)) {
                fallbackRouteParamsMut.set(paramKey, value1);
            }
        }
        fallbackRouteParams = fallbackRouteParamsMut;
    }
    const getDynamicParamFromSegment = makeGetDynamicParamFromSegment(sampleParams, fallbackRouteParams, false);
    const sampleRootParams = (0, _createcomponenttree.getRootParams)(loaderTree, getDynamicParamFromSegment);
    let sampleUrlWithoutQuery;
    let sampleQuery;
    ({ query: sampleQuery, ...sampleUrlWithoutQuery } = sampleUrl);
    const { AfterContext } = require('../after/after-context');
    // NOTE: Matching the field order in `createWorkStore` to avoid deopting.
    const workStore = {
        isStaticGeneration: false,
        page: outerWorkStore.page,
        route: outerWorkStore.route,
        requestStartTime: outerWorkStore.requestStartTime,
        incrementalCache: outerWorkStore.incrementalCache,
        cacheLifeProfiles: outerWorkStore.cacheLifeProfiles,
        useCacheTimeout: outerWorkStore.useCacheTimeout,
        staticPageGenerationTimeout: outerWorkStore.staticPageGenerationTimeout,
        isBuildTimePrerendering: false,
        fetchCache: outerWorkStore.fetchCache,
        isOnDemandRevalidate: false,
        requestId: outerWorkStore.requestId,
        htmlRequestId: outerWorkStore.htmlRequestId,
        isDraftMode: false,
        isPrefetchRequest: false,
        buildId: outerWorkStore.buildId,
        deploymentId: outerWorkStore.deploymentId,
        reactLoadableManifest: outerWorkStore.reactLoadableManifest,
        assetPrefix: outerWorkStore.assetPrefix,
        nonce: outerWorkStore.nonce,
        // Never run `after()` for this validation render. by definition, `after` can't affect the rendered output.
        afterContext: new AfterContext({
            waitUntil (promise) {
                promise.catch(()=>{});
            },
            onClose () {},
            onTaskError () {}
        }),
        cacheComponentsEnabled: outerWorkStore.cacheComponentsEnabled,
        validationLevel: outerWorkStore.validationLevel,
        previouslyRevalidatedTags: [],
        refreshTagsByCacheKind: new Map(),
        runInCleanSnapshot: outerWorkStore.runInCleanSnapshot,
        shouldTrackFetchMetrics: false,
        reactServerErrorsByDigest: new Map()
    };
    return _workasyncstorageexternal.workAsyncStorage.run(workStore, async ()=>{
        // NOTE: match field order in renderToHTMLOrFlightImpl to avoid deopts
        const validationCtx = {
            componentMod: outerCtx.componentMod,
            url: sampleUrlWithoutQuery,
            renderOpts: outerCtx.renderOpts,
            workStore,
            parsedRequestHeaders: outerCtx.parsedRequestHeaders,
            getDynamicParamFromSegment,
            interpolatedParams: sampleParams,
            fallbackRouteParams,
            query: sampleQuery,
            isPrefetch: false,
            isPossibleServerAction: false,
            requestTimestamp: outerCtx.requestTimestamp,
            appUsingSizeAdjustment: outerCtx.appUsingSizeAdjustment,
            flightRouterState: undefined,
            requestId: outerCtx.requestId,
            htmlRequestId: outerCtx.htmlRequestId,
            pagePath: outerCtx.pagePath,
            assetPrefix: outerCtx.assetPrefix,
            isNotFoundPath: outerCtx.isNotFoundPath,
            nonce: outerCtx.nonce,
            res: outerCtx.res,
            sharedContext: outerCtx.sharedContext,
            implicitTags: outerCtx.implicitTags
        };
        const validationSamples = {
            params: sample.params,
            searchParams: sample.searchParams
        };
        const createRequestStore = ()=>{
            // Create exhaustive request data from sample
            const sampleCookies = createCookiesFromSample(sample.cookies, route);
            // We don't have to bother initializing these, pages can't access them anyway,
            // we just need them because RequestStore requires them.
            const unusedMutableCookies = new _cookies.ResponseCookies(new Headers());
            // Create headers.
            const sampleHeaders = createHeadersFromSample(sample.headers, sample.cookies, route);
            const draftMode = createDraftModeForValidation();
            return {
                type: 'request',
                phase: 'render',
                implicitTags: outerCtx.implicitTags,
                url: {
                    pathname: sampleUrl.pathname,
                    search: sampleUrl.search
                },
                headers: sampleHeaders,
                cookies: sampleCookies,
                mutableCookies: unusedMutableCookies,
                userspaceMutableCookies: unusedMutableCookies,
                draftMode,
                rootParams: sampleRootParams,
                validationSamples,
                validationSampleTracking: createValidationSampleTracking(),
                // This will be set when rendering
                resumeDataCache: null,
                stagedRendering: null,
                asyncApiPromises: undefined
            };
        };
        // Track server errors. If one of them surfaces during the client render
        // in the deserialized form (with no message/stack) we'll use this to map it
        // back to the original.
        const onServerError = (0, _createerrorhandler.createReactServerErrorHandler)(true, true, workStore.reactServerErrorsByDigest, ()=>{} // Don't report anything here. If needed, it will be reported in the client render.
        );
        const { accumulatedChunksPromise, startTime, stageController, requestStore: finalServerStore } = await renderWithRestartOnCacheMissInValidation(prefetchMode, validationCtx, createRequestStore(), createRequestStore, (requestStore)=>_workunitasyncstorageexternal.workUnitAsyncStorage.run(requestStore, getRSCPayload, loaderTree, validationCtx, {
                is404: false
            }), (signal)=>function onError(err) {
                const digest = (0, _createerrorhandler.getDigestForWellKnownError)(err);
                if (digest) {
                    return digest;
                }
                if (signal.aborted) {
                    return;
                }
                return onServerError(err);
            }, prefilledDataCache);
        const accumulatedChunks = await accumulatedChunksPromise;
        const endTimes = getStageEndTimes(stageController);
        const debugChunks = null // TODO(instant-validation-build): support debugChannel
        ;
        // Missing sample errors take priority over everything else,
        // because they prevent us from rendering everything we need to validate.
        const serverValidationSampleTracking = finalServerStore.validationSampleTracking;
        if (serverValidationSampleTracking.missingSampleErrors.length > 0) {
            return serverValidationSampleTracking.missingSampleErrors;
        }
        // We also error for sync IO. This runs after the prerender,
        // so if we get sync IO errors here, they're likely from the runtime stage --
        // the prerender probably discovered sync IO in the static stage
        if (stageController.currentStage === _stagedrendering.RenderStage.Abandoned && stageController.syncInterruptReason) {
            return [
                stageController.syncInterruptReason
            ];
        }
        // Now we the chunks of a fully rendered page, just like in dev.
        // We can use them to validate all the navigations required by `instant` configs.
        // Note that we're not performing static shell validation here -- that happens
        // implicitly as part of the static prerender.
        // The static prerender has warmed some client modules already,
        // but we'll be reaching Runtime/Dynamic stages and thus rendering more content,
        // so we need to warm again.
        // TODO(instant-validation-build): This might warm too much, possibly hitting errors on code that didn't expect
        // to run at build time. For example, we generally don't need to render leaf segments (e.g. __PAGE__) in
        // the Dynamic stage, they're Runtime at best.
        const warmupValidationSamplesTracking = createValidationSampleTracking();
        const validationRenderCtx = toValidationRenderContext(validationCtx);
        await warmupClientModulesForStagedValidation('validation-client', accumulatedChunks.dynamicChunks, accumulatedChunks.dynamicChunks, sampleRootParams, fallbackRouteParams, validationRenderCtx, validationSamples, warmupValidationSamplesTracking);
        if (warmupValidationSamplesTracking.missingSampleErrors.length > 0) {
            return warmupValidationSamplesTracking.missingSampleErrors;
        }
        return await validateInstantConfigs(prefetchMode, accumulatedChunks, debugChunks, startTime, endTimes, sampleRootParams, fallbackRouteParams, validationRenderCtx, undefined, validationSamples, false // build has no shared dev render that would surface errors
        );
    });
}
/**
 * Determines whether we should generate static flight data.
 */ // TODO: This helper used to exclude fallback route params. It now only checks
// static generation inside prerenderToStream and can be removed. LOE: low.
function shouldGenerateStaticFlightData(workStore) {
    const { isStaticGeneration } = workStore;
    if (!isStaticGeneration) return false;
    return true;
}
async function continueStaticPrerenderWithInlinedData(htmlStream, reactServerResult, fallbackRouteParams, createInlinedDataStream, formState, nonce, getServerInsertedHTML, getServerInsertedMetadata, deploymentId, ComponentMod, renderFlightStream, clientModules, filterStackFrameForError, serverComponentsErrorHandler) {
    const hasFallbackRouteParams = fallbackRouteParams && fallbackRouteParams.size > 0;
    if (hasFallbackRouteParams) {
        // This is a "static fallback" prerender: although the page didn't
        // access any runtime params in a Server Component, it may have
        // accessed a runtime param in a client segment.
        //
        // TODO: If there were no client segments, we can use the fully static
        // path instead.
        //
        // Rather than use a dynamic server resume to fill in the params,
        // we can rely on the client to parse the params from the URL and use
        // that to hydrate the page.
        //
        // Send an empty InitialRSCPayload to the server component renderer
        // The data will be fetched by the client instead.
        // TODO: In the future, rather than defer the entire hydration payload
        // to be fetched by the client, we should only defer the client
        // segments, since those are the only ones whose data is not complete.
        const emptyReactServerResult = await (0, _apprenderprerenderutils.createReactServerPrerenderResultFromRender)(renderFlightStream(ComponentMod, [], clientModules, {
            filterStackFrame: filterStackFrameForError,
            onError: serverComponentsErrorHandler
        }));
        const inlinedDataStream = createInlinedDataStream(emptyReactServerResult.consumeAsStream(), nonce, formState);
        return (0, _streamops.continueStaticFallbackPrerender)(htmlStream, {
            inlinedDataStream,
            getServerInsertedHTML,
            getServerInsertedMetadata,
            deploymentId
        });
    }
    const inlinedDataStream = createInlinedDataStream(reactServerResult.consumeAsStream(), nonce, formState);
    return (0, _streamops.continueStaticPrerender)(htmlStream, {
        inlinedDataStream,
        getServerInsertedHTML,
        getServerInsertedMetadata,
        deploymentId
    });
}
async function prerenderToStream(req, res, ctx, metadata, tree, fallbackRouteParams) {
    // When prerendering formState is always null. We still include it
    // because some shared APIs expect a formState value and this is slightly
    // more explicit than making it an optional function argument
    const formState = null;
    const { assetPrefix, getDynamicParamFromSegment, implicitTags, nonce, pagePath, renderOpts, workStore } = ctx;
    const { basePath, buildManifest, ComponentMod, crossOrigin, experimental, isDebugDynamicAccesses, isBuildTimePrerendering = false, onInstrumentationRequestError, page, reactMaxHeadersLength, subresourceIntegrityManifest, cacheComponents } = renderOpts;
    const { cachedNavigations } = renderOpts.experimental;
    const renderFlightStream = process.env.__NEXT_USE_NODE_STREAMS ? _streamops.renderToNodeFlightStream : _streamops.renderToWebFlightStream;
    const renderFizzStream = process.env.__NEXT_USE_NODE_STREAMS ? _streamops.renderToNodeFizzStream : _streamops.renderToWebFizzStream;
    const createInlinedDataStream = process.env.__NEXT_USE_NODE_STREAMS ? _streamops.createNodeInlinedDataStream : _streamops.createWebInlinedDataStream;
    const allowEmptyStaticShell = (renderOpts.allowEmptyStaticShell ?? false) || await (0, _instantconfig.isPageAllowedToBlock)(tree);
    const rootParams = (0, _createcomponenttree.getRootParams)(tree, getDynamicParamFromSegment);
    const { ServerInsertedHTMLProvider, renderServerInsertedHTML } = (0, _serverinsertedhtml.createServerInsertedHTML)();
    const getServerInsertedMetadata = (0, _createserverinsertedmetadata.createServerInsertedMetadata)(nonce);
    const tracingMetadata = (0, _utils1.getTracedMetadata)((0, _tracer.getTracer)().getTracePropagationData(), experimental.clientTraceMetadata);
    const polyfills = buildManifest.polyfillFiles.filter((polyfill)=>polyfill.endsWith('.js') && !polyfill.endsWith('.module.js')).map((polyfill)=>({
            src: `${assetPrefix}/_next/${polyfill}${(0, _getassetquerystring.getAssetQueryString)(ctx, false)}`,
            integrity: subresourceIntegrityManifest == null ? void 0 : subresourceIntegrityManifest[polyfill],
            crossOrigin,
            noModule: true,
            nonce
        }));
    const [preinitScripts, bootstrapScript] = (0, _requiredscripts.getRequiredScripts)(buildManifest, // Why is assetPrefix optional on renderOpts?
    // @TODO make it default empty string on renderOpts and get rid of it from ctx
    assetPrefix, crossOrigin, subresourceIntegrityManifest, (0, _getassetquerystring.getAssetQueryString)(ctx, true), nonce, page);
    let bootstrapScriptContent = buildManifest.pagesChunkGroupBootstrapParams && buildManifest.chunkLoadingGlobal ? (0, _getpagefiles.getTurbopackChunkGroupBootstrap)(buildManifest.pagesChunkGroupBootstrapParams, buildManifest.chunkLoadingGlobal, [
        page
    ]) : undefined;
    // Instant Navigation Testing API: when exposed, embed the cookie-guarded
    // bootstrap into the prerendered prelude so the cached static shell carries
    // it and it runs before the client bootstrap module reads
    // self.__next_instant_test.
    if (renderOpts.experimental.exposeTestingApi) {
        bootstrapScriptContent = (bootstrapScriptContent ? `${bootstrapScriptContent};` : '') + await (0, _instanttestbootstrap.getInstantTestBootstrapScriptContent)();
    }
    // In development the static shell is served without a dynamic resume, so it
    // must carry the debug-channel request id (self.__next_r) itself for
    // app-index to initialize the HMR/debug channel. renderToStream provides this
    // for dynamic renders; prepend it here so it runs before the bootstrap
    // module.
    if (process.env.__NEXT_DEV_SERVER && bootstrapScriptContent) {
        bootstrapScriptContent = `self.__next_r=${JSON.stringify(ctx.requestId ?? crypto.randomUUID())};` + bootstrapScriptContent;
    }
    const { reactServerErrorsByDigest } = workStore;
    // We don't report errors during prerendering through our instrumentation hooks
    const reportErrors = !experimental.isRoutePPREnabled;
    function onHTMLRenderRSCError(err, silenceLog) {
        if (reportErrors) {
            return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, createErrorContext(ctx, 'react-server-components'), silenceLog);
        }
    }
    const serverComponentsErrorHandler = (0, _createerrorhandler.createReactServerErrorHandler)(process.env.NODE_ENV === 'development', isBuildTimePrerendering, reactServerErrorsByDigest, onHTMLRenderRSCError);
    function onHTMLRenderSSRError(err) {
        if (reportErrors) {
            // We don't need to silence logs here. onHTMLRenderSSRError won't be
            // called at all if the error was logged before in the RSC error handler.
            const silenceLog = false;
            return onInstrumentationRequestError == null ? void 0 : onInstrumentationRequestError(err, req, createErrorContext(ctx, 'server-rendering'), silenceLog);
        }
    }
    const allCapturedErrors = [];
    const htmlRendererErrorHandler = (0, _createerrorhandler.createHTMLErrorHandler)(process.env.NODE_ENV === 'development', isBuildTimePrerendering, reactServerErrorsByDigest, allCapturedErrors, onHTMLRenderSSRError);
    let reactServerPrerenderResult = null;
    let reactServerPrerenderResultIsDynamic = null;
    let reactServerResumeDataCache = null;
    let reactServerPrerenderStore = null;
    const setMetadataHeader = (name)=>{
        metadata.headers ??= {};
        metadata.headers[name] = res.getHeader(name);
    };
    const setHeader = (name, value1)=>{
        res.setHeader(name, value1);
        setMetadataHeader(name);
        return res;
    };
    const appendHeader = (name, value1)=>{
        if (Array.isArray(value1)) {
            value1.forEach((item)=>{
                res.appendHeader(name, item);
            });
        } else {
            res.appendHeader(name, value1);
        }
        setMetadataHeader(name);
    };
    const selectStaleTime = (0, _staletime.createSelectStaleTime)(experimental);
    const { clientModules } = (0, _manifestssingleton.getClientReferenceManifest)();
    let prerenderStore = null;
    try {
        if (cacheComponents) {
            /**
       * cacheComponents with PPR
       *
       * The general approach is to render the RSC stream first allowing any cache reads to resolve.
       * Once we have settled all cache reads we restart the render and abort after a single Task.
       *
       * Unlike with the non PPR case we can't synchronously abort the render when a dynamic API is used
       * during the initial render because we need to ensure all caches can be filled as part of the initial Task
       * and a synchronous abort might prevent us from filling all caches.
       *
       * Once the render is complete we allow the SSR render to finish and use a combination of the postponed state
       * and the reactServerIsDynamic value to determine how to treat the resulting render
       */ // The prerender controller represents the lifetime of the prerender. It
            // will be aborted when a task is complete or a synchronously aborting API
            // is called. Notably, during prospective prerenders, this does not
            // actually terminate the prerender itself, which will continue until all
            // caches are filled.
            const initialServerPrerenderController = new AbortController();
            // This controller is used to abort the React prerender.
            const initialServerReactController = new AbortController();
            // This controller represents the lifetime of the React prerender. Its
            // signal can be used for any I/O operation to abort the I/O and/or to
            // reject, when prerendering aborts. This includes our own hanging
            // promises for accessing request data, and for fetch calls. It might be
            // replaced in the future by React.cacheSignal(). It's aborted after the
            // React controller, so that no pending I/O can register abort listeners
            // that are called before React's abort listener is called. This ensures
            // that pending I/O is not rejected too early when aborting the prerender.
            // Notably, during the prospective prerender, it is different from the
            // prerender controller because we don't want to end the React prerender
            // until all caches are filled.
            const initialServerRenderController = new AbortController();
            // The cacheSignal helps us track whether caches are still filling or we are ready
            // to cut the render off.
            const cacheSignal = new _cachesignal.CacheSignal();
            // If a prefilled immutable render resume data cache is provided, e.g.
            // when prerendering an optional fallback shell after having prerendered
            // pages with defined params, we use this instead of a mutable prerender
            // resume data cache.
            const resumeDataCache = renderOpts.renderResumeDataCache ?? (0, _resumedatacache.createPrerenderResumeDataCache)();
            reactServerPrerenderResultIsDynamic = null;
            reactServerResumeDataCache = resumeDataCache;
            reactServerPrerenderStore = null;
            const initialServerPayloadPrerenderStore = {
                type: 'prerender',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                // While this render signal isn't going to be used to abort a React render while getting the RSC payload
                // various request data APIs bind to this controller to reject after completion.
                renderSignal: initialServerRenderController.signal,
                // When we generate the RSC payload we might abort this controller due to sync IO
                // but we don't actually care about sync IO in this phase so we use a throw away controller
                // that isn't connected to anything
                controller: new AbortController(),
                stagedRendering: null,
                // During the initial prerender we need to track all cache reads to ensure
                // we render long enough to fill every cache it is possible to visit during
                // the final prerender.
                cacheSignal,
                dynamicTracking: null,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ],
                resumeDataCache,
                hmrRefreshHash: undefined,
                // We don't track vary params during initial prerender, only the final one
                varyParamsAccumulator: null,
                runtimeDataAccessed: null,
                shouldAttemptStaticPrefetch: null,
                isFallbackUpgradeable: renderOpts.isFallbackUpgradeable === true
            };
            // We're not going to use the result of this render because the only time it could be used
            // is if it completes in a microtask and that's likely very rare for any non-trivial app
            const initialServerPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialServerPayloadPrerenderStore, getRSCPayload, tree, ctx, {
                is404: res.statusCode === 404
            });
            const initialServerPrerenderStore = prerenderStore = {
                type: 'prerender',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                renderSignal: initialServerRenderController.signal,
                controller: initialServerPrerenderController,
                stagedRendering: null,
                // During the initial prerender we need to track all cache reads to ensure
                // we render long enough to fill every cache it is possible to visit during
                // the final prerender.
                cacheSignal,
                dynamicTracking: null,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ],
                resumeDataCache,
                hmrRefreshHash: undefined,
                // We don't track vary params during initial prerender, only the final one
                varyParamsAccumulator: null,
                runtimeDataAccessed: null,
                shouldAttemptStaticPrefetch: null,
                isFallbackUpgradeable: renderOpts.isFallbackUpgradeable === true
            };
            const initialPrerenderOptions = {
                filterStackFrame,
                onError: (err)=>{
                    const digest = (0, _createerrorhandler.getDigestForWellKnownError)(err);
                    if (digest) {
                        return digest;
                    }
                    if ((0, _reactlargeshellerror.isReactLargeShellError)(err)) {
                        // TODO: Aggregate
                        console.error(err);
                        return undefined;
                    }
                    if (initialServerPrerenderController.signal.aborted) {
                        // The render aborted before this error was handled which indicates
                        // the error is caused by unfinished components within the render
                        return;
                    } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
                        (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
                    }
                },
                // We don't want to stop rendering until the cacheSignal is complete so we pass
                // a different signal to this render call than is used by dynamic APIs to signify
                // transitioning out of the prerender environment
                signal: initialServerReactController.signal
            };
            const pendingInitialServerResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialServerPrerenderStore, (0, _streamops.getServerPrerender)(ComponentMod), initialServerPayload, clientModules, initialPrerenderOptions);
            // The listener to abort our own render controller must be added after
            // React has added its listener, to ensure that pending I/O is not
            // aborted/rejected too early.
            initialServerReactController.signal.addEventListener('abort', ()=>{
                initialServerRenderController.abort();
                initialServerPrerenderController.abort();
            }, {
                once: true
            });
            // Wait for all caches to be finished filling and for async imports to resolve
            (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
            await cacheSignal.cacheReady();
            initialServerReactController.abort();
            // We don't need to continue the prerender process if we already
            // detected invalid dynamic usage in the initial prerender phase.
            if (workStore.invalidDynamicUsageError) {
                (0, _dynamicrendering.logDisallowedDynamicError)(workStore, workStore.invalidDynamicUsageError);
                throw new _staticgenerationbailout.StaticGenBailoutError();
            }
            let initialServerResult;
            try {
                initialServerResult = await (0, _apprenderprerenderutils.createReactServerPrerenderResult)(pendingInitialServerResult);
            } catch (err) {
                if (initialServerReactController.signal.aborted || initialServerPrerenderController.signal.aborted) {
                // These are expected errors that might error the prerender. we ignore them.
                } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
                    // We don't normally log these errors because we are going to retry anyway but
                    // it can be useful for debugging Next.js itself to get visibility here when needed
                    (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
                }
            }
            if (initialServerResult) {
                const initialClientPrerenderController = new AbortController();
                const initialClientReactController = new AbortController();
                const initialClientRenderController = new AbortController();
                const initialClientPrerenderStore = {
                    type: 'prerender-client',
                    phase: 'render',
                    rootParams,
                    fallbackRouteParams,
                    implicitTags,
                    renderSignal: initialClientRenderController.signal,
                    controller: initialClientPrerenderController,
                    // For HTML Generation the only cache tracked activity
                    // is module loading, which has it's own cache signal
                    cacheSignal: null,
                    dynamicTracking: null,
                    revalidate: _constants1.INFINITE_CACHE,
                    expire: _constants1.INFINITE_CACHE,
                    stale: _constants1.INFINITE_CACHE,
                    tags: [
                        ...implicitTags.tags
                    ],
                    resumeDataCache,
                    hmrRefreshHash: undefined,
                    // Client prerenders don't track server param access
                    varyParamsAccumulator: null
                };
                const pendingInitialClientResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialClientPrerenderStore, _streamops.getClientPrerender, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
                /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                    reactServerStream: initialServerResult.asUnclosingStream(),
                    reactDebugStream: undefined,
                    debugEndTime: undefined,
                    preinitScripts: preinitScripts,
                    ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                    nonce: nonce,
                    images: ctx.renderOpts.images
                }), {
                    signal: initialClientReactController.signal,
                    onError: (err)=>{
                        const digest = (0, _createerrorhandler.getDigestForWellKnownError)(err);
                        if (digest) {
                            return digest;
                        }
                        if ((0, _reactlargeshellerror.isReactLargeShellError)(err)) {
                            // TODO: Aggregate
                            console.error(err);
                            return undefined;
                        }
                        if (initialClientReactController.signal.aborted) {
                        // These are expected errors that might error the prerender. we ignore them.
                        } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
                            // We don't normally log these errors because we are going to retry anyway but
                            // it can be useful for debugging Next.js itself to get visibility here when needed
                            (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
                        }
                    },
                    bootstrapScriptContent,
                    bootstrapScripts: [
                        bootstrapScript
                    ]
                });
                // The listener to abort our own render controller must be added after
                // React has added its listener, to ensure that pending I/O is not
                // aborted/rejected too early.
                initialClientReactController.signal.addEventListener('abort', ()=>{
                    initialClientRenderController.abort();
                }, {
                    once: true
                });
                pendingInitialClientResult.catch((err)=>{
                    if (initialClientReactController.signal.aborted || (0, _dynamicrendering.isPrerenderInterruptedError)(err)) {
                    // These are expected errors that might error the prerender. we ignore them.
                    } else if (process.env.NEXT_DEBUG_BUILD || process.env.__NEXT_VERBOSE_LOGGING) {
                        // We don't normally log these errors because we are going to retry anyway but
                        // it can be useful for debugging Next.js itself to get visibility here when needed
                        (0, _prospectiverenderutils.printDebugThrownValueForProspectiveRender)(err, workStore.route, _prospectiverenderutils.Phase.ProspectiveRender);
                    }
                });
                // This is mostly needed for dynamic `import()`s in client components.
                // Promises passed to client were already awaited above (assuming that they came from cached functions)
                (0, _trackmoduleloadingexternal.trackPendingModules)(cacheSignal);
                await cacheSignal.cacheReady();
                _workunitasyncstorageexternal.workUnitAsyncStorage.run(initialClientPrerenderStore, initialClientReactController.abort.bind(initialClientReactController));
            }
            const finalServerReactController = new AbortController();
            const finalServerRenderController = new AbortController();
            const varyParamsAccumulator = (0, _varyparams.createResponseVaryParamsAccumulator)();
            const finalStageController = new _stagedrendering.StagedRenderingController({
                abortSignal: finalServerRenderController.signal,
                abandonController: null,
                syncIO: _stagedrendering.SyncIOMode.AllowedInDynamic,
                finalStage: _stagedrendering.RenderStage.Static
            });
            // Records runtime data accesses from the payload and render stores
            // below into the RSC payload (as `u`), resolved `true` at the moment
            // of first access so the fulfillment row is serialized at the stream
            // position where it happened. Used when generating per-segment
            // prefetch responses. Request data props (params, searchParams) are
            // created while the RSC payload is constructed, under the payload
            // store; both stores share the same promise so it observes accesses
            // from both.
            const runtimeDataAccessed = (0, _promisewithresolvers.createPromiseWithResolvers)();
            // Companion cell holding this prerender's static-prefetch measurement
            // directly — the value that becomes the route's build-constant hint:
            // starts true, and a disqualifying runtime-data access flips it false
            // — fallback-param accesses on an upgradeable route don't (see
            // trackRuntimeDataAccessed, which applies the rule at access time).
            // Read after the prerender settles by
            // collectSegmentData below. Shared between both stores for the same
            // reason as the promise.
            const shouldAttemptStaticPrefetch = {
                current: true
            };
            const finalServerPayloadPrerenderStore = {
                type: 'prerender',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                // While this render signal isn't going to be used to abort a React render while getting the RSC payload
                // various request data APIs bind to this controller to reject after completion.
                renderSignal: finalServerRenderController.signal,
                // When we generate the RSC payload we might abort this controller due to sync IO
                // but we don't actually care about sync IO in this phase so we use a throw away controller
                // that isn't connected to anything
                controller: new AbortController(),
                // NOTE: we're not using the stage controller for sync IO tracking,
                // so this doesn't break the "throwaway abort controller" trick above.
                stagedRendering: finalStageController,
                // All caches we could read must already be filled so no tracking is necessary
                cacheSignal: null,
                dynamicTracking: null,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ],
                resumeDataCache,
                hmrRefreshHash: undefined,
                varyParamsAccumulator,
                runtimeDataAccessed,
                shouldAttemptStaticPrefetch,
                isFallbackUpgradeable: renderOpts.isFallbackUpgradeable === true
            };
            const shellByteLengthDeferred = (0, _promisewithresolvers.createPromiseWithResolvers)();
            const finalServerPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalServerPayloadPrerenderStore, getRSCPayload, tree, ctx, {
                is404: res.statusCode === 404,
                shellByteLengthPromise: shellByteLengthDeferred.promise
            });
            let staleTimeIterable;
            if (cachedNavigations) {
                staleTimeIterable = new _staletime.StaleTimeIterable();
                finalServerPayload.s = staleTimeIterable;
            }
            if (shouldGenerateStaticFlightData(workStore)) {
                // Embed the runtime data access tracking in the payload so
                // collectSegmentData can replay it per stage. Only needed when the
                // Flight data will be decomposed into segment prefetches below.
                finalServerPayload.u = runtimeDataAccessed.promise;
            }
            const serverDynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(isDebugDynamicAccesses);
            let resultIsPartial = false;
            const finalServerPrerenderStore = prerenderStore = {
                type: 'prerender',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                renderSignal: finalServerRenderController.signal,
                controller: finalServerReactController,
                stagedRendering: finalStageController,
                // All caches we could read must already be filled so no tracking is necessary
                cacheSignal: null,
                dynamicTracking: serverDynamicTracking,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ],
                resumeDataCache,
                hmrRefreshHash: undefined,
                varyParamsAccumulator,
                runtimeDataAccessed,
                shouldAttemptStaticPrefetch,
                isFallbackUpgradeable: renderOpts.isFallbackUpgradeable === true
            };
            if (staleTimeIterable !== undefined) {
                (0, _staletime.trackStaleTime)(finalServerPrerenderStore, staleTimeIterable, selectStaleTime);
            }
            const streamState = createStreamPendingState();
            const collectedChunks = createPrerenderChunksAccumulator();
            const collectedChunksByStage = createStageChunksAccumulator();
            const collectChunk = (chunk)=>{
                collectPrerenderChunk(collectedChunks, finalServerReactController.signal, chunk);
                collectStageChunk(collectedChunksByStage, finalStageController.currentStage, chunk);
            };
            let didHandleUnexpectedAbort = false;
            /**
       * @returns - whether or not the task should be skipped
       * because the render was already aborted.
       * */ const checkUnexpectedAbort = ()=>{
                if (finalServerReactController.signal.aborted) {
                    // If the server controller is already aborted, then we must have encountered sync IO
                    if (!didHandleUnexpectedAbort) {
                        didHandleUnexpectedAbort = true;
                        onUnexpectedAbort();
                    }
                    return true;
                }
                // Not aborted.
                return false;
            };
            const onUnexpectedAbort = ()=>{
                resultIsPartial = true;
                // FIXME(NAR-810): If we're already aborted due to Sync IO, there should be no need to
                // finish the accumulators. However, it seems like in `--debug-prerender`
                // the stream will stay open if we don't settle these here.
                if (process.env.NODE_ENV === 'development') {
                    if (staleTimeIterable !== undefined) {
                        staleTimeIterable.close();
                    }
                    runtimeDataAccessed.resolve(false);
                    (0, _varyparams.finishAccumulatingVaryParams)(varyParamsAccumulator);
                }
            };
            let debugEndTime = undefined;
            let didLinkDataUnblockNewContent = false;
            await (0, _apprenderrenderutils.runInSequentialTasks)(async ()=>{
                if (process.env.NODE_ENV === 'development') {
                    // The end time should be tracked whenever we abort.
                    // We defensively do this before React runs its abort listener,
                    // although in practice this shouldn't matter.
                    finalServerReactController.signal.addEventListener('abort', ()=>{
                        debugEndTime = performance.timeOrigin + performance.now();
                    }, {
                        once: true
                    });
                }
                finalStageController.advanceStage(_stagedrendering.RenderStage.ShellStatic);
                let stream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalServerPrerenderStore, ComponentMod.renderToReadableStream, finalServerPayload, clientModules, {
                    filterStackFrame,
                    onError: (err)=>{
                        return serverComponentsErrorHandler(err);
                    },
                    signal: finalServerReactController.signal
                });
                // The listener to abort our own render controller must be added
                // after React has added its listener, to ensure that pending I/O
                // is not aborted/rejected too early.
                finalServerReactController.signal.addEventListener('abort', ()=>{
                    finalServerRenderController.abort();
                }, {
                    once: true
                });
                // Note: this await will only resolve after the last task (unless sync IO aborts the render earlier)
                // We await it here so that if the stream errors, it's not an unhandled rejection.
                await iterateStreamingPrerenderChunks(stream, finalServerReactController.signal, collectChunk, streamState);
            }, ()=>{
                if (checkUnexpectedAbort()) return;
                finalStageController.advanceStage(_stagedrendering.RenderStage.Static);
            }, ()=>{
                if (checkUnexpectedAbort()) return;
                // Finish the accumulators. We need to wait for Flight to flush the result into the stream,
                // which is scheduled in a (fast) immediate, so we do this in a separate task
                // (fast immediates will be drained at the end of the task, so in the next task we know we're done flushing)
                // If new chunks were emitted in the static stage
                // (after unblocking link data, i.e. static params)
                // then the prerender uses link data.
                // NOTE: we must capture this *before* resolving staleTime/varyParams,
                // which always emit new static chunks.
                didLinkDataUnblockNewContent = collectedChunksByStage.staticChunks.length > collectedChunksByStage.shellStaticChunks.length;
                // Now that the prerendering is complete, we know the final stale
                // time and vary params. Close the stale time iterable and resolve
                // the vary params thenable so Flight can serialize their values
                // into the stream. The timing here is important: both were
                // included in the Flight payload, but they can only be serialized
                // at the very end, after all the components have finished.
                if (staleTimeIterable !== undefined) {
                    staleTimeIterable.close();
                }
                // Idempotent: a no-op if a runtime data access already resolved it
                // `true`. The `false` row lands here, after all stage content.
                runtimeDataAccessed.resolve(false);
                (0, _varyparams.finishAccumulatingVaryParams)(varyParamsAccumulator);
                shellByteLengthDeferred.resolve(didLinkDataUnblockNewContent ? collectedChunksByStage.shellStaticChunks.reduce((acc, chunk)=>acc + chunk.byteLength, 0) : null);
            }, ()=>{
                if (checkUnexpectedAbort()) return;
                if (streamState.isPending) {
                    // If prerenderIsPending then we have blocked for longer than a Task and we assume
                    // there is something unfinished.
                    resultIsPartial = true;
                }
                _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalServerPrerenderStore, finalServerReactController.abort.bind(finalServerReactController));
            });
            // If a sync IO error occurred, there's no point continuing.
            // NOTE: this early exit is load-bearing. The way we simulate a halt
            // in a render (ignoring all chunks emitted after an abort)
            // can lead to a blocked root chunk (if it didn't flush before the abort).
            // This means that deserializing the RSC payload can hang in unexpected places --
            // normally, we can at least get the outer object with hanging promises inside.
            (0, _dynamicrendering.throwIfSyncIOUsed)(workStore, serverDynamicTracking);
            const reactServerResult = reactServerPrerenderResult = new _apprenderprerenderutils.ReactServerPrerenderResult(collectedChunks.prerenderChunks);
            reactServerPrerenderResultIsDynamic = resultIsPartial;
            reactServerPrerenderStore = finalServerPrerenderStore;
            if (shouldGenerateStaticFlightData(workStore)) {
                metadata.flightData = Buffer.concat(cachedNavigations ? prependIsPartialByteToChunks(reactServerResult.asChunks(), resultIsPartial) : reactServerResult.asChunks());
                // collectSegmentData needs the raw flight data without the marker byte.
                const flightData = cachedNavigations ? metadata.flightData.subarray(1) : metadata.flightData;
                await collectSegmentData(flightData, finalServerPrerenderStore, ComponentMod, renderOpts, ctx.pagePath, metadata);
            }
            const clientDynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(isDebugDynamicAccesses);
            const finalClientReactController = new AbortController();
            const finalClientRenderController = new AbortController();
            const finalClientPrerenderStore = {
                type: 'prerender-client',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                renderSignal: finalClientRenderController.signal,
                controller: finalClientReactController,
                // No APIs require a cacheSignal through the workUnitStore during the HTML prerender
                cacheSignal: null,
                dynamicTracking: clientDynamicTracking,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ],
                resumeDataCache,
                hmrRefreshHash: undefined,
                // Client prerenders don't track server param access
                varyParamsAccumulator: null
            };
            let dynamicValidation = (0, _dynamicrendering.createDynamicValidationState)();
            const finalClientOnHeaders = (0, _streamops.createOnHeadersCallback)(appendHeader);
            let { prelude: unprocessedPrelude, postponed } = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
                const stream = process.env.NODE_ENV === 'development' && collectedChunks.allChunks ? (0, _streamutils.createNodeStreamWithLateRelease)(collectedChunks.prerenderChunks, collectedChunks.allChunks, finalClientReactController.signal) : reactServerResult.asUnclosingStream();
                const pendingFinalClientResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalClientPrerenderStore, _streamops.getClientPrerender, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
                /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                    reactServerStream: stream,
                    reactDebugStream: undefined,
                    debugEndTime: debugEndTime,
                    preinitScripts: preinitScripts,
                    ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                    nonce: nonce,
                    images: ctx.renderOpts.images
                }), {
                    signal: finalClientReactController.signal,
                    onError: (err, errorInfo)=>{
                        if ((0, _dynamicrendering.isPrerenderInterruptedError)(err) || finalClientReactController.signal.aborted) {
                            const componentStack = errorInfo.componentStack;
                            if (typeof componentStack === 'string') {
                                (0, _dynamicrendering.trackAllowedDynamicAccess)(err, workStore, componentStack, dynamicValidation, clientDynamicTracking);
                            }
                            return;
                        }
                        return htmlRendererErrorHandler(err, errorInfo);
                    },
                    onHeaders: finalClientOnHeaders,
                    maxHeadersLength: reactMaxHeadersLength,
                    bootstrapScriptContent,
                    bootstrapScripts: [
                        bootstrapScript
                    ]
                });
                // The listener to abort our own render controller must be added
                // after React has added its listener, to ensure that pending I/O is
                // not aborted/rejected too early.
                finalClientReactController.signal.addEventListener('abort', ()=>{
                    finalClientRenderController.abort();
                }, {
                    once: true
                });
                return pendingFinalClientResult;
            }, ()=>{
                _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalClientPrerenderStore, finalClientReactController.abort.bind(finalClientReactController));
            });
            metadata.hasPendingUi = postponed != null;
            const { prelude, preludeIsEmpty } = await (0, _streamops.processPrelude)(unprocessedPrelude);
            (0, _dynamicrendering.throwIfDisallowedDynamic)(workStore, preludeIsEmpty ? _dynamicrendering.PreludeState.Empty : _dynamicrendering.PreludeState.Full, dynamicValidation, serverDynamicTracking, allowEmptyStaticShell);
            const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                polyfills,
                renderServerInsertedHTML,
                serverCapturedErrors: allCapturedErrors,
                basePath,
                tracingMetadata: tracingMetadata
            });
            let htmlStream = prelude;
            if (resultIsPartial) {
                if (postponed != null) {
                    metadata.postponed = await (0, _postponedstate.getDynamicHTMLPostponedState)(postponed, preludeIsEmpty ? _postponedstate.DynamicHTMLPreludeState.Empty : _postponedstate.DynamicHTMLPreludeState.Full, fallbackRouteParams, resumeDataCache, cacheComponents);
                } else {
                    metadata.postponed = await (0, _postponedstate.getDynamicDataPostponedState)(resumeDataCache, cacheComponents);
                }
                reactServerResult.consume();
                return {
                    digestErrorsMap: reactServerErrorsByDigest,
                    ssrErrors: allCapturedErrors,
                    stream: await (0, _streamops.continueDynamicPrerender)(htmlStream, {
                        getServerInsertedHTML,
                        getServerInsertedMetadata,
                        deploymentId: ctx.sharedContext.deploymentId
                    }),
                    dynamicAccess: (0, _dynamicrendering.consumeDynamicAccess)(serverDynamicTracking, clientDynamicTracking),
                    // TODO: Should this include the SSR pass?
                    collectedRevalidate: finalServerPrerenderStore.revalidate,
                    collectedExpire: finalServerPrerenderStore.expire,
                    collectedStale: selectStaleTime(finalServerPrerenderStore.stale),
                    collectedTags: finalServerPrerenderStore.tags,
                    renderResumeDataCache: (0, _resumedatacache.createRenderResumeDataCache)(resumeDataCache)
                };
            } else if (postponed != null) {
                // We postponed but nothing dynamic was used. We resume the render now and immediately abort it
                // so we can set all the postponed boundaries to client render mode before we store the HTML response
                const foreverStream = (0, _streamops.createPendingStream)();
                const resumePrelude = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(finalServerPrerenderStore, _streamops.resumeAndAbort, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
                /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                    reactServerStream: foreverStream,
                    reactDebugStream: undefined,
                    debugEndTime: undefined,
                    preinitScripts: ()=>{},
                    ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                    nonce: nonce,
                    images: ctx.renderOpts.images
                }), JSON.parse(JSON.stringify(postponed)), {
                    signal: (0, _dynamicrendering.createRenderInBrowserAbortSignal)(),
                    onError: htmlRendererErrorHandler,
                    nonce
                });
                // First we write everything from the prerender, then we write everything from the aborted resume render
                htmlStream = (0, _streamops.chainStreams)(prelude, resumePrelude);
            }
            if (workStore.forceDynamic) {
                throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError('Invariant: a Page with `dynamic = "force-dynamic"` did not trigger the dynamic pathway. This is a bug in Next.js'), "__NEXT_ERROR_CODE", {
                    value: "E598",
                    enumerable: false,
                    configurable: true
                });
            }
            const stream = await continueStaticPrerenderWithInlinedData(htmlStream, reactServerResult, fallbackRouteParams, createInlinedDataStream, formState, nonce, getServerInsertedHTML, getServerInsertedMetadata, ctx.sharedContext.deploymentId, ComponentMod, renderFlightStream, clientModules, filterStackFrame, serverComponentsErrorHandler);
            return {
                digestErrorsMap: reactServerErrorsByDigest,
                ssrErrors: allCapturedErrors,
                stream,
                dynamicAccess: (0, _dynamicrendering.consumeDynamicAccess)(serverDynamicTracking, clientDynamicTracking),
                collectedRevalidate: finalServerPrerenderStore.revalidate,
                collectedExpire: finalServerPrerenderStore.expire,
                collectedStale: selectStaleTime(finalServerPrerenderStore.stale),
                collectedTags: finalServerPrerenderStore.tags,
                renderResumeDataCache: (0, _resumedatacache.createRenderResumeDataCache)(resumeDataCache)
            };
        } else if (experimental.isRoutePPREnabled) {
            // We're statically generating with PPR and need to do dynamic tracking
            let dynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(isDebugDynamicAccesses);
            const resumeDataCache = (0, _resumedatacache.createPrerenderResumeDataCache)();
            const pprReactServerPrerenderStore = prerenderStore = {
                type: 'prerender-ppr',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                dynamicTracking,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ],
                resumeDataCache
            };
            const RSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(pprReactServerPrerenderStore, getRSCPayload, tree, ctx, {
                is404: res.statusCode === 404
            });
            let reactServerResult;
            reactServerResult = reactServerPrerenderResult = await (0, _apprenderprerenderutils.createReactServerPrerenderResultFromRender)(_workunitasyncstorageexternal.workUnitAsyncStorage.run(pprReactServerPrerenderStore, renderFlightStream, ComponentMod, RSCPayload, clientModules, {
                filterStackFrame,
                onError: serverComponentsErrorHandler
            }));
            const ssrPrerenderStore = {
                type: 'prerender-ppr',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                dynamicTracking,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ],
                resumeDataCache
            };
            const pprOnHeaders = (0, _streamops.createOnHeadersCallback)(appendHeader);
            const { prelude: unprocessedPrelude, postponed } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(ssrPrerenderStore, _streamops.getClientPrerender, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
            /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                reactServerStream: reactServerResult.asUnclosingStream(),
                reactDebugStream: undefined,
                debugEndTime: undefined,
                preinitScripts: preinitScripts,
                ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                nonce: nonce,
                images: ctx.renderOpts.images
            }), {
                onError: htmlRendererErrorHandler,
                onHeaders: pprOnHeaders,
                maxHeadersLength: reactMaxHeadersLength,
                bootstrapScriptContent,
                bootstrapScripts: [
                    bootstrapScript
                ]
            });
            metadata.hasPendingUi = postponed != null;
            const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                polyfills,
                renderServerInsertedHTML,
                serverCapturedErrors: allCapturedErrors,
                basePath,
                tracingMetadata: tracingMetadata
            });
            // After awaiting here we've waited for the entire RSC render to complete. Crucially this means
            // that when we detect whether we've used dynamic APIs below we know we'll have picked up even
            // parts of the React Server render that might not be used in the SSR render.
            const flightData = await (0, _streamops.streamToBuffer)(reactServerResult.asStream());
            if (shouldGenerateStaticFlightData(workStore)) {
                metadata.flightData = flightData;
                await collectSegmentData(flightData, ssrPrerenderStore, ComponentMod, renderOpts, ctx.pagePath, metadata);
            }
            const { prelude, preludeIsEmpty } = await (0, _streamops.processPrelude)(unprocessedPrelude);
            /**
       * When prerendering there are three outcomes to consider
       *
       *   Dynamic HTML:      The prerender has dynamic holes (caused by using Next.js Dynamic Rendering APIs)
       *                      We will need to resume this result when requests are handled and we don't include
       *                      any server inserted HTML or inlined flight data in the static HTML
       *
       *   Dynamic Data:      The prerender has no dynamic holes but dynamic APIs were used. We will not
       *                      resume this render when requests are handled but we will generate new inlined
       *                      flight data since it is dynamic and differences may end up reconciling on the client
       *
       *   Static:            The prerender has no dynamic holes and no dynamic APIs were used. We statically encode
       *                      all server inserted HTML and flight data
       */ // First we check if we have any dynamic holes in our HTML prerender
            if ((0, _dynamicrendering.accessedDynamicData)(dynamicTracking.dynamicAccesses)) {
                if (postponed != null) {
                    // Dynamic HTML case.
                    metadata.postponed = await (0, _postponedstate.getDynamicHTMLPostponedState)(postponed, preludeIsEmpty ? _postponedstate.DynamicHTMLPreludeState.Empty : _postponedstate.DynamicHTMLPreludeState.Full, fallbackRouteParams, resumeDataCache, cacheComponents);
                } else {
                    // Dynamic Data case.
                    metadata.postponed = await (0, _postponedstate.getDynamicDataPostponedState)(resumeDataCache, cacheComponents);
                }
                // Regardless of whether this is the Dynamic HTML or Dynamic Data case we need to ensure we include
                // server inserted html in the static response because the html that is part of the prerender may depend on it
                // It is possible in the set of stream transforms for Dynamic HTML vs Dynamic Data may differ but currently both states
                // require the same set so we unify the code path here
                reactServerResult.consume();
                const pprDynamicOpts = {
                    getServerInsertedHTML,
                    getServerInsertedMetadata,
                    deploymentId: ctx.sharedContext.deploymentId
                };
                return {
                    digestErrorsMap: reactServerErrorsByDigest,
                    ssrErrors: allCapturedErrors,
                    stream: await (0, _streamops.continueDynamicPrerender)(prelude, pprDynamicOpts),
                    dynamicAccess: dynamicTracking.dynamicAccesses,
                    // TODO: Should this include the SSR pass?
                    collectedRevalidate: pprReactServerPrerenderStore.revalidate,
                    collectedExpire: pprReactServerPrerenderStore.expire,
                    collectedStale: selectStaleTime(pprReactServerPrerenderStore.stale),
                    collectedTags: pprReactServerPrerenderStore.tags
                };
            } else if (fallbackRouteParams && fallbackRouteParams.size > 0) {
                // Rendering the fallback case.
                metadata.postponed = await (0, _postponedstate.getDynamicDataPostponedState)(resumeDataCache, cacheComponents);
                const pprFallbackDynamicOpts = {
                    getServerInsertedHTML,
                    getServerInsertedMetadata,
                    deploymentId: ctx.sharedContext.deploymentId
                };
                return {
                    digestErrorsMap: reactServerErrorsByDigest,
                    ssrErrors: allCapturedErrors,
                    stream: await (0, _streamops.continueDynamicPrerender)(prelude, pprFallbackDynamicOpts),
                    dynamicAccess: dynamicTracking.dynamicAccesses,
                    // TODO: Should this include the SSR pass?
                    collectedRevalidate: pprReactServerPrerenderStore.revalidate,
                    collectedExpire: pprReactServerPrerenderStore.expire,
                    collectedStale: selectStaleTime(pprReactServerPrerenderStore.stale),
                    collectedTags: pprReactServerPrerenderStore.tags
                };
            } else {
                // Static case
                // We still have not used any dynamic APIs. At this point we can produce an entirely static prerender response
                if (workStore.forceDynamic) {
                    throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError('Invariant: a Page with `dynamic = "force-dynamic"` did not trigger the dynamic pathway. This is a bug in Next.js'), "__NEXT_ERROR_CODE", {
                        value: "E598",
                        enumerable: false,
                        configurable: true
                    });
                }
                let htmlStream = prelude;
                if (postponed != null) {
                    // We postponed but nothing dynamic was used. We resume the render now and immediately abort it
                    // so we can set all the postponed boundaries to client render mode before we store the HTML response
                    const foreverStream = (0, _streamops.createPendingStream)();
                    const resumePrelude = await (0, _streamops.resumeAndAbort)(// eslint-disable-next-line @next/internal/no-ambiguous-jsx
                    /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                        reactServerStream: foreverStream,
                        reactDebugStream: undefined,
                        debugEndTime: undefined,
                        preinitScripts: ()=>{},
                        ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                        nonce: nonce,
                        images: ctx.renderOpts.images
                    }), JSON.parse(JSON.stringify(postponed)), {
                        signal: (0, _dynamicrendering.createRenderInBrowserAbortSignal)(),
                        onError: htmlRendererErrorHandler,
                        nonce
                    });
                    // First we write everything from the prerender, then we write everything from the aborted resume render
                    htmlStream = (0, _streamops.chainStreams)(prelude, resumePrelude);
                }
                return {
                    digestErrorsMap: reactServerErrorsByDigest,
                    ssrErrors: allCapturedErrors,
                    stream: await (0, _streamops.continueStaticPrerender)(htmlStream, {
                        inlinedDataStream: createInlinedDataStream(reactServerResult.consumeAsStream(), nonce, formState),
                        getServerInsertedHTML,
                        getServerInsertedMetadata,
                        deploymentId: ctx.sharedContext.deploymentId
                    }),
                    dynamicAccess: dynamicTracking.dynamicAccesses,
                    // TODO: Should this include the SSR pass?
                    collectedRevalidate: pprReactServerPrerenderStore.revalidate,
                    collectedExpire: pprReactServerPrerenderStore.expire,
                    collectedStale: selectStaleTime(pprReactServerPrerenderStore.stale),
                    collectedTags: pprReactServerPrerenderStore.tags
                };
            }
        } else {
            const prerenderLegacyStore = prerenderStore = {
                type: 'prerender-legacy',
                phase: 'render',
                rootParams,
                implicitTags,
                revalidate: _constants1.INFINITE_CACHE,
                expire: _constants1.INFINITE_CACHE,
                stale: _constants1.INFINITE_CACHE,
                tags: [
                    ...implicitTags.tags
                ]
            };
            // This is a regular static generation. We don't do dynamic tracking because we rely on
            // the old-school dynamic error handling to bail out of static generation
            const RSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderLegacyStore, getRSCPayload, tree, ctx, {
                is404: res.statusCode === 404
            });
            let reactServerResult;
            reactServerResult = reactServerPrerenderResult = await (0, _apprenderprerenderutils.createReactServerPrerenderResultFromRender)(_workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderLegacyStore, renderFlightStream, ComponentMod, RSCPayload, clientModules, {
                filterStackFrame,
                onError: serverComponentsErrorHandler
            }));
            const { stream: htmlStream } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderLegacyStore, renderFizzStream, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
            /*#__PURE__*/ (0, _jsxruntime.jsx)(App, {
                reactServerStream: reactServerResult.asUnclosingStream(),
                reactDebugStream: undefined,
                debugEndTime: undefined,
                preinitScripts: preinitScripts,
                ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                nonce: nonce,
                images: ctx.renderOpts.images
            }), {
                onError: htmlRendererErrorHandler,
                nonce,
                bootstrapScriptContent,
                bootstrapScripts: [
                    bootstrapScript
                ]
            }, {
                waitForAllReady: true
            });
            if (shouldGenerateStaticFlightData(workStore)) {
                const flightData = await (0, _streamops.streamToBuffer)(reactServerResult.asStream());
                metadata.flightData = flightData;
                await collectSegmentData(flightData, prerenderLegacyStore, ComponentMod, renderOpts, ctx.pagePath, metadata);
            }
            const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                polyfills,
                renderServerInsertedHTML,
                serverCapturedErrors: allCapturedErrors,
                basePath,
                tracingMetadata: tracingMetadata
            });
            return {
                digestErrorsMap: reactServerErrorsByDigest,
                ssrErrors: allCapturedErrors,
                stream: await (0, _streamops.continueFizzStream)(htmlStream, {
                    inlinedDataStream: createInlinedDataStream(reactServerResult.consumeAsStream(), nonce, formState),
                    isStaticGeneration: true,
                    getServerInsertedHTML,
                    getServerInsertedMetadata,
                    deploymentId: ctx.sharedContext.deploymentId
                }),
                // TODO: Should this include the SSR pass?
                collectedRevalidate: prerenderLegacyStore.revalidate,
                collectedExpire: prerenderLegacyStore.expire,
                collectedStale: selectStaleTime(prerenderLegacyStore.stale),
                collectedTags: prerenderLegacyStore.tags
            };
        }
    } catch (err) {
        if ((0, _staticgenerationbailout.isStaticGenBailoutError)(err) || typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' && err.message.includes('https://nextjs.org/docs/advanced-features/static-html-export')) {
            // Ensure that "next dev" prints the red error overlay
            throw err;
        }
        // If this is a static generation error, we need to throw it so that it
        // can be handled by the caller if we're in static generation mode.
        if ((0, _hooksservercontext.isDynamicServerError)(err)) {
            throw err;
        }
        // If a bailout made it to this point, it means it wasn't wrapped inside
        // a suspense boundary.
        const shouldBailoutToCSR = (0, _bailouttocsr.isBailoutToCSRError)(err);
        if (shouldBailoutToCSR) {
            const stack = (0, _formatservererror.getStackWithoutErrorMessage)(err);
            (0, _log.error)(`${err.reason} should be wrapped in a suspense boundary at page "${pagePath}". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout\n${stack}`);
            throw err;
        }
        // If we errored when we did not have an RSC stream to read from. This is
        // not just a render error, we need to throw early.
        if (reactServerPrerenderResult === null) {
            throw err;
        }
        let errorType;
        const isHTTPAccessFallback = (0, _httpaccessfallback.isHTTPAccessFallbackError)(err);
        const isRedirect = (0, _redirecterror.isRedirectError)(err);
        if (isHTTPAccessFallback) {
            res.statusCode = (0, _httpaccessfallback.getAccessFallbackHTTPStatus)(err);
            metadata.statusCode = res.statusCode;
            errorType = (0, _httpaccessfallback.getAccessFallbackErrorTypeByStatus)(res.statusCode);
        } else if (isRedirect) {
            errorType = 'redirect';
            res.statusCode = (0, _redirect.getRedirectStatusCodeFromError)(err);
            metadata.statusCode = res.statusCode;
            const redirectUrl = (0, _addpathprefix.addPathPrefix)((0, _redirect.getURLFromRedirectError)(err), basePath);
            setHeader('location', redirectUrl);
        } else {
            res.statusCode = 500;
            metadata.statusCode = res.statusCode;
        }
        if (cacheComponents && !isHTTPAccessFallback && !isRedirect) {
            throw reactServerErrorsByDigest.get(err.digest) ?? err;
        }
        const [errorPreinitScripts, errorBootstrapScript] = (0, _requiredscripts.getRequiredScripts)(buildManifest, assetPrefix, crossOrigin, subresourceIntegrityManifest, (0, _getassetquerystring.getAssetQueryString)(ctx, false), nonce, _entryconstants.UNDERSCORE_NOT_FOUND_ROUTE_ENTRY);
        const errorBootstrapScriptContent = buildManifest.pagesChunkGroupBootstrapParams && buildManifest.chunkLoadingGlobal ? (0, _getpagefiles.getTurbopackChunkGroupBootstrap)(buildManifest.pagesChunkGroupBootstrapParams, buildManifest.chunkLoadingGlobal, [
            _entryconstants.UNDERSCORE_NOT_FOUND_ROUTE_ENTRY
        ]) : undefined;
        if (cacheComponents) {
            const originalFlightPrerenderResult = reactServerPrerenderResult;
            const originalFlightPrerenderResultIsDynamic = reactServerPrerenderResultIsDynamic;
            const originalResumeDataCache = reactServerResumeDataCache;
            const originalPrerenderStore = reactServerPrerenderStore;
            if (originalFlightPrerenderResult === null) {
                throw Object.defineProperty(new _invarianterror.InvariantError('Cache Components error recovery expected an original Flight prerender result'), "__NEXT_ERROR_CODE", {
                    value: "E1283",
                    enumerable: false,
                    configurable: true
                });
            }
            if (originalFlightPrerenderResultIsDynamic === null) {
                throw Object.defineProperty(new _invarianterror.InvariantError('Cache Components error recovery expected to know whether the original Flight prerender result was dynamic'), "__NEXT_ERROR_CODE", {
                    value: "E1282",
                    enumerable: false,
                    configurable: true
                });
            }
            if (originalResumeDataCache === null) {
                throw Object.defineProperty(new _invarianterror.InvariantError('Cache Components error recovery expected an original resume data cache'), "__NEXT_ERROR_CODE", {
                    value: "E1285",
                    enumerable: false,
                    configurable: true
                });
            }
            if (originalPrerenderStore === null) {
                throw Object.defineProperty(new _invarianterror.InvariantError('Cache Components error recovery expected an original prerender store'), "__NEXT_ERROR_CODE", {
                    value: "E1284",
                    enumerable: false,
                    configurable: true
                });
            }
            const originalCollectedStale = selectStaleTime(originalPrerenderStore.stale);
            // The final recovery still belongs to Cache Components. Render the error
            // payload with the same prerender APIs as the normal path so not-found
            // metadata can participate in static, dynamic-data, and dynamic-HTML
            // outcomes instead of being dropped from the recovery shell.
            const errorServerReactController = new AbortController();
            const errorServerRenderController = new AbortController();
            const errorServerDynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(isDebugDynamicAccesses);
            const errorPrerenderStore = {
                type: 'prerender',
                phase: 'render',
                rootParams,
                fallbackRouteParams,
                implicitTags,
                renderSignal: errorServerRenderController.signal,
                controller: errorServerReactController,
                stagedRendering: null,
                cacheSignal: null,
                dynamicTracking: errorServerDynamicTracking,
                revalidate: typeof (prerenderStore == null ? void 0 : prerenderStore.revalidate) !== 'undefined' ? prerenderStore.revalidate : _constants1.INFINITE_CACHE,
                expire: typeof (prerenderStore == null ? void 0 : prerenderStore.expire) !== 'undefined' ? prerenderStore.expire : _constants1.INFINITE_CACHE,
                stale: typeof (prerenderStore == null ? void 0 : prerenderStore.stale) !== 'undefined' ? prerenderStore.stale : _constants1.INFINITE_CACHE,
                tags: [
                    ...(prerenderStore == null ? void 0 : prerenderStore.tags) || implicitTags.tags
                ],
                resumeDataCache: originalResumeDataCache,
                hmrRefreshHash: undefined,
                varyParamsAccumulator: null,
                runtimeDataAccessed: null,
                shouldAttemptStaticPrefetch: null,
                isFallbackUpgradeable: renderOpts.isFallbackUpgradeable === true
            };
            const errorRSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(errorPrerenderStore, getErrorRSCPayload, tree, ctx, reactServerErrorsByDigest.has(err.digest) ? undefined : err, errorType, // The recovery shell only bootstraps the original Flight data. Avoid
            // blocking that shell on error-page metadata or viewport.
            false);
            const errorServerResult = await (0, _apprenderprerenderutils.createReactServerPrerenderResult)((0, _apprenderrenderutils.runInSequentialTasks)(async ()=>{
                const pendingErrorServerResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(errorPrerenderStore, (0, _streamops.getServerPrerender)(ComponentMod), errorRSCPayload, clientModules, {
                    filterStackFrame,
                    signal: errorServerReactController.signal,
                    onError: (rscError)=>{
                        return serverComponentsErrorHandler(rscError);
                    }
                });
                // The listener to abort our own render controller must be added
                // after React has added its listener, to ensure that pending I/O
                // is not aborted/rejected too early.
                errorServerReactController.signal.addEventListener('abort', ()=>{
                    errorServerRenderController.abort();
                }, {
                    once: true
                });
                const prerenderResult = await pendingErrorServerResult;
                return prerenderResult;
            }, ()=>{
                if (!errorServerReactController.signal.aborted) {
                    _workunitasyncstorageexternal.workUnitAsyncStorage.run(errorPrerenderStore, errorServerReactController.abort.bind(errorServerReactController));
                }
            }));
            try {
                const errorClientReactController = new AbortController();
                const errorClientRenderController = new AbortController();
                const errorClientDynamicTracking = (0, _dynamicrendering.createDynamicTrackingState)(isDebugDynamicAccesses);
                const errorDynamicValidation = (0, _dynamicrendering.createDynamicValidationState)();
                const errorClientPrerenderStore = {
                    type: 'prerender-client',
                    phase: 'render',
                    rootParams,
                    fallbackRouteParams,
                    implicitTags,
                    renderSignal: errorClientRenderController.signal,
                    controller: errorClientReactController,
                    cacheSignal: null,
                    dynamicTracking: errorClientDynamicTracking,
                    revalidate: errorPrerenderStore.revalidate,
                    expire: errorPrerenderStore.expire,
                    stale: errorPrerenderStore.stale,
                    tags: [
                        ...errorPrerenderStore.tags || implicitTags.tags
                    ],
                    resumeDataCache: originalResumeDataCache,
                    hmrRefreshHash: undefined,
                    varyParamsAccumulator: null
                };
                const { prelude: unprocessedErrorHtmlStream, postponed: errorPostponed } = await (0, _apprenderrenderutils.runInSequentialTasks)(()=>{
                    const pendingErrorHtmlResult = _workunitasyncstorageexternal.workUnitAsyncStorage.run(errorClientPrerenderStore, _streamops.getClientPrerender, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
                    /*#__PURE__*/ (0, _jsxruntime.jsx)(ErrorApp, {
                        reactServerStream: errorServerResult.asUnclosingStream(),
                        ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                        preinitScripts: errorPreinitScripts,
                        nonce: nonce,
                        images: ctx.renderOpts.images
                    }), {
                        nonce,
                        bootstrapScriptContent: errorBootstrapScriptContent,
                        bootstrapScripts: [
                            errorBootstrapScript
                        ],
                        formState,
                        signal: errorClientReactController.signal,
                        onError: (clientError, errorInfo)=>{
                            if ((0, _dynamicrendering.isPrerenderInterruptedError)(clientError) || errorClientReactController.signal.aborted) {
                                const componentStack = errorInfo.componentStack;
                                if (typeof componentStack === 'string') {
                                    (0, _dynamicrendering.trackAllowedDynamicAccess)(clientError, workStore, componentStack, errorDynamicValidation, errorClientDynamicTracking);
                                }
                                return;
                            }
                            return htmlRendererErrorHandler(clientError, errorInfo);
                        }
                    });
                    // The listener to abort our own render controller must be added
                    // after React has added its listener, to ensure that pending I/O
                    // is not aborted/rejected too early.
                    errorClientReactController.signal.addEventListener('abort', ()=>{
                        errorClientRenderController.abort();
                    }, {
                        once: true
                    });
                    return pendingErrorHtmlResult;
                }, ()=>{
                    _workunitasyncstorageexternal.workUnitAsyncStorage.run(errorClientPrerenderStore, errorClientReactController.abort.bind(errorClientReactController));
                });
                metadata.hasPendingUi = errorPostponed != null;
                const { prelude, preludeIsEmpty } = await (0, _streamops.processPrelude)(unprocessedErrorHtmlStream);
                if (preludeIsEmpty) {
                    console.error(`Route "${workStore.route}" did not produce a static shell while rendering its error page.`);
                    (0, _dynamicrendering.throwIfDisallowedDynamic)(workStore, _dynamicrendering.PreludeState.Empty, errorDynamicValidation, errorServerDynamicTracking, false);
                    throw new _staticgenerationbailout.StaticGenBailoutError();
                }
                const getServerInsertedHTML = (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                    polyfills,
                    renderServerInsertedHTML,
                    serverCapturedErrors: [],
                    basePath,
                    tracingMetadata: tracingMetadata
                });
                let errorHtmlStream = prelude;
                if (originalFlightPrerenderResultIsDynamic) {
                    metadata.postponed = await (0, _postponedstate.getDynamicDataPostponedState)(originalResumeDataCache, cacheComponents);
                    originalFlightPrerenderResult.consume();
                    errorServerResult.consume();
                    return {
                        digestErrorsMap: reactServerErrorsByDigest,
                        ssrErrors: allCapturedErrors,
                        stream: await (0, _streamops.continueDynamicPrerender)(errorHtmlStream, {
                            getServerInsertedHTML,
                            getServerInsertedMetadata,
                            deploymentId: ctx.sharedContext.deploymentId
                        }),
                        dynamicAccess: (0, _dynamicrendering.consumeDynamicAccess)(errorServerDynamicTracking, errorClientDynamicTracking),
                        collectedRevalidate: originalPrerenderStore.revalidate,
                        collectedExpire: originalPrerenderStore.expire,
                        collectedStale: originalCollectedStale,
                        collectedTags: originalPrerenderStore.tags,
                        renderResumeDataCache: (0, _resumedatacache.createRenderResumeDataCache)(originalResumeDataCache)
                    };
                } else if (errorPostponed != null) {
                    // We postponed but nothing dynamic was used. Resume the error shell
                    // and immediately abort it so postponed client boundaries are marked
                    // for browser rendering before the static response is stored.
                    const foreverStream = (0, _streamops.createPendingStream)();
                    const resumePrelude = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(errorPrerenderStore, _streamops.resumeAndAbort, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
                    /*#__PURE__*/ (0, _jsxruntime.jsx)(ErrorApp, {
                        reactServerStream: foreverStream,
                        ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                        preinitScripts: ()=>{},
                        nonce: nonce,
                        images: ctx.renderOpts.images
                    }), JSON.parse(JSON.stringify(errorPostponed)), {
                        signal: (0, _dynamicrendering.createRenderInBrowserAbortSignal)(),
                        onError: htmlRendererErrorHandler,
                        nonce
                    });
                    errorHtmlStream = (0, _streamops.chainStreams)(prelude, resumePrelude);
                }
                if (workStore.forceDynamic) {
                    throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError('Invariant: a Page with `dynamic = "force-dynamic"` did not trigger the dynamic pathway. This is a bug in Next.js'), "__NEXT_ERROR_CODE", {
                        value: "E598",
                        enumerable: false,
                        configurable: true
                    });
                }
                const stream = await continueStaticPrerenderWithInlinedData(errorHtmlStream, originalFlightPrerenderResult, fallbackRouteParams, createInlinedDataStream, formState, nonce, getServerInsertedHTML, getServerInsertedMetadata, ctx.sharedContext.deploymentId, ComponentMod, renderFlightStream, clientModules, filterStackFrame, serverComponentsErrorHandler);
                errorServerResult.consume();
                return {
                    digestErrorsMap: reactServerErrorsByDigest,
                    ssrErrors: allCapturedErrors,
                    stream,
                    dynamicAccess: (0, _dynamicrendering.consumeDynamicAccess)(errorServerDynamicTracking, errorClientDynamicTracking),
                    collectedRevalidate: originalPrerenderStore.revalidate,
                    collectedExpire: originalPrerenderStore.expire,
                    collectedStale: originalCollectedStale,
                    collectedTags: originalPrerenderStore.tags,
                    renderResumeDataCache: (0, _resumedatacache.createRenderResumeDataCache)(originalResumeDataCache)
                };
            } catch (finalErr) {
                if (process.env.__NEXT_DEV_SERVER && (0, _httpaccessfallback.isHTTPAccessFallbackError)(finalErr)) {
                    const { bailOnRootNotFound } = require('../../client/components/dev-root-http-access-fallback-boundary');
                    bailOnRootNotFound();
                }
                throw finalErr;
            }
        }
        const prerenderLegacyStore = {
            type: 'prerender-legacy',
            phase: 'render',
            rootParams,
            implicitTags: implicitTags,
            revalidate: typeof (prerenderStore == null ? void 0 : prerenderStore.revalidate) !== 'undefined' ? prerenderStore.revalidate : _constants1.INFINITE_CACHE,
            expire: typeof (prerenderStore == null ? void 0 : prerenderStore.expire) !== 'undefined' ? prerenderStore.expire : _constants1.INFINITE_CACHE,
            stale: typeof (prerenderStore == null ? void 0 : prerenderStore.stale) !== 'undefined' ? prerenderStore.stale : _constants1.INFINITE_CACHE,
            tags: [
                ...(prerenderStore == null ? void 0 : prerenderStore.tags) || implicitTags.tags
            ]
        };
        const errorRSCPayload = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderLegacyStore, getErrorRSCPayload, tree, ctx, reactServerErrorsByDigest.has(err.digest) ? undefined : err, errorType, // Legacy prerender recovery should include the error payload head.
        true);
        const errorServerStream = _workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderLegacyStore, renderFlightStream, ComponentMod, errorRSCPayload, clientModules, {
            filterStackFrame,
            onError: serverComponentsErrorHandler
        });
        try {
            const { stream: errorHtmlStream } = await _workunitasyncstorageexternal.workUnitAsyncStorage.run(prerenderLegacyStore, renderFizzStream, // eslint-disable-next-line @next/internal/no-ambiguous-jsx
            /*#__PURE__*/ (0, _jsxruntime.jsx)(ErrorApp, {
                reactServerStream: errorServerStream,
                ServerInsertedHTMLProvider: ServerInsertedHTMLProvider,
                preinitScripts: errorPreinitScripts,
                nonce: nonce,
                images: ctx.renderOpts.images
            }), {
                nonce,
                bootstrapScriptContent: errorBootstrapScriptContent,
                bootstrapScripts: [
                    errorBootstrapScript
                ],
                formState
            }, {
                waitForAllReady: true
            });
            if (shouldGenerateStaticFlightData(workStore)) {
                const flightData = await (0, _streamops.streamToBuffer)(reactServerPrerenderResult.asStream());
                metadata.flightData = flightData;
                await collectSegmentData(flightData, prerenderLegacyStore, ComponentMod, renderOpts, ctx.pagePath, metadata);
            }
            return {
                digestErrorsMap: reactServerErrorsByDigest,
                ssrErrors: allCapturedErrors,
                stream: await (0, _streamops.continueFizzStream)(errorHtmlStream, {
                    inlinedDataStream: createInlinedDataStream(reactServerPrerenderResult.consumeAsStream(), nonce, formState),
                    isStaticGeneration: true,
                    getServerInsertedHTML: (0, _makegetserverinsertedhtml.makeGetServerInsertedHTML)({
                        polyfills,
                        renderServerInsertedHTML,
                        serverCapturedErrors: [],
                        basePath,
                        tracingMetadata: tracingMetadata
                    }),
                    getServerInsertedMetadata,
                    validateRootLayout: !!process.env.__NEXT_DEV_SERVER,
                    deploymentId: ctx.sharedContext.deploymentId
                }),
                dynamicAccess: null,
                collectedRevalidate: prerenderLegacyStore.revalidate,
                collectedExpire: prerenderLegacyStore.expire,
                collectedStale: selectStaleTime(prerenderLegacyStore.stale),
                collectedTags: prerenderLegacyStore.tags
            };
        } catch (finalErr) {
            if (process.env.__NEXT_DEV_SERVER && (0, _httpaccessfallback.isHTTPAccessFallbackError)(finalErr)) {
                const { bailOnRootNotFound } = require('../../client/components/dev-root-http-access-fallback-boundary');
                bailOnRootNotFound();
            }
            throw finalErr;
        }
    }
}
function createStreamPendingState() {
    // This state essentially acts as a mutable out-parameter that should be set
    // by something that consumes the stream.
    // As a sanity check, we require it to be set at least once.
    let _isPending;
    return {
        get isPending () {
            if (_isPending === undefined) {
                throw Object.defineProperty(new _invarianterror.InvariantError('Expected stream state to be initialized before reading'), "__NEXT_ERROR_CODE", {
                    value: "E1281",
                    enumerable: false,
                    configurable: true
                });
            }
            return _isPending;
        },
        set isPending (value){
            _isPending = value;
        }
    };
}
function createPrerenderChunksAccumulator() {
    return {
        // Chunks emitted before aborting the render.
        prerenderChunks: [],
        // In dev, we also collect chunks that the render emits after aborting,
        // because they can contain debug info for chunks that did not
        // resolve during the prerender. However, unlike a prerender, a render
        // will also error all the pending chunks (instead of halting),
        // so have to use something like `createNodeStreamWithLateRelease`
        // to make the errors unobservable.
        allChunks: process.env.NODE_ENV === 'development' ? [] : null
    };
}
function collectPrerenderChunk(chunks, signal, chunk) {
    var // ...but if they contain debug info, we still want to collect them
    // to improve error messages.
    _chunks_allChunks;
    // The chunks emitted after an abort are not part of the prerender...
    if (!signal.aborted) {
        chunks.prerenderChunks.push(chunk);
    }
    (_chunks_allChunks = chunks.allChunks) == null ? void 0 : _chunks_allChunks.push(chunk);
}
async function iterateStreamingPrerenderChunks(stream, signal, onChunk, streamState) {
    if (stream instanceof ReadableStream) {
        const reader = stream.getReader();
        if (streamState) {
            streamState.isPending = true;
        }
        // In production, there's no debug info, so we don't need to capture
        // anything emitted after the abort and can cancel immediately.
        if (process.env.NODE_ENV !== 'development') {
            signal.addEventListener('abort', ()=>{
                reader.cancel(signal.reason);
            }, {
                once: true
            });
        }
        while(true){
            const { done, value: value1 } = await reader.read();
            if (done) {
                break;
            }
            onChunk(value1);
        }
        if (streamState) {
            streamState.isPending = false;
        }
    } else {
        const nodeStream = stream;
        if (streamState) {
            streamState.isPending = true;
        }
        let cancelled = false;
        // In production, there's no debug info, so we don't need to capture
        // anything emitted after the abort and can cancel immediately.
        if (process.env.NODE_ENV !== 'development') {
            signal.addEventListener('abort', ()=>{
                if (!cancelled) {
                    cancelled = true;
                    nodeStream.destroy();
                }
            }, {
                once: true
            });
        }
        try {
            for await (const value1 of nodeStream){
                if (cancelled) break;
                onChunk(value1);
            }
        } catch (err) {
            if (!cancelled) {
                throw err;
            }
        }
        if (streamState) {
            streamState.isPending = false;
        }
    }
}
const getGlobalErrorStyles = async (tree, ctx)=>{
    const globalErrorModule = (0, _parseloadertree.parseLoaderTree)(tree).modules['global-error'];
    if (!globalErrorModule) {
        throw Object.defineProperty(new Error('Invariant: global-error module is required but not found in loader tree'), "__NEXT_ERROR_CODE", {
            value: "E983",
            enumerable: false,
            configurable: true
        });
    }
    const { componentMod: { createElement } } = ctx;
    // Get the GlobalError component and styles from the loader tree
    const [GlobalErrorComponent, styles] = await (0, _createcomponentstylesandscripts.createComponentStylesAndScripts)({
        ctx,
        filePath: globalErrorModule[1],
        getComponent: globalErrorModule[0],
        injectedCSS: new Set(),
        injectedJS: new Set()
    });
    let globalErrorStyles = styles;
    if (process.env.__NEXT_DEV_SERVER) {
        const dir = (process.env.NEXT_RUNTIME === 'edge' ? process.env.__NEXT_EDGE_PROJECT_DIR : ctx.renderOpts.dir) || '';
        const globalErrorModulePath = (0, _segmentexplorerpath.normalizeConventionFilePath)(dir, globalErrorModule[1]);
        if (globalErrorModulePath) {
            const SegmentViewNode = ctx.componentMod.SegmentViewNode;
            globalErrorStyles = // This will be rendered next to GlobalError component under ErrorBoundary,
            // it requires a key to avoid React warning about duplicate keys.
            createElement(SegmentViewNode, {
                key: 'ge-svn',
                type: 'global-error',
                pagePath: globalErrorModulePath
            }, globalErrorStyles);
        }
    }
    return {
        GlobalError: GlobalErrorComponent,
        styles: globalErrorStyles
    };
};
async function collectSegmentData(fullPageDataBuffer, prerenderStore, ComponentMod, renderOpts, pagePath, metadata) {
    // Per-segment prefetch data
    //
    // All of the segments for a page are generated simultaneously, including
    // during revalidations. This is to ensure consistency, because it's
    // possible for a mismatch between a layout and page segment can cause the
    // client to error during rendering. We want to preserve the ability of the
    // client to recover from such a mismatch by re-requesting all the segments
    // to get a consistent view of the page.
    //
    // For performance, we reuse the Flight output that was created when
    // generating the initial page HTML. The Flight stream for the whole page is
    // decomposed into a separate stream per segment.
    const { clientModules, edgeRscModuleMapping, rscModuleMapping } = (0, _manifestssingleton.getClientReferenceManifest)();
    // Manifest passed to the Flight client for reading the full-page Flight
    // stream. Based off similar code in use-cache-wrapper.ts.
    const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';
    const serverConsumerManifest = {
        // moduleLoading must be null because we don't want to trigger preloads of ClientReferences
        // to be added to the consumer. Instead, we'll wait for any ClientReference to be emitted
        // which themselves will handle the preloading.
        moduleLoading: null,
        moduleMap: isEdgeRuntime ? edgeRscModuleMapping : rscModuleMapping,
        serverModuleMap: (0, _manifestssingleton.getServerModuleMap)()
    };
    const selectStaleTime = (0, _staletime.createSelectStaleTime)(renderOpts.experimental);
    const staleTime = selectStaleTime(prerenderStore.stale);
    // Resolve prefetch hints. At runtime (next start / ISR), the precomputed
    // hints are already loaded from the prefetch-hints.json manifest. During
    // build, compute them and write them to metadata so the build pipeline
    // can persist them to the manifest. Like every other hint bit, the
    // static-prefetch-attempt hint is computed once here and stays constant
    // for the entire build — it must reach every response that carries
    // prefetch hints (dynamic navigations included), which only the manifest
    // flow can guarantee.
    //
    // The manifest isn't just a cache of this work — for some responses it's
    // the only possible source. A response's FlightRouterState is built early
    // in its render, before the runtime-data tracking has settled, so it can't
    // read a finished measurement even when one is coming; and a dynamic
    // navigation has no prerender to measure in the first place. Recomputing
    // per render would therefore leave those responses with no hint at all,
    // which is worse than an occasionally-stale one: the client would deopt
    // straight to runtime prefetches instead of attempting static.
    let hints;
    const prefetchInlining = renderOpts.experimental.prefetchInlining;
    if (renderOpts.isBuildTimePrerendering) {
        // Whether the client should attempt a static prefetch for this route
        // (PrefetchHint.ShouldAttemptStaticPrefetch): the prerender store's
        // cell holds the hint value directly — true iff the build-time
        // prerender accessed no runtime data that disqualifies a static
        // attempt. The fallback-param upgradeability rule is applied at access
        // time — see trackRuntimeDataAccessed — so only the settled value is
        // read here. Only the modern (cacheComponents) prerender tracks
        // accesses; legacy prerenders conservatively never set the hint.
        const hintCell = prerenderStore.type === 'prerender' ? prerenderStore.shouldAttemptStaticPrefetch : null;
        const shouldAttemptStaticPrefetch = hintCell !== null && hintCell.current;
        if (prefetchInlining || shouldAttemptStaticPrefetch) {
            // Build time: compute fresh hints and store in metadata for the
            // manifest. When prefetch inlining is disabled there are no sizes to
            // measure, but the static-prefetch hint still rides the manifest —
            // collectPrefetchHints then only builds the tree shape carrying it.
            hints = await ComponentMod.collectPrefetchHints(fullPageDataBuffer, staleTime, clientModules, serverConsumerManifest, prefetchInlining, shouldAttemptStaticPrefetch);
            metadata.prefetchHints = hints;
        } else {
            // Inlining is disabled and the hint didn't qualify — there's nothing
            // to record, so don't write a manifest entry for this route.
            hints = null;
        }
    } else {
        var _renderOpts_prefetchHints;
        // Runtime: use hints from the manifest. Never compute fresh hints
        // during ISR/revalidation.
        const manifestHints = (_renderOpts_prefetchHints = renderOpts.prefetchHints) == null ? void 0 : _renderOpts_prefetchHints[pagePath];
        if (manifestHints === undefined) {
            if (!prefetchInlining || !renderOpts.cacheComponents) {
                // Without cacheComponents, dynamic pages have no static shell
                // and therefore no prerender pass to compute hints; and with
                // inlining disabled, a missing entry just means the route didn't
                // qualify for the static-prefetch hint at build. Either way this
                // is expected — skip the hint system for this route and let
                // prefetching proceed normally without inlining decisions (the
                // client goes straight to runtime prefetches where it matters).
                hints = null;
            } else {
                // TODO(#91407): No hints found for this route. This currently
                // happens for routes with `instant = false` at the root segment,
                // which causes the prerender to run per-request and the hints
                // manifest to be unavailable at runtime.
                //
                // Fall back to a hint tree that marks everything as
                // unprefetchable. This also swallows the static-prefetch-attempt
                // hint — such routes never carry it, so the client goes straight
                // to a runtime prefetch, which is safe (just less cacheable).
                // Once the instant:false bug is fixed, this should become an
                // error — the manifest should always have an entry for every
                // route that reaches collectSegmentData.
                hints = {
                    hints: _approutertypes.PrefetchHint.PrefetchDisabled,
                    slots: null
                };
            }
        } else {
            hints = manifestHints;
        }
    }
    // Whether this render is a fallback shell, i.e. it was prerendered with
    // unknown (opaque) route params rather than concrete ones. The per-segment
    // responses generated below are stamped with this so the client knows to
    // retry the prefetch — a more complete version may become available once
    // the server's background regeneration finishes.
    //
    // Only flag the shell when it could actually be upgraded
    // (`isFallbackUpgradeable`): at least one fallback param is a candidate
    // enumerated by `generateStaticParams`. A route with no `generateStaticParams`
    // never upgrades, so flagging it would trigger pointless client retries.
    const fallbackRouteParams = 'fallbackRouteParams' in prerenderStore ? prerenderStore.fallbackRouteParams : null;
    const isUpgradeableISRFallback = fallbackRouteParams != null && fallbackRouteParams.size > 0 && renderOpts.isFallbackUpgradeable === true;
    // Pass the resolved hints so collectSegmentData can union them into
    // the TreePrefetch. During the initial build the FlightRouterState in
    // the buffer doesn't have inlining hints yet (they were just computed
    // above), so we need to merge them in here. At runtime/ISR the hints
    // are already embedded in the FlightRouterState, so this is null.
    metadata.segmentData = await ComponentMod.collectSegmentData(renderOpts.cacheComponents, fullPageDataBuffer, staleTime, clientModules, serverConsumerManifest, Boolean(renderOpts.experimental.prefetchInlining), hints, isUpgradeableISRFallback);
}
function isBypassingCachesInDev(requestStore, workStore) {
    return !!process.env.__NEXT_DEV_SERVER && (requestStore.headers.get('cache-control') === 'no-cache' || requestStore.draftMode.isEnabled || workStore.isDraftMode === true);
}
function WarnForBypassCachesInDev({ route }) {
    (0, _warnonce.warnOnce)(`Route ${route} is rendering with server caches disabled. For this navigation, Component Metadata in React DevTools will not accurately reflect what is statically prerenderable and runtime prefetchable. See more info here: https://nextjs.org/docs/messages/cache-bypass-in-dev`);
    return null;
}

//# sourceMappingURL=app-render.js.map