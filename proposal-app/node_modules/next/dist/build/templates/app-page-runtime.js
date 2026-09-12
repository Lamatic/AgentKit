"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createAppPageEntrypoint", {
    enumerable: true,
    get: function() {
        return createAppPageEntrypoint;
    }
});
const _modulecompiled = require("../../server/route-modules/app-page/module.compiled");
const _routekind = require("../../server/route-kind");
const _utils = require("../../server/instrumentation/utils");
const _tracer = require("../../server/lib/trace/tracer");
const _requestmeta = require("../../server/request-meta");
const _constants = require("../../server/lib/trace/constants");
const _stripflightheaders = require("../../server/app-render/strip-flight-headers");
const _node = require("../../server/base-http/node");
const _ppr = require("../../server/lib/experimental/ppr");
const _isrscrequest = require("../../server/lib/is-rsc-request");
const _isnonhtmlsecfetchdest = require("../../server/lib/is-non-html-sec-fetch-dest");
const _entryconstants = require("../../shared/lib/entry-constants");
const _fallbackparams = require("../../server/request/fallback-params");
const _manifestssingleton = require("../../server/app-render/manifests-singleton");
const _streamingmetadata = require("../../server/lib/streaming-metadata");
const _apppaths = require("../../shared/lib/router/utils/app-paths");
const _serveractionrequestmeta = require("../../server/lib/server-action-request-meta");
const _approuterheaders = require("../../client/components/app-router-headers");
const _isbot = require("../../shared/lib/router/utils/is-bot");
const _responsecache = require("../../server/response-cache");
const _fallback = require("../../lib/fallback");
const _renderresult = /*#__PURE__*/ _interop_require_default(require("../../server/render-result"));
const _constants1 = require("../../lib/constants");
const _encodedtags = require("../../server/stream-utils/encoded-tags");
const _sendpayload = require("../../server/send-payload");
const _nofallbackerrorexternal = require("../../shared/lib/no-fallback-error.external");
const _sizelimit = require("../../shared/lib/size-limit");
const _postponedrequestbody = require("../../server/lib/postponed-request-body");
const _url = require("../../lib/url");
const _entrybase = /*#__PURE__*/ _interop_require_wildcard(require("../../server/app-render/entry-base"));
const _redirectstatuscode = require("../../client/components/redirect-status-code");
const _invarianterror = require("../../shared/lib/invariant-error");
const _scheduler = require("../../lib/scheduler");
const _interceptionroutes = require("../../shared/lib/router/utils/interception-routes");
const _getsegmentparam = require("../../shared/lib/router/utils/get-segment-param");
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
/**
 * Builds the cache key for the most complete prerenderable shell we can derive
 * from the shell that matched this request. Only params that can still be
 * filled by `generateStaticParams` are substituted; fully dynamic params stay
 * as placeholders so a request like `/c/foo` can complete `/[one]/[two]` into
 * `/c/[two]` rather than `/c/foo`.
 */ function buildCompletedShellCacheKey(fallbackPathname, remainingPrerenderableParams, params) {
    const prerenderableParamsByName = new Map(remainingPrerenderableParams.map((param)=>[
            param.paramName,
            param
        ]));
    return fallbackPathname.split('/').map((segment)=>{
        const segmentParam = (0, _getsegmentparam.getSegmentParam)(segment);
        if (!segmentParam) {
            return segment;
        }
        const remainingParam = prerenderableParamsByName.get(segmentParam.paramName);
        if (!remainingParam) {
            return segment;
        }
        const value = params == null ? void 0 : params[remainingParam.paramName];
        if (!value) {
            return segment;
        }
        const encodedValue = Array.isArray(value) ? value.map((item)=>encodeURIComponent(item)).join('/') : encodeURIComponent(value);
        return segment.replace((0, _fallbackparams.buildDynamicSegmentPlaceholder)(remainingParam), encodedValue);
    }).join('/') || '/';
}
function createAppPageEntrypoint({ tree, page, pathname, require: __next_app_require__, loadChunk: __next_app_load_chunk__, interopDefault }) {
    const __next_app__ = {
        require: __next_app_require__,
        loadChunk: __next_app_load_chunk__
    };
    const routeModule = new _modulecompiled.AppPageRouteModule({
        definition: {
            kind: _routekind.RouteKind.APP_PAGE,
            page,
            pathname,
            // The following aren't used in production.
            bundlePath: '',
            filename: '',
            appPaths: []
        },
        userland: {
            loaderTree: tree
        },
        distDir: process.env.__NEXT_RELATIVE_DIST_DIR || '',
        relativeProjectDir: process.env.__NEXT_RELATIVE_PROJECT_DIR || ''
    });
    let srcPage = page;
    // turbopack doesn't normalize `/index` in the page name
    // so we need to to process dynamic routes properly
    // TODO: fix turbopack providing differing value from webpack
    if (process.env.TURBOPACK) {
        srcPage = srcPage.replace(/\/index$/, '') || '/';
    } else if (srcPage === '/index') {
        // we always normalize /index specifically
        srcPage = '/';
    }
    const normalizedSrcPage = (0, _apppaths.normalizeAppPath)(srcPage);
    async function handler(req, res, ctx) {
        var _this, _prerenderManifest_routes_resolvedPathname, _prerenderInfo_fallbackRootParams, _prerenderInfo_fallbackRouteParams, _prerenderInfo_fallbackRouteParams1;
        if (ctx.requestMeta) {
            (0, _requestmeta.setRequestMeta)(req, ctx.requestMeta);
        }
        if (routeModule.isDev) {
            (0, _requestmeta.addRequestMeta)(req, 'devRequestTimingInternalsEnd', process.hrtime.bigint());
        }
        const isMinimalMode = Boolean((0, _requestmeta.getRequestMeta)(req, 'minimalMode'));
        // Capture the request target before `prepare()` runs, since route
        // normalization (e.g. `normalizeCdnUrl`) rewrites `req.url` and would
        // otherwise change the `http.target` span attribute. This mirrors
        // `BaseServer.handleRequest`, which records the target before normalization.
        const httpTarget = req.url;
        const multiZoneDraftMode = process.env.__NEXT_MULTI_ZONE_DRAFT_MODE;
        const prepareResult = await routeModule.prepare(req, res, {
            srcPage,
            multiZoneDraftMode
        });
        if (!prepareResult) {
            res.statusCode = 400;
            res.end('Bad Request');
            ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
            return null;
        }
        const { buildId, query, params, pageIsDynamic, buildManifest, nextFontManifest, reactLoadableManifest, serverActionsManifest, clientReferenceManifest, subresourceIntegrityManifest, prerenderManifest, prefetchHintsManifest, isDraftMode, resolvedPathname, revalidateOnlyGenerated, routerServerContext, nextConfig, parsedUrl, interceptionRoutePatterns, deploymentId, clientAssetToken } = prepareResult;
        let { isOnDemandRevalidate } = prepareResult;
        // We use the resolvedPathname instead of the parsedUrl.pathname because it
        // is not rewritten as resolvedPathname is. This will ensure that the correct
        // prerender info is used instead of using the original pathname as the
        // source. If however PPR is enabled and cacheComponents is disabled, we
        // treat the pathname as dynamic. Currently, there's a bug in the PPR
        // implementation that incorrectly leaves %%drp placeholders in the output of
        // parallel routes. This is addressed with cacheComponents.
        const prerenderMatch = nextConfig.experimental.ppr && !nextConfig.cacheComponents && (0, _interceptionroutes.isInterceptionRouteAppPath)(resolvedPathname) ? null : routeModule.match(resolvedPathname, prerenderManifest);
        const prerenderInfo = (prerenderMatch == null ? void 0 : prerenderMatch.route) ?? null;
        const isPrerendered = !!prerenderManifest.routes[resolvedPathname];
        const userAgent = req.headers['user-agent'] || '';
        const botType = (0, _isbot.getBotType)(userAgent);
        /**
     * If true, this indicates that the request being made is for an app
     * prefetch request.
     */ const isPrefetchRSCRequest = (0, _requestmeta.getRequestMeta)(req, 'isPrefetchRSCRequest') ?? req.headers[_approuterheaders.NEXT_ROUTER_PREFETCH_HEADER] === '1' // exclude runtime prefetches, which use '2'
        ;
        // NOTE: Don't delete headers[RSC] yet, it still needs to be used in renderToHTML later
        const isRSCRequest = (0, _requestmeta.getRequestMeta)(req, 'isRSCRequest') ?? (0, _isrscrequest.isRSCRequestHeader)(req.headers[_approuterheaders.RSC_HEADER]);
        const isPossibleServerAction = (0, _serveractionrequestmeta.getIsPossibleServerAction)(req);
        // For subresource requests (e.g. images or fonts), return plain text 404
        // instead of rendering the not-found route.
        if (normalizedSrcPage === _entryconstants.UNDERSCORE_NOT_FOUND_ROUTE && (req.method === 'GET' || req.method === 'HEAD') && !isRSCRequest && (0, _isnonhtmlsecfetchdest.isNonHtmlSecFetchDest)(req.headers['sec-fetch-dest'])) {
            res.statusCode = 404;
            res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Not Found');
            ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
            return null;
        }
        /**
     * If the route being rendered is an app page, and the ppr feature has been
     * enabled, then the given route _could_ support PPR.
     */ const couldSupportPPR = (0, _ppr.checkIsAppPPREnabled)(nextConfig.experimental.ppr);
        // Stash postponed state for server actions when in minimal mode.
        // We extract it here so the RDC is available for the re-render after the action completes.
        const resumeStateLengthHeader = req.headers[_constants1.NEXT_RESUME_STATE_LENGTH_HEADER];
        if (!(0, _requestmeta.getRequestMeta)(req, 'postponed') && isMinimalMode && couldSupportPPR && isPossibleServerAction && resumeStateLengthHeader && typeof resumeStateLengthHeader === 'string') {
            const stateLength = parseInt(resumeStateLengthHeader, 10);
            const { maxPostponedStateSize, maxPostponedStateSizeBytes } = (0, _postponedrequestbody.getMaxPostponedStateSize)(nextConfig.experimental.maxPostponedStateSize);
            if (!isNaN(stateLength) && stateLength > 0) {
                var _nextConfig_experimental_serverActions;
                if (stateLength > maxPostponedStateSizeBytes) {
                    res.statusCode = 413;
                    res.end((0, _postponedrequestbody.getPostponedStateExceededErrorMessage)(maxPostponedStateSize));
                    ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
                    return null;
                }
                // Calculate max total body size to prevent buffering excessively large
                // payloads before the action handler checks. We use stateLength (not
                // maxPostponedStateSizeBytes) so the postponed state doesn't eat into
                // the action body budget - it's already validated above.
                const defaultActionBodySizeLimit = '1 MB';
                const actionBodySizeLimit = ((_nextConfig_experimental_serverActions = nextConfig.experimental.serverActions) == null ? void 0 : _nextConfig_experimental_serverActions.bodySizeLimit) ?? defaultActionBodySizeLimit;
                const actionBodySizeLimitBytes = actionBodySizeLimit !== defaultActionBodySizeLimit ? require('next/dist/compiled/bytes').parse(actionBodySizeLimit) : 1024 * 1024 // 1 MB
                ;
                const maxTotalBodySize = stateLength + actionBodySizeLimitBytes;
                const fullBody = await (0, _postponedrequestbody.readBodyWithSizeLimit)(req, maxTotalBodySize);
                if (fullBody === null) {
                    res.statusCode = 413;
                    res.end(`Request body exceeded limit. ` + `To configure the body size limit for Server Actions, see: https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit`);
                    ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
                    return null;
                }
                if (fullBody.length >= stateLength) {
                    // Extract postponed state from the beginning
                    const postponedState = fullBody.subarray(0, stateLength).toString('utf8');
                    (0, _requestmeta.addRequestMeta)(req, 'postponed', postponedState);
                    // Store the remaining action body for the action handler
                    const actionBody = fullBody.subarray(stateLength);
                    (0, _requestmeta.addRequestMeta)(req, 'actionBody', actionBody);
                } else {
                    throw Object.defineProperty(new Error(`invariant: expected ${stateLength} bytes of postponed state but only received ${fullBody.length} bytes`), "__NEXT_ERROR_CODE", {
                        value: "E979",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
        }
        if (typeof (0, _requestmeta.getRequestMeta)(req, 'postponed') !== 'string' && couldSupportPPR && req.headers[_constants1.NEXT_RESUME_HEADER] === '1' && req.method === 'POST') {
            const { maxPostponedStateSize, maxPostponedStateSizeBytes } = (0, _postponedrequestbody.getMaxPostponedStateSize)(nextConfig.experimental.maxPostponedStateSize);
            // Decode the postponed state from the request body, it will come as
            // an array of buffers, so collect them and then concat them to form
            // the string.
            const body = await (0, _postponedrequestbody.readBodyWithSizeLimit)(req, maxPostponedStateSizeBytes);
            if (body === null) {
                res.statusCode = 413;
                res.end((0, _postponedrequestbody.getPostponedStateExceededErrorMessage)(maxPostponedStateSize));
                ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
                return null;
            }
            const postponed = body.toString('utf8');
            (0, _requestmeta.addRequestMeta)(req, 'postponed', postponed);
        }
        // When enabled, this will allow the use of the `?__nextppronly` query to
        // enable debugging of the static shell.
        const hasDebugStaticShellQuery = process.env.__NEXT_EXPERIMENTAL_STATIC_SHELL_DEBUGGING === '1' && typeof query.__nextppronly !== 'undefined' && couldSupportPPR;
        // When enabled, this will allow the use of the `?__nextppronly` query
        // to enable debugging of the fallback shell.
        const hasDebugFallbackShellQuery = hasDebugStaticShellQuery && query.__nextppronly === 'fallback';
        // Whether the testing API is exposed (dev mode or explicit flag)
        const exposeTestingApi = routeModule.isDev === true || nextConfig.experimental.exposeTestingApiInProductionBuild === true;
        // Enable the Instant Navigation Testing API. Renders only the prefetched
        // portion of the page, excluding dynamic content. This allows tests to
        // assert on the prefetched UI state deterministically.
        //
        // The instant test cookie is sent automatically with all requests while a
        // navigation lock is held. We treat a request as a test render when the
        // cookie is present and either:
        // - it's a document request (no RSC header) — covers MPA navigations
        // - it's a prefetch RSC request — covers client-side prefetches
        // Regular RSC navigation requests proceed normally even during a locked
        // scope; blocking happens on the client side.
        const isInstantNavigationTest = exposeTestingApi && typeof req.headers.cookie === 'string' && req.headers.cookie.includes(_approuterheaders.NEXT_INSTANT_TEST_COOKIE + '=') && (!(0, _isrscrequest.isRSCRequestHeader)(req.headers[_approuterheaders.RSC_HEADER]) || req.headers[_approuterheaders.NEXT_ROUTER_PREFETCH_HEADER] === '1');
        // This page supports PPR if it is marked as being `PARTIALLY_STATIC` in the
        // prerender manifest and this is an app page.
        const isRoutePPREnabled = // When the instant navigation testing API is active, enable the PPR
        // prerender path even without Cache Components. In dev mode without CC,
        // static pages need this path to produce buffered segment data (the
        // legacy prerender path hangs in dev mode).
        (couldSupportPPR || isInstantNavigationTest) && (((_this = prerenderManifest.routes[normalizedSrcPage] ?? prerenderManifest.dynamicRoutes[normalizedSrcPage]) == null ? void 0 : _this.renderingMode) === 'PARTIALLY_STATIC' || // Ideally we'd want to check the appConfig to see if this page has PPR
        // enabled or not, but that would require plumbing the appConfig through
        // to the server during development. We assume that the page supports it
        // but only during development or when the testing API is exposed.
        (hasDebugStaticShellQuery || isInstantNavigationTest) && (exposeTestingApi || (routerServerContext == null ? void 0 : routerServerContext.experimentalTestProxy) === true));
        const isDebugStaticShell = (hasDebugStaticShellQuery || isInstantNavigationTest) && isRoutePPREnabled;
        // We should enable debugging dynamic accesses when the static shell
        // debugging has been enabled and we're also in development mode.
        const isDebugDynamicAccesses = isDebugStaticShell && routeModule.isDev === true;
        const isDebugFallbackShell = hasDebugFallbackShellQuery && isRoutePPREnabled;
        // If we're in minimal mode, then try to get the postponed information from
        // the request metadata. If available, use it for resuming the postponed
        // render.
        const minimalPostponed = isRoutePPREnabled ? (0, _requestmeta.getRequestMeta)(req, 'postponed') : undefined;
        const hasPostponedState = typeof minimalPostponed === 'string';
        // If PPR is enabled, and this is a RSC request (but not a prefetch), then
        // we can use this fact to only generate the flight data for the request
        // because we can't cache the HTML (as it's also dynamic).
        const staticPrefetchDataRoute = (_prerenderManifest_routes_resolvedPathname = prerenderManifest.routes[resolvedPathname]) == null ? void 0 : _prerenderManifest_routes_resolvedPathname.prefetchDataRoute;
        let isDynamicRSCRequest = isRoutePPREnabled && isRSCRequest && !isPrefetchRSCRequest && // If generated at build time, treat the RSC request as static
        // so we can serve the prebuilt .rsc without a dynamic render.
        // Only do this for routes that have a concrete prefetchDataRoute.
        !staticPrefetchDataRoute;
        // During a PPR revalidation, the RSC request is not dynamic if postponed
        // metadata is absent. An empty string represents a resume request without
        // postponed state, which should perform a full dynamic render.
        if (isMinimalMode) {
            isDynamicRSCRequest = isDynamicRSCRequest && hasPostponedState;
        }
        // Need to read this before it's stripped by stripFlightHeaders. We don't
        // need to transfer it to the request meta because it's only read
        // within this function; the static segment data should have already been
        // generated, so we will always either return a static response or a 404.
        const rawSegmentPrefetchHeader = req.headers[_approuterheaders.NEXT_ROUTER_SEGMENT_PREFETCH_HEADER];
        const segmentPrefetchHeader = (0, _requestmeta.getRequestMeta)(req, 'segmentPrefetchRSCRequest') ?? (isPrefetchRSCRequest ? typeof rawSegmentPrefetchHeader === 'string' ? rawSegmentPrefetchHeader : Array.isArray(rawSegmentPrefetchHeader) ? rawSegmentPrefetchHeader[0] : undefined : undefined);
        // TODO: investigate existing bug with shouldServeStreamingMetadata always
        // being true for a revalidate due to modifying the base-server this.renderOpts
        // when fixing this to correct logic it causes hydration issue since we set
        // serveStreamingMetadata to true during export
        const serveStreamingMetadata = !userAgent ? true : (0, _streamingmetadata.shouldServeStreamingMetadata)(userAgent, nextConfig.htmlLimitedBots);
        // PPR shells are generated for streaming metadata. Requests that require
        // blocking metadata must bypass the shell so the prerender and dynamic
        // render use the same metadata tree.
        const shouldForceDynamicPPRRender = isRoutePPREnabled && !serveStreamingMetadata;
        const isSSG = Boolean((prerenderInfo || isPrerendered || prerenderManifest.routes[normalizedSrcPage]) && !shouldForceDynamicPPRRender);
        // When a page supports cacheComponents, we can support RDC for Navigations
        const supportsRDCForNavigations = isRoutePPREnabled && nextConfig.cacheComponents === true;
        // In development, we always want to generate dynamic HTML.
        const supportsDynamicResponse = // If we're in development, we always support dynamic HTML, unless it's
        // a data request, in which case we only produce static HTML.
        routeModule.isDev === true || // If this is a draft mode request, it supports dynamic HTML.
        isDraftMode || // If this is not SSG or does not have static paths, then it supports
        // dynamic HTML.
        !isSSG || // If this request has provided postponed data, it supports dynamic
        // HTML.
        hasPostponedState || // If this handler supports onCacheEntryV2, then we can only support
        // dynamic responses if it's a dynamic RSC request and not in minimal mode. If it
        // doesn't support it we must fallback to the default behavior.
        (supportsRDCForNavigations && (0, _requestmeta.getRequestMeta)(req, 'onCacheEntryV2') ? // which will generate the RDC for the route. When resuming a Dynamic
        // RSC request, we'll pass the minimal postponed data to the render
        // which will trigger the `supportsDynamicResponse` to be true.
        isDynamicRSCRequest && !isMinimalMode : isDynamicRSCRequest);
        const remainingPrerenderableParams = (prerenderInfo == null ? void 0 : prerenderInfo.remainingPrerenderableParams) ?? [];
        // Concrete optional routes like `/optional-catchall` can still match their
        // generic shell entry (eg /optional-catchall/[[...slug]]) in the prerender manifest.
        // If the omitted param already resolved to a real prerendered path, keep serving that concrete result.
        const hasOmittedConcreteFallbackParam = isPrerendered && remainingPrerenderableParams.some((param)=>{
            const value = params == null ? void 0 : params[param.paramName];
            return value == null || Array.isArray(value) && value.length === 0;
        });
        const hasUnresolvedRootFallbackParams = (prerenderInfo == null ? void 0 : prerenderInfo.fallback) === null && (((_prerenderInfo_fallbackRootParams = prerenderInfo.fallbackRootParams) == null ? void 0 : _prerenderInfo_fallbackRootParams.length) ?? 0) > 0;
        let ssgCacheKey = null;
        let usesCompletedShellCacheKey = false;
        if (!isDraftMode && isSSG && !supportsDynamicResponse && !isPossibleServerAction && !hasPostponedState && !isDynamicRSCRequest) {
            var _prerenderInfo_fallbackRouteParams2;
            // For normal SSG routes we cache by the fully resolved pathname. For
            // partial fallbacks we instead derive the cache key from the shell
            // that matched this request so `/prefix/[one]/[two]` can specialize into
            // `/prefix/c/[two]` without promoting all the way to `/prefix/c/foo`.
            // This includes entries with unresolved ROOT params: those requests are
            // served blocking (no shell can be shared across root branches), but
            // the entry they produce is still keyed by the completed shell — root
            // params and any other prerenderable params resolve into the key while
            // params that `generateStaticParams` can never provide stay as
            // placeholders and must not partition the cache.
            const fallbackPathname = prerenderMatch ? typeof (prerenderInfo == null ? void 0 : prerenderInfo.fallback) === 'string' ? prerenderInfo.fallback : prerenderMatch.source : null;
            if (// Partial fallback shells are only specialized per request when Partial
            // Prefetching is enabled, mirroring the `partialFallback` flag the
            // adapter emits for deployments. When it's disabled we fall through to
            // the normal ISR cache key (`resolvedPathname`) so the shell stays
            // shared, matching the behavior before the `partialFallbacks` config
            // flag was removed.
            nextConfig.partialPrefetching && fallbackPathname && (prerenderInfo == null ? void 0 : (_prerenderInfo_fallbackRouteParams2 = prerenderInfo.fallbackRouteParams) == null ? void 0 : _prerenderInfo_fallbackRouteParams2.length)) {
                if (remainingPrerenderableParams.length > 0) {
                    const completedShellCacheKey = buildCompletedShellCacheKey(fallbackPathname, remainingPrerenderableParams, params);
                    // If applying the current request params doesn't make the shell any
                    // more complete, then this shell is already at its most complete
                    // form and should remain shared rather than creating a new cache entry.
                    if (completedShellCacheKey !== fallbackPathname) {
                        ssgCacheKey = completedShellCacheKey;
                        usesCompletedShellCacheKey = true;
                    }
                }
            } else {
                ssgCacheKey = resolvedPathname;
            }
        }
        // the staticPathKey differs from ssgCacheKey since
        // ssgCacheKey is null in dev since we're always in "dynamic"
        // mode in dev to bypass the cache. It can also be null for partial
        // fallback shells that should remain shared and must not create a
        // param-specific ISR entry, but we still need to honor fallback handling.
        let staticPathKey = ssgCacheKey;
        if (!staticPathKey && (routeModule.isDev || isSSG && pageIsDynamic && (prerenderInfo == null ? void 0 : (_prerenderInfo_fallbackRouteParams = prerenderInfo.fallbackRouteParams) == null ? void 0 : _prerenderInfo_fallbackRouteParams.length) && // Server action requests must not get a staticPathKey, otherwise they
        // enter the fallback rendering block below and return the cached HTML
        // shell with the action result appended, instead of responding with
        // just the RSC action result.
        !isPossibleServerAction)) {
            staticPathKey = resolvedPathname;
        }
        // If this is a request for an app path that should be statically generated
        // and we aren't in the edge runtime, strip the flight headers so it will
        // generate the static response.
        if (!routeModule.isDev && !isDraftMode && isSSG && isRSCRequest && !isDynamicRSCRequest) {
            (0, _stripflightheaders.stripFlightHeaders)(req.headers);
        }
        const ComponentMod = {
            ..._entrybase,
            tree,
            handler,
            routeModule,
            __next_app__
        };
        // Before rendering (which initializes component tree modules), we have to
        // set the reference manifests to our global store so Server Action's
        // encryption util can access to them at the top level of the page module.
        if (serverActionsManifest && clientReferenceManifest) {
            (0, _manifestssingleton.setManifestsSingleton)({
                page: srcPage,
                clientReferenceManifest,
                serverActionsManifest
            });
        }
        const method = req.method || 'GET';
        const tracer = (0, _tracer.getTracer)();
        const activeSpan = tracer.getActiveScopeSpan();
        const isWrappedByNextServer = Boolean(routerServerContext == null ? void 0 : routerServerContext.isWrappedByNextServer);
        const remainingFallbackRouteParams = nextConfig.partialPrefetching && remainingPrerenderableParams.length > 0 ? (prerenderInfo == null ? void 0 : (_prerenderInfo_fallbackRouteParams1 = prerenderInfo.fallbackRouteParams) == null ? void 0 : _prerenderInfo_fallbackRouteParams1.filter((param)=>!remainingPrerenderableParams.some((prerenderableParam)=>prerenderableParam.paramName === param.paramName))) ?? [] : [];
        const render404 = async ()=>{
            // TODO: should route-module itself handle rendering the 404
            if (routerServerContext == null ? void 0 : routerServerContext.render404) {
                await routerServerContext.render404(req, res, parsedUrl, false);
            } else {
                res.end('This page could not be found');
            }
            return null;
        };
        try {
            const varyHeader = routeModule.getVaryHeader(resolvedPathname, interceptionRoutePatterns);
            res.setHeader('Vary', varyHeader);
            let parentSpan;
            const invokeRouteModule = async (span, context)=>{
                const nextReq = new _node.NodeNextRequest(req);
                const nextRes = new _node.NodeNextResponse(res);
                return routeModule.render(nextReq, nextRes, context).finally(()=>{
                    if (!span) return;
                    span.setAttributes({
                        'http.status_code': res.statusCode,
                        'next.rsc': isRSCRequest
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
                    const route = rootSpanAttributes.get('next.route') || normalizedSrcPage;
                    const name = isRSCRequest ? `RSC ${method} ${route}` : `${method} ${route}`;
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
            };
            const incrementalCache = (0, _requestmeta.getRequestMeta)(req, 'incrementalCache') || await routeModule.getIncrementalCache(req, nextConfig, prerenderManifest, isMinimalMode);
            incrementalCache == null ? void 0 : incrementalCache.resetRequestCache();
            globalThis.__incrementalCache = incrementalCache;
            const doRender = async ({ span, postponed, fallbackRouteParams, forceStaticRender, allowEmptyStaticShell })=>{
                const context = {
                    query,
                    params,
                    page: normalizedSrcPage,
                    sharedContext: {
                        buildId,
                        deploymentId,
                        clientAssetToken
                    },
                    serverComponentsHmrCache: (0, _requestmeta.getRequestMeta)(req, 'serverComponentsHmrCache'),
                    fallbackRouteParams,
                    renderOpts: {
                        App: ()=>null,
                        Document: ()=>null,
                        pageConfig: {},
                        ComponentMod,
                        Component: interopDefault(ComponentMod),
                        params,
                        routeModule,
                        page: srcPage,
                        postponed,
                        allowEmptyStaticShell,
                        serveStreamingMetadata,
                        supportsDynamicResponse: typeof postponed === 'string' || supportsDynamicResponse,
                        buildManifest,
                        nextFontManifest,
                        reactLoadableManifest,
                        subresourceIntegrityManifest,
                        setCacheStatus: routerServerContext == null ? void 0 : routerServerContext.setCacheStatus,
                        setIsrStatus: routerServerContext == null ? void 0 : routerServerContext.setIsrStatus,
                        setReactDebugChannel: routerServerContext == null ? void 0 : routerServerContext.setReactDebugChannel,
                        sendErrorsToBrowser: routerServerContext == null ? void 0 : routerServerContext.sendErrorsToBrowser,
                        dir: process.env.NEXT_RUNTIME === 'nodejs' ? require('path').join(/* turbopackIgnore: true */ process.cwd(), routeModule.relativeProjectDir) : `${process.cwd()}/${routeModule.relativeProjectDir}`,
                        isDraftMode,
                        botType,
                        isOnDemandRevalidate,
                        isPossibleServerAction,
                        assetPrefix: nextConfig.assetPrefix,
                        nextConfigOutput: nextConfig.output,
                        crossOrigin: nextConfig.crossOrigin,
                        trailingSlash: nextConfig.trailingSlash,
                        images: nextConfig.images,
                        previewProps: prerenderManifest.preview,
                        enableTainting: nextConfig.experimental.taint,
                        htmlLimitedBots: nextConfig.htmlLimitedBots,
                        reactMaxHeadersLength: nextConfig.reactMaxHeadersLength,
                        multiZoneDraftMode,
                        prefetchHints: prefetchHintsManifest,
                        incrementalCache,
                        cacheLifeProfiles: nextConfig.cacheLife,
                        staticPageGenerationTimeout: nextConfig.staticPageGenerationTimeout,
                        basePath: nextConfig.basePath,
                        serverActions: nextConfig.experimental.serverActions,
                        logServerFunctions: typeof nextConfig.logging === 'object' && Boolean(nextConfig.logging.serverFunctions),
                        ...isDebugStaticShell || isDebugDynamicAccesses || isDebugFallbackShell ? {
                            isBuildTimePrerendering: true,
                            supportsDynamicResponse: false,
                            isStaticGeneration: true,
                            isDebugDynamicAccesses: isDebugDynamicAccesses
                        } : {},
                        cacheComponents: Boolean(nextConfig.cacheComponents),
                        partialPrefetching: nextConfig.partialPrefetching,
                        // A fallback shell can only be upgraded to a concrete version if at
                        // least one of its fallback params is a `generateStaticParams`
                        // candidate (`remainingPrerenderableParams`), and only when Partial
                        // Prefetching is enabled (the upgrade itself is gated on it above).
                        // This gates whether the per-segment prefetch responses are flagged
                        // `isUpgradeableISRFallback`; without an upgrade to wait for, the
                        // client should not retry the prefetch.
                        isFallbackUpgradeable: Boolean(nextConfig.partialPrefetching) && remainingPrerenderableParams.length > 0,
                        validationLevel: nextConfig.experimental.instantInsights.validationLevel,
                        experimental: {
                            isRoutePPREnabled,
                            expireTime: nextConfig.expireTime,
                            staleTimes: nextConfig.experimental.staleTimes,
                            dynamicOnHover: Boolean(nextConfig.experimental.dynamicOnHover),
                            optimisticRouting: Boolean(nextConfig.experimental.optimisticRouting),
                            inlineCss: Boolean(nextConfig.experimental.inlineCss),
                            prefetchInlining: nextConfig.experimental.prefetchInlining ?? false,
                            authInterrupts: Boolean(nextConfig.experimental.authInterrupts),
                            serverComponentsHmrCancellation: Boolean(nextConfig.experimental.serverComponentsHmrCancellation),
                            useCacheTimeout: nextConfig.experimental.useCacheTimeout,
                            cachedNavigations: nextConfig.experimental.cachedNavigations ?? false,
                            clientTraceMetadata: nextConfig.experimental.clientTraceMetadata || [],
                            clientParamParsingOrigins: nextConfig.experimental.clientParamParsingOrigins,
                            maxPostponedStateSizeBytes: (0, _sizelimit.parseMaxPostponedStateSize)(nextConfig.experimental.maxPostponedStateSize),
                            exposeTestingApi
                        },
                        waitUntil: ctx.waitUntil,
                        onClose: (cb)=>{
                            res.on('close', cb);
                        },
                        onAfterTaskError: ()=>{},
                        onInstrumentationRequestError: (error, _request, errorContext, silenceLog)=>routeModule.onRequestError(req, error, errorContext, silenceLog, routerServerContext),
                        err: (0, _requestmeta.getRequestMeta)(req, 'invokeError')
                    }
                };
                // When we're revalidating in the background, we should not allow dynamic
                // responses.
                if (forceStaticRender) {
                    context.renderOpts.supportsDynamicResponse = false;
                }
                const result = await invokeRouteModule(span, context);
                const { metadata } = result;
                const { cacheControl, headers = {}, // Add any fetch tags that were on the page to the response headers.
                fetchTags: cacheTags, fetchMetrics } = metadata;
                // Apply the `expireTime` fallback as soon as we have the render's
                // `cacheControl`, so every downstream consumer (the cache stored via
                // `incrementalCache.set`, the response Cache-Control header, the outgoing
                // entry returned to `handleResponse`) sees a finalized `cacheControl`
                // with a populated `expire`. This mirrors the build-time fallback in
                // `build/index.ts` so we don't apply an expire to routes that opt out of
                // revalidation entirely (`revalidate: false`) or that are dynamic
                // (`revalidate: 0`).
                if (cacheControl && cacheControl.revalidate !== false && cacheControl.revalidate > 0 && cacheControl.expire === undefined) {
                    cacheControl.expire = nextConfig.expireTime;
                }
                if (cacheTags) {
                    headers[_constants1.NEXT_CACHE_TAGS_HEADER] = cacheTags;
                }
                // Pull any fetch metrics from the render onto the request.
                ;
                req.fetchMetrics = fetchMetrics;
                // we don't throw static to dynamic errors in dev as isSSG
                // is a best guess in dev since we don't have the prerender pass
                // to know whether the path is actually static or not
                if (isSSG && (cacheControl == null ? void 0 : cacheControl.revalidate) === 0 && !routeModule.isDev && !isRoutePPREnabled) {
                    const staticBailoutInfo = metadata.staticBailoutInfo;
                    const err = Object.defineProperty(new Error(`Page changed from static to dynamic at runtime ${resolvedPathname}${(staticBailoutInfo == null ? void 0 : staticBailoutInfo.description) ? `, reason: ${staticBailoutInfo.description}` : ``}` + `\nsee more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`), "__NEXT_ERROR_CODE", {
                        value: "E132",
                        enumerable: false,
                        configurable: true
                    });
                    if (staticBailoutInfo == null ? void 0 : staticBailoutInfo.stack) {
                        const stack = staticBailoutInfo.stack;
                        err.stack = err.message + stack.substring(stack.indexOf('\n'));
                    }
                    throw err;
                }
                return {
                    value: {
                        kind: _responsecache.CachedRouteKind.APP_PAGE,
                        html: result,
                        headers,
                        rscData: metadata.flightData,
                        postponed: metadata.postponed,
                        status: metadata.statusCode,
                        segmentData: metadata.segmentData
                    },
                    cacheControl
                };
            };
            const responseGenerator = async ({ hasResolved, previousCacheEntry: previousIncrementalCacheEntry, isRevalidating, span, forceStaticRender = false })=>{
                const isProduction = routeModule.isDev === false;
                const didRespond = hasResolved || res.writableEnded;
                try {
                    var _prerenderInfo_fallbackRouteParams;
                    // skip on-demand revalidate if cache is not present and
                    // revalidate-if-generated is set
                    if (isOnDemandRevalidate && revalidateOnlyGenerated && !previousIncrementalCacheEntry && !isMinimalMode) {
                        if (routerServerContext == null ? void 0 : routerServerContext.render404) {
                            await routerServerContext.render404(req, res);
                        } else {
                            res.statusCode = 404;
                            res.end('This page could not be found');
                        }
                        return null;
                    }
                    let fallbackMode;
                    if (prerenderInfo) {
                        fallbackMode = (0, _fallback.parseFallbackField)(prerenderInfo.fallback);
                    }
                    if (nextConfig.partialPrefetching && (prerenderInfo == null ? void 0 : prerenderInfo.fallback) === null && !hasOmittedConcreteFallbackParam && !hasUnresolvedRootFallbackParams && remainingPrerenderableParams.length > 0) {
                        // Generic source shells without unresolved root params don't have a
                        // concrete fallback file of their own, so they're marked as blocking.
                        // When we can complete the shell into a more specific
                        // prerendered shell for this request, treat it like a prerender
                        // fallback so we can serve that shell instead of blocking on the full
                        // route. Root-param shells stay blocking, since unknown root branches
                        // should not inherit a shell from another generated branch.
                        fallbackMode = _fallback.FallbackMode.PRERENDER;
                    }
                    // When serving a request that requires blocking metadata, we want to
                    // use a blocking render instead of the prerendered fallback. Without
                    // PPR, preserve the existing behavior for built-in bots.
                    if (fallbackMode === _fallback.FallbackMode.PRERENDER && (isRoutePPREnabled ? !serveStreamingMetadata : Boolean(botType))) {
                        fallbackMode = _fallback.FallbackMode.BLOCKING_STATIC_RENDER;
                    }
                    if ((previousIncrementalCacheEntry == null ? void 0 : previousIncrementalCacheEntry.isStale) === -1) {
                        isOnDemandRevalidate = true;
                    }
                    // TODO: adapt for PPR
                    // only allow on-demand revalidate for fallback: true/blocking
                    // or for prerendered fallback: false paths
                    if (isOnDemandRevalidate && (fallbackMode !== _fallback.FallbackMode.NOT_FOUND || previousIncrementalCacheEntry)) {
                        fallbackMode = _fallback.FallbackMode.BLOCKING_STATIC_RENDER;
                    }
                    if (!isMinimalMode && fallbackMode !== _fallback.FallbackMode.BLOCKING_STATIC_RENDER && staticPathKey && !didRespond && !isDraftMode && pageIsDynamic && (isProduction || !isPrerendered)) {
                        // if the page has dynamicParams: false and this pathname wasn't
                        // prerendered trigger the no fallback handling
                        if (// In development, fall through to render to handle missing
                        // getStaticPaths.
                        (isProduction || prerenderInfo) && // When fallback isn't present, abort this render so we 404
                        fallbackMode === _fallback.FallbackMode.NOT_FOUND) {
                            if (nextConfig.adapterPath) {
                                return await render404();
                            }
                            throw new _nofallbackerrorexternal.NoFallbackError();
                        }
                        // When cacheComponents is enabled, we can use the fallback
                        // response if the request is not a dynamic RSC request because the
                        // RSC data when this feature flag is enabled does not contain any
                        // param references. Without this feature flag enabled, the RSC data
                        // contains param references, and therefore we can't use the fallback.
                        if (isRoutePPREnabled && (nextConfig.cacheComponents ? !isDynamicRSCRequest : !isRSCRequest)) {
                            const cacheKey = isProduction && typeof (prerenderInfo == null ? void 0 : prerenderInfo.fallback) === 'string' ? prerenderInfo.fallback : normalizedSrcPage;
                            let fallbackRouteParams;
                            if (isProduction) {
                                // In production, rely on the prerender manifest's fallback
                                // entry — the authoritative set computed at build time by
                                // `buildAppStaticPaths`.
                                if (prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams) {
                                    fallbackRouteParams = (0, _fallbackparams.createOpaqueFallbackRouteParams)(prerenderInfo.fallbackRouteParams);
                                } else if (isDebugFallbackShell) {
                                    fallbackRouteParams = (0, _fallbackparams.getFallbackRouteParams)(normalizedSrcPage, routeModule);
                                } else {
                                    fallbackRouteParams = null;
                                }
                            } else {
                                // In dev the prerender manifest isn't populated for ad-hoc
                                // prefetches (`fallbackMode` is undefined for not-fully-generated
                                // routes, so the on-demand manifest write is skipped, and
                                // `getPrerenderManifest` is cached regardless). So
                                // `prerenderInfo` is unavailable here. Instead base-server
                                // derives the per-URL fallback set from the dev `getStaticPaths`
                                // result and threads it via the `fallbackParams` request meta —
                                // the most-specific prerendered route matching this URL, so
                                // `generateStaticParams`-covered params resolve in the shell and
                                // only the uncovered ones are deferred, matching what a
                                // production build serves. `isDebugFallbackShell` (the explicit
                                // fallback-shell debug flow) still forces the worst case.
                                if (isDebugFallbackShell) {
                                    fallbackRouteParams = (0, _fallbackparams.getFallbackRouteParams)(normalizedSrcPage, routeModule);
                                } else if (isDebugStaticShell) {
                                    // base-server threads the per-URL fallback set via the
                                    // `fallbackParams` meta for every dev Cache Components dynamic
                                    // request, so reuse it as the fallback route params for this
                                    // shell render. It only sets the meta for routes that still
                                    // have uncovered params, so an absent meta means this URL is
                                    // fully covered by `generateStaticParams` and there is nothing
                                    // to defer (`null`).
                                    fallbackRouteParams = (0, _requestmeta.getRequestMeta)(req, 'fallbackParams') ?? null;
                                } else {
                                    fallbackRouteParams = null;
                                }
                            }
                            // When rendering a debug static shell, override the fallback
                            // params on the request so that the staged rendering correctly
                            // defers params that are not statically known.
                            if (isDebugStaticShell && fallbackRouteParams) {
                                (0, _requestmeta.addRequestMeta)(req, 'fallbackParams', fallbackRouteParams);
                            }
                            // We use the response cache here to handle the revalidation and
                            // management of the fallback shell.
                            const fallbackResponse = await routeModule.handleResponse({
                                cacheKey,
                                req,
                                nextConfig,
                                routeKind: _routekind.RouteKind.APP_PAGE,
                                isFallback: true,
                                prerenderManifest,
                                isRoutePPREnabled,
                                responseGenerator: async ()=>doRender({
                                        span,
                                        // We pass `undefined` as rendering a fallback isn't resumed
                                        // here.
                                        postponed: undefined,
                                        // Always serve the shell that matched this request
                                        // immediately. If there are still prerenderable params left,
                                        // the background path below will complete the shell into a
                                        // more specific cache entry for later requests.
                                        fallbackRouteParams,
                                        forceStaticRender: true,
                                        allowEmptyStaticShell: isInstantNavigationTest || undefined
                                    }),
                                waitUntil: ctx.waitUntil,
                                isMinimalMode
                            });
                            // If the fallback response was set to null, then we should return null.
                            if (fallbackResponse === null) return null;
                            // Otherwise, if we did get a fallback response, we should return it.
                            if (fallbackResponse) {
                                if (!isMinimalMode && isRoutePPREnabled && // Upgrading a fallback shell into a more specific ISR entry is
                                // only done when Partial Prefetching is enabled, mirroring the
                                // `partialFallback` flag the adapter emits for deployments.
                                nextConfig.partialPrefetching && // Match the build-time contract: only fallback shells that can
                                // still be completed with prerenderable params should upgrade.
                                remainingPrerenderableParams.length > 0 && ssgCacheKey && incrementalCache && !isOnDemandRevalidate && !isDebugFallbackShell && // The testing API relies on deterministic shell behavior, so
                                // don't upgrade fallback shells in the background when it's
                                // exposed.
                                !exposeTestingApi && // Instant Navigation Testing API requests intentionally keep
                                // the route in shell mode; don't upgrade these in background.
                                !isInstantNavigationTest) {
                                    (0, _scheduler.scheduleOnNextTick)(async ()=>{
                                        const responseCache = routeModule.getResponseCache(req);
                                        try {
                                            // Only the params that were just specialized should be
                                            // removed from the fallback render. Any remaining fallback
                                            // params stay deferred so the revalidated result is a more
                                            // specific shell (e.g. `/prefix/c/[two]`), not a fully
                                            // concrete route (`/prefix/c/foo`).
                                            await responseCache.revalidate(ssgCacheKey, incrementalCache, isRoutePPREnabled, false, (c)=>{
                                                return doRender({
                                                    span: c.span,
                                                    postponed: undefined,
                                                    fallbackRouteParams: remainingFallbackRouteParams.length > 0 ? (0, _fallbackparams.createOpaqueFallbackRouteParams)(remainingFallbackRouteParams) : null,
                                                    forceStaticRender: true
                                                });
                                            }, // We don't have a prior entry for this param-specific shell.
                                            null, hasResolved, ctx.waitUntil);
                                        } catch (err) {
                                            console.error('Error revalidating the page in the background', err);
                                        }
                                    });
                                }
                                // Remove the cache control from the response to prevent it from being
                                // used in the surrounding cache.
                                delete fallbackResponse.cacheControl;
                                return fallbackResponse;
                            }
                        }
                    }
                    // Only requests that aren't revalidating can be resumed. If we have the
                    // minimal postponed data, then we should resume the render with it.
                    let postponed = !isOnDemandRevalidate && !isRevalidating && minimalPostponed ? minimalPostponed : undefined;
                    if (// If this is a dynamic RSC request or a server action request, we should
                    // use the postponed data from the static render (if available). This
                    // ensures that we can utilize the resume data cache (RDC) from the static
                    // render to ensure that the data is consistent between the static and
                    // dynamic renders (for navigations) or when re-rendering after a server
                    // action.
                    // Only enable RDC for Navigations if the feature is enabled.
                    supportsRDCForNavigations && process.env.NEXT_RUNTIME !== 'edge' && !isMinimalMode && incrementalCache && // Include both dynamic RSC requests (navigations) and server actions
                    (isDynamicRSCRequest || isPossibleServerAction) && // We don't typically trigger an on-demand revalidation for dynamic RSC
                    // requests, as we're typically revalidating the page in the background
                    // instead. However, if the cache entry is stale, we should trigger a
                    // background revalidation on dynamic RSC requests. This prevents us
                    // from entering an infinite loop of revalidations.
                    !forceStaticRender) {
                        const incrementalCacheEntry = await incrementalCache.get(resolvedPathname, {
                            kind: _responsecache.IncrementalCacheKind.APP_PAGE,
                            isRoutePPREnabled: true,
                            isFallback: false
                        });
                        // If the cache entry is found, we should use the postponed data from
                        // the cache.
                        if (incrementalCacheEntry && incrementalCacheEntry.value && incrementalCacheEntry.value.kind === _responsecache.CachedRouteKind.APP_PAGE) {
                            // CRITICAL: we're assigning the postponed data from the cache entry
                            // here as we're using the RDC to resume the render.
                            postponed = incrementalCacheEntry.value.postponed;
                            // If the cache entry is stale, we should trigger a background
                            // revalidation so that subsequent requests will get a fresh response.
                            if (incrementalCacheEntry && // We want to trigger this flow if the cache entry is stale and if
                            // the requested revalidation flow is either foreground or
                            // background.
                            (incrementalCacheEntry.isStale === -1 || incrementalCacheEntry.isStale === true)) {
                                // We want to schedule this on the next tick to ensure that the
                                // render is not blocked on it.
                                (0, _scheduler.scheduleOnNextTick)(async ()=>{
                                    const responseCache = routeModule.getResponseCache(req);
                                    try {
                                        await responseCache.revalidate(resolvedPathname, incrementalCache, isRoutePPREnabled, false, (c)=>responseGenerator({
                                                ...c,
                                                // CRITICAL: we need to set this to true as we're
                                                // revalidating in the background and typically this dynamic
                                                // RSC request is not treated as static.
                                                forceStaticRender: true
                                            }), // CRITICAL: we need to pass null here because passing the
                                        // previous cache entry here (which is stale) will switch on
                                        // isOnDemandRevalidate and break the prerendering.
                                        null, hasResolved, ctx.waitUntil);
                                    } catch (err) {
                                        console.error('Error revalidating the page in the background', err);
                                    }
                                });
                            }
                        }
                    }
                    // When we're in minimal mode, if we're trying to debug the static shell,
                    // return an empty App Page response instead of resuming the dynamic
                    // render. The static shell has already been streamed by the platform.
                    if ((isDebugStaticShell || isDebugDynamicAccesses) && typeof postponed !== 'undefined') {
                        return {
                            cacheControl: {
                                revalidate: 1,
                                expire: undefined
                            },
                            value: {
                                kind: _responsecache.CachedRouteKind.APP_PAGE,
                                html: _renderresult.default.fromStatic('', isRSCRequest ? _approuterheaders.RSC_CONTENT_TYPE_HEADER : _constants1.HTML_CONTENT_TYPE_HEADER),
                                rscData: undefined,
                                postponed,
                                segmentData: undefined,
                                headers: undefined,
                                status: undefined
                            }
                        };
                    }
                    const placeholderFallbackRouteParams = // When a request carries dynamic placeholder values (e.g. "[slug]"),
                    // defer only the unresolved subset instead of forcing all fallback
                    // params to suspend.
                    !routeModule.isDev && pageIsDynamic && (prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams) ? (0, _fallbackparams.getPlaceholderFallbackRouteParams)(params, prerenderInfo.fallbackRouteParams) : null;
                    const fallbackRouteParamsForRender = placeholderFallbackRouteParams && placeholderFallbackRouteParams.length > 0 ? placeholderFallbackRouteParams : prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams;
                    const hasPlaceholderFallbackRouteParams = placeholderFallbackRouteParams != null && placeholderFallbackRouteParams.length > 0;
                    // When route-module.ts resolved partial nxtP* params during
                    // background revalidation, filter fallbackRouteParams to only the
                    // params that are still unresolved. This lets doRender produce an
                    // intermediate PPR shell that suspends only for those params.
                    let effectiveFallbackRouteParams = null;
                    if (nextConfig.cacheComponents && (prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams)) {
                        const resolvedKeys = (0, _requestmeta.getRequestMeta)(req, 'resolvedRouteParamKeys');
                        if (resolvedKeys && resolvedKeys.size > 0) {
                            effectiveFallbackRouteParams = prerenderInfo.fallbackRouteParams.filter((param)=>!resolvedKeys.has(param.paramName));
                        }
                    }
                    const fallbackRouteParams = // In production or when debugging the static shell for a
                    // non-prerendered URL, use the prerender manifest's fallback route
                    // params which correctly identifies which params are unknown.
                    (isProduction && (0, _requestmeta.getRequestMeta)(req, 'renderFallbackShell') || hasPlaceholderFallbackRouteParams || isDebugStaticShell && !isPrerendered) && fallbackRouteParamsForRender ? (0, _fallbackparams.createOpaqueFallbackRouteParams)(fallbackRouteParamsForRender) : // others still have placeholders, use the filtered subset so the
                    // prerender suspends only for the unresolved params.
                    effectiveFallbackRouteParams && effectiveFallbackRouteParams.length > 0 && effectiveFallbackRouteParams.length < ((prerenderInfo == null ? void 0 : (_prerenderInfo_fallbackRouteParams = prerenderInfo.fallbackRouteParams) == null ? void 0 : _prerenderInfo_fallbackRouteParams.length) ?? 0) ? (0, _fallbackparams.createOpaqueFallbackRouteParams)(effectiveFallbackRouteParams) : // deferring the params the key leaves as placeholders (the
                    // ones `generateStaticParams` can never provide) so they
                    // resume per request instead of baking into the shared entry.
                    // This is the blocking analog of the background shell
                    // upgrade above and is likewise self-hosted only: in minimal
                    // mode the platform proxy owns this contract by stripping
                    // never-prerenderable params from the request, which defers
                    // them through the placeholder handling instead.
                    !isMinimalMode && usesCompletedShellCacheKey && remainingFallbackRouteParams.length > 0 ? (0, _fallbackparams.createOpaqueFallbackRouteParams)(remainingFallbackRouteParams) : isDebugFallbackShell ? (0, _fallbackparams.getFallbackRouteParams)(normalizedSrcPage, routeModule) : null;
                    // For staged dynamic rendering (Cached Navigations) and debug static
                    // shell rendering, pass the fallback params via request meta so the
                    // RequestStore knows which params to defer. We don't pass them as
                    // fallbackRouteParams because that would replace actual param values
                    // with opaque placeholders during segment resolution.
                    if ((isProduction || isDebugStaticShell) && nextConfig.cacheComponents && !isPrerendered && (prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams)) {
                        const fallbackParams = (0, _fallbackparams.createOpaqueFallbackRouteParams)(fallbackRouteParamsForRender ?? prerenderInfo.fallbackRouteParams);
                        if (fallbackParams) {
                            (0, _requestmeta.addRequestMeta)(req, 'fallbackParams', fallbackParams);
                        }
                    }
                    // Perform the render.
                    return doRender({
                        span,
                        postponed,
                        fallbackRouteParams,
                        forceStaticRender,
                        allowEmptyStaticShell: isInstantNavigationTest || undefined
                    });
                } catch (err) {
                    // if this is a background revalidate we need to report
                    // the request error here as it won't be bubbled
                    if (previousIncrementalCacheEntry == null ? void 0 : previousIncrementalCacheEntry.isStale) {
                        const silenceLog = false;
                        await routeModule.onRequestError(req, err, {
                            routerKind: 'App Router',
                            routePath: srcPage,
                            routeType: 'render',
                            revalidateReason: (0, _utils.getRevalidateReason)({
                                isStaticGeneration: isSSG,
                                isOnDemandRevalidate
                            })
                        }, silenceLog, routerServerContext);
                    }
                    throw err;
                }
            };
            const handleResponse = async (span)=>{
                var _cacheEntry_value, _cachedData_headers;
                const cacheEntry = await routeModule.handleResponse({
                    cacheKey: ssgCacheKey,
                    responseGenerator: (c)=>responseGenerator({
                            span,
                            ...c
                        }),
                    routeKind: _routekind.RouteKind.APP_PAGE,
                    isOnDemandRevalidate,
                    isRoutePPREnabled,
                    req,
                    nextConfig,
                    prerenderManifest,
                    waitUntil: ctx.waitUntil,
                    isMinimalMode
                });
                if (isDraftMode) {
                    res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
                }
                // Dev responses use `no-cache` so the browser can restore them from the
                // HTTP cache on back/forward instead of reloading. HMR refresh responses
                // opt out into `no-store` because a superseded refresh's fetch is aborted
                // mid-write: under `no-cache` the response is stored, so the abort leaves
                // the cache entry shared with the superseding refresh (same URL)
                // half-written; Chromium then discards it and reissues the superseding
                // refresh on a second connection as a duplicate request. `no-store` keeps
                // that entry from being created.
                if (routeModule.isDev) {
                    res.setHeader('Cache-Control', req.headers[_approuterheaders.NEXT_HMR_REFRESH_HEADER] === '1' ? 'no-store' : 'no-cache, must-revalidate');
                }
                if (!cacheEntry) {
                    if (ssgCacheKey) {
                        // A cache entry might not be generated if a response is written
                        // in `getInitialProps` or `getServerSideProps`, but those shouldn't
                        // have a cache key. If we do have a cache key but we don't end up
                        // with a cache entry, then either Next.js or the application has a
                        // bug that needs fixing.
                        throw Object.defineProperty(new Error('invariant: cache entry required but not generated'), "__NEXT_ERROR_CODE", {
                            value: "E62",
                            enumerable: false,
                            configurable: true
                        });
                    }
                    return null;
                }
                if (((_cacheEntry_value = cacheEntry.value) == null ? void 0 : _cacheEntry_value.kind) !== _responsecache.CachedRouteKind.APP_PAGE) {
                    var _cacheEntry_value1;
                    throw Object.defineProperty(new Error(`Invariant app-page handler received invalid cache entry ${(_cacheEntry_value1 = cacheEntry.value) == null ? void 0 : _cacheEntry_value1.kind}`), "__NEXT_ERROR_CODE", {
                        value: "E707",
                        enumerable: false,
                        configurable: true
                    });
                }
                const didPostpone = typeof cacheEntry.value.postponed === 'string';
                // Set the build ID header for RSC navigation requests when deploymentId is configured. This
                // corresponds with maybeAppendBuildIdToRSCPayload in app-render.tsx which omits the build ID
                // from the RSC payload when deploymentId is set (relying on this header instead). Server
                // actions are excluded here because action redirect responses get the deployment ID header
                // from the pre-fetched redirect target (via createRedirectRenderResult in action-handler.ts
                // which copies headers from the internal RSC fetch).
                // For static prerenders served from CDN, routes-manifest.json adds a header.
                if (isRSCRequest && !isPossibleServerAction && deploymentId) {
                    res.setHeader(_constants1.NEXT_NAV_DEPLOYMENT_ID_HEADER, deploymentId);
                }
                if (isSSG && // We don't want to send a cache header for requests that contain dynamic
                // data. If this is a Dynamic RSC request or wasn't a Prefetch RSC
                // request, then we should set the cache header.
                !isDynamicRSCRequest && (!didPostpone || isPrefetchRSCRequest)) {
                    if (!isMinimalMode) {
                        // set x-nextjs-cache header to match the header
                        // we set for the image-optimizer
                        res.setHeader('x-nextjs-cache', isOnDemandRevalidate ? 'REVALIDATED' : cacheEntry.isMiss ? 'MISS' : cacheEntry.isStale ? 'STALE' : 'HIT');
                    }
                    // Set a header used by the client router to signal the response is static
                    // and should respect the `static` cache staleTime value.
                    res.setHeader(_approuterheaders.NEXT_IS_PRERENDER_HEADER, '1');
                }
                const { value: cachedData } = cacheEntry;
                // Coerce the cache control parameter from the render.
                let cacheControl;
                // If this is a resume request in minimal mode it is streamed with dynamic
                // content and should not be cached.
                if (hasPostponedState) {
                    cacheControl = {
                        revalidate: 0,
                        expire: undefined
                    };
                } else if (isDynamicRSCRequest) {
                    cacheControl = {
                        revalidate: 0,
                        expire: undefined
                    };
                } else if (!routeModule.isDev) {
                    // If this is a preview mode request, we shouldn't cache it
                    if (isDraftMode) {
                        cacheControl = {
                            revalidate: 0,
                            expire: undefined
                        };
                    } else if (!isSSG) {
                        if (!res.getHeader('Cache-Control')) {
                            cacheControl = {
                                revalidate: 0,
                                expire: undefined
                            };
                        }
                    } else if (cacheEntry.cacheControl) {
                        // If the cache entry has a cache control with a revalidate value that's
                        // a number, use it.
                        if (typeof cacheEntry.cacheControl.revalidate === 'number') {
                            if (cacheEntry.cacheControl.revalidate < 1) {
                                throw Object.defineProperty(new Error(`Invalid revalidate configuration provided: ${cacheEntry.cacheControl.revalidate} < 1`), "__NEXT_ERROR_CODE", {
                                    value: "E22",
                                    enumerable: false,
                                    configurable: true
                                });
                            }
                            cacheControl = {
                                revalidate: cacheEntry.cacheControl.revalidate,
                                expire: cacheEntry.cacheControl.expire
                            };
                        } else {
                            cacheControl = {
                                revalidate: _constants1.CACHE_ONE_YEAR_SECONDS,
                                expire: undefined
                            };
                        }
                    }
                }
                cacheEntry.cacheControl = cacheControl;
                if (typeof segmentPrefetchHeader === 'string' && (cachedData == null ? void 0 : cachedData.kind) === _responsecache.CachedRouteKind.APP_PAGE && cachedData.segmentData) {
                    var _cachedData_headers1;
                    // This is a prefetch request issued by the client Segment Cache. These
                    // should never reach the application layer (lambda). We should either
                    // respond from the cache (HIT) or respond with 404 (MISS).
                    // Set a header to indicate that PPR is enabled for this route. This
                    // lets the client distinguish between a regular cache miss and a cache
                    // miss due to PPR being disabled. In other contexts this header is used
                    // to indicate that the response contains dynamic data, but here we're
                    // only using it to indicate that the feature is enabled — the segment
                    // response itself contains whether the data is dynamic.
                    res.setHeader(_approuterheaders.NEXT_DID_POSTPONE_HEADER, '2');
                    // Add the cache tags header to the response if it exists and we're in
                    // minimal mode while rendering a static page.
                    const tags = (_cachedData_headers1 = cachedData.headers) == null ? void 0 : _cachedData_headers1[_constants1.NEXT_CACHE_TAGS_HEADER];
                    if (isMinimalMode && isSSG && tags && typeof tags === 'string') {
                        res.setHeader(_constants1.NEXT_CACHE_TAGS_HEADER, tags);
                    }
                    const matchedSegment = cachedData.segmentData.get(segmentPrefetchHeader);
                    if (matchedSegment !== undefined) {
                        // Cache hit
                        return (0, _sendpayload.sendRenderResult)({
                            req,
                            res,
                            generateEtags: nextConfig.generateEtags,
                            poweredByHeader: nextConfig.poweredByHeader,
                            result: _renderresult.default.fromStatic(matchedSegment, _approuterheaders.RSC_CONTENT_TYPE_HEADER),
                            cacheControl: cacheEntry.cacheControl
                        });
                    }
                    // Cache miss. Either a cache entry for this route has not been generated
                    // (which technically should not be possible when PPR is enabled, because
                    // at a minimum there should always be a fallback entry) or there's no
                    // match for the requested segment. Respond with a 404.
                    res.statusCode = 404;
                    return (0, _sendpayload.sendRenderResult)({
                        req,
                        res,
                        generateEtags: nextConfig.generateEtags,
                        poweredByHeader: nextConfig.poweredByHeader,
                        result: _renderresult.default.EMPTY,
                        cacheControl: cacheEntry.cacheControl
                    });
                }
                // If there's a callback for `onCacheEntry`, call it with the cache entry
                // and the revalidate options. If we support RDC for Navigations, we
                // prefer the `onCacheEntryV2` callback. Once RDC for Navigations is the
                // default, we can remove the fallback to `onCacheEntry` as
                // `onCacheEntryV2` is now fully supported.
                const onCacheEntry = supportsRDCForNavigations ? (0, _requestmeta.getRequestMeta)(req, 'onCacheEntryV2') ?? (0, _requestmeta.getRequestMeta)(req, 'onCacheEntry') : (0, _requestmeta.getRequestMeta)(req, 'onCacheEntry');
                // `onCacheEntry` lets the platform capture a freshly prerendered result
                // so the proxy can write it to the ISR cache; on deploy it returns true
                // and the function returns below. In debug-shell mode the render was
                // skipped and we only serve the already-cached shell, so there is nothing
                // to capture, and we need to reach the serve path below to close the
                // document. `onCacheEntry` is absent in `next start`/dev, so this guard
                // only affects the deploy (minimalMode) path.
                if (onCacheEntry && !isDebugStaticShell) {
                    var _parseUrl;
                    const rawCacheEntryUrl = (0, _requestmeta.getRequestMeta)(req, 'initURL') ?? req.url;
                    const cacheEntryUrl = rawCacheEntryUrl ? ((_parseUrl = (0, _url.parseUrl)(rawCacheEntryUrl)) == null ? void 0 : _parseUrl.pathname) ?? rawCacheEntryUrl : undefined;
                    const finished = await onCacheEntry(cacheEntry, {
                        url: cacheEntryUrl
                    });
                    if (finished) return null;
                }
                if (cachedData.headers) {
                    const headers = {
                        ...cachedData.headers
                    };
                    if (!isMinimalMode || !isSSG) {
                        delete headers[_constants1.NEXT_CACHE_TAGS_HEADER];
                    }
                    for (let [key, value] of Object.entries(headers)){
                        if (typeof value === 'undefined') continue;
                        if (Array.isArray(value)) {
                            for (const v of value){
                                res.appendHeader(key, v);
                            }
                        } else if (typeof value === 'number') {
                            value = value.toString();
                            res.appendHeader(key, value);
                        } else {
                            res.appendHeader(key, value);
                        }
                    }
                }
                // Add the cache tags header to the response if it exists and we're in
                // minimal mode while rendering a static page.
                const tags = (_cachedData_headers = cachedData.headers) == null ? void 0 : _cachedData_headers[_constants1.NEXT_CACHE_TAGS_HEADER];
                if (isMinimalMode && isSSG && tags && typeof tags === 'string') {
                    res.setHeader(_constants1.NEXT_CACHE_TAGS_HEADER, tags);
                }
                // If the request is a data request, then we shouldn't set the status code
                // from the response because it should always be 200. This should be gated
                // behind the experimental PPR flag.
                if (cachedData.status && (!isRSCRequest || !isRoutePPREnabled)) {
                    res.statusCode = cachedData.status;
                }
                // Redirect information is encoded in RSC payload, so we don't need to use redirect status codes
                if (!isMinimalMode && cachedData.status && _redirectstatuscode.RedirectStatusCode[cachedData.status] && isRSCRequest) {
                    res.statusCode = 200;
                }
                // Mark that the request did postpone.
                if (didPostpone && !isDynamicRSCRequest) {
                    res.setHeader(_approuterheaders.NEXT_DID_POSTPONE_HEADER, '1');
                }
                // we don't go through this block when preview mode is true
                // as preview mode is a dynamic request (bypasses cache) and doesn't
                // generate both HTML and payloads in the same request so continue to just
                // return the generated payload
                if (isRSCRequest && !isDraftMode) {
                    // If this is a dynamic RSC request, then stream the response.
                    if (typeof cachedData.rscData === 'undefined') {
                        // If the response is not an RSC response, then we can't serve it.
                        if (cachedData.html.contentType !== _approuterheaders.RSC_CONTENT_TYPE_HEADER) {
                            if (nextConfig.cacheComponents) {
                                res.statusCode = 404;
                                return (0, _sendpayload.sendRenderResult)({
                                    req,
                                    res,
                                    generateEtags: nextConfig.generateEtags,
                                    poweredByHeader: nextConfig.poweredByHeader,
                                    result: _renderresult.default.EMPTY,
                                    cacheControl: cacheEntry.cacheControl
                                });
                            } else {
                                // Otherwise this case is not expected.
                                throw Object.defineProperty(new _invarianterror.InvariantError(`Expected RSC response, got ${cachedData.html.contentType}`), "__NEXT_ERROR_CODE", {
                                    value: "E789",
                                    enumerable: false,
                                    configurable: true
                                });
                            }
                        }
                        return (0, _sendpayload.sendRenderResult)({
                            req,
                            res,
                            generateEtags: nextConfig.generateEtags,
                            poweredByHeader: nextConfig.poweredByHeader,
                            result: cachedData.html,
                            cacheControl: cacheEntry.cacheControl
                        });
                    }
                    // As this isn't a prefetch request, we should serve the static flight
                    // data.
                    return (0, _sendpayload.sendRenderResult)({
                        req,
                        res,
                        generateEtags: nextConfig.generateEtags,
                        poweredByHeader: nextConfig.poweredByHeader,
                        result: _renderresult.default.fromStatic(cachedData.rscData, _approuterheaders.RSC_CONTENT_TYPE_HEADER),
                        cacheControl: cacheEntry.cacheControl
                    });
                }
                // This is a request for HTML data.
                const body = cachedData.html;
                // Instant Navigation Testing API: under the instant lock we serve the
                // static shell as a complete document without resuming the dynamic
                // render, either recovering from an empty (blocking) shell or appending
                // the closing tags to a non-empty one.
                if (isInstantNavigationTest && isDebugStaticShell) {
                    const isEmptyPrelude = typeof cachedData.postponed === 'string' && _entrybase.isEmptyHTMLPrelude(cachedData.postponed);
                    if (isEmptyPrelude) {
                        // A blocking route (a Suspense boundary above <body>, or `export
                        // const instant = false`) has an empty static shell. Serving it under
                        // the lock would be a blank document with no way to release the lock,
                        // so every reload would render the same blank shell and leave the
                        // user stuck. We surface the reason instead: in development we throw
                        // so it shows as an error overlay (the catch below clears the instant
                        // cookie via Set-Cookie); in production we serve a minimal document
                        // whose script clears the cookie client-side, since on deploy the
                        // edge has already served the cached shell and committed the response
                        // headers and this function only resumes by appending to the body, so
                        // a Set-Cookie could not take effect. `next start` reuses the same
                        // document, where throwing would render only a generic "Internal
                        // Server Error" page.
                        if (routeModule.isDev === true) {
                            throw Object.defineProperty(new Error(`The Navigation Inspector was active, but you attempted to load a blocking route. Reload the page to reset the inspector.\n\n` + `To identify why this route is blocking, refer to the Instant Navigation docs: https://preview.nextjs.org/docs/app/guides/instant-navigation`), "__NEXT_ERROR_CODE", {
                                value: "E1387",
                                enumerable: false,
                                configurable: true
                            });
                        }
                        const recoveryHtml = `<!DOCTYPE html><html><head><meta charSet="utf-8"/></head><body>` + `<script>document.cookie="${_approuterheaders.NEXT_INSTANT_TEST_COOKIE}=; Path=/; Max-Age=0"</script>` + `<p>The Navigation Inspector was active, but you attempted to load a blocking route. Reload the page to reset the inspector.</p>` + `<p>To identify why this route is blocking, refer to the ` + `<a href="https://preview.nextjs.org/docs/app/guides/instant-navigation">Instant Navigation docs</a>.</p>` + `</body></html>`;
                        return (0, _sendpayload.sendRenderResult)({
                            req,
                            res,
                            generateEtags: nextConfig.generateEtags,
                            poweredByHeader: nextConfig.poweredByHeader,
                            result: _renderresult.default.fromStatic(recoveryHtml, _constants1.HTML_CONTENT_TYPE_HEADER),
                            cacheControl: {
                                revalidate: 0,
                                expire: undefined
                            }
                        });
                    }
                    // Non-empty shell: the cookie-guarded bootstrap that sets
                    // self.__next_instant_test is embedded in the prerendered shell via
                    // `bootstrapScriptContent`, so it is already present (in the served
                    // shell for a fresh render, or in the cached prelude on deploy). Append
                    // the closing tags so the browser can parse a complete document.
                    body.push(new ReadableStream({
                        start (controller) {
                            controller.enqueue(_encodedtags.ENCODED_TAGS.CLOSED.BODY_AND_HTML);
                            controller.close();
                        }
                    }));
                    return (0, _sendpayload.sendRenderResult)({
                        req,
                        res,
                        generateEtags: nextConfig.generateEtags,
                        poweredByHeader: nextConfig.poweredByHeader,
                        result: body,
                        cacheControl: {
                            revalidate: 0,
                            expire: undefined
                        }
                    });
                }
                // If there's no postponed state, we should just serve the HTML. This
                // should also be the case for a resume request because it's completed
                // as a server render (rather than a static render).
                if (!didPostpone || isMinimalMode || isRSCRequest) {
                    // If we're in test mode, we should add a sentinel chunk to the response
                    // that's between the static and dynamic parts so we can compare the
                    // chunks and add assertions.
                    if (process.env.__NEXT_TEST_MODE && isMinimalMode && isRoutePPREnabled && body.contentType === _constants1.HTML_CONTENT_TYPE_HEADER) {
                        // As we're in minimal mode, the static part would have already been
                        // streamed first. The only part that this streams is the dynamic part
                        // so we should FIRST stream the sentinel and THEN the dynamic part.
                        body.unshift(createPPRBoundarySentinel());
                    }
                    return (0, _sendpayload.sendRenderResult)({
                        req,
                        res,
                        generateEtags: nextConfig.generateEtags,
                        poweredByHeader: nextConfig.poweredByHeader,
                        result: body,
                        cacheControl: cacheEntry.cacheControl
                    });
                }
                // If we're debugging the static shell or the dynamic API accesses, we
                // should just serve the HTML without resuming the render. The returned
                // HTML will be the static shell so all the Dynamic API's will be used
                // during static generation.
                if (isDebugStaticShell || isDebugDynamicAccesses) {
                    // Since we're not resuming the render, we need to at least add the
                    // closing body and html tags to create valid HTML.
                    body.push(new ReadableStream({
                        start (controller) {
                            controller.enqueue(_encodedtags.ENCODED_TAGS.CLOSED.BODY_AND_HTML);
                            controller.close();
                        }
                    }));
                    return (0, _sendpayload.sendRenderResult)({
                        req,
                        res,
                        generateEtags: nextConfig.generateEtags,
                        poweredByHeader: nextConfig.poweredByHeader,
                        result: body,
                        cacheControl: {
                            revalidate: 0,
                            expire: undefined
                        }
                    });
                }
                // If we're in test mode, we should add a sentinel chunk to the response
                // that's between the static and dynamic parts so we can compare the
                // chunks and add assertions.
                if (process.env.__NEXT_TEST_MODE) {
                    body.push(createPPRBoundarySentinel());
                }
                // This request has postponed, so let's create a new transformer that the
                // dynamic data can pipe to that will attach the dynamic data to the end
                // of the response.
                const transformer = new TransformStream();
                body.push(transformer.readable);
                // Plumb fallback params via request meta so the RequestStore created
                // downstream in app-render.tsx knows which params to defer during the
                // resume. We don't pass them as `fallbackRouteParams` because that
                // would replace actual param values with opaque placeholders during
                // segment resolution; the resolved values are baked into the URL and
                // already interpolated into the postponed state.
                if (nextConfig.cacheComponents && (prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams)) {
                    const fallbackParams = (0, _fallbackparams.createOpaqueFallbackRouteParams)(prerenderInfo.fallbackRouteParams);
                    if (fallbackParams) {
                        (0, _requestmeta.addRequestMeta)(req, 'fallbackParams', fallbackParams);
                    }
                }
                // Perform the render again, but this time, provide the postponed state.
                // We don't await because we want the result to start streaming now, and
                // we've already chained the transformer's readable to the render result.
                doRender({
                    span,
                    postponed: cachedData.postponed,
                    // This is a resume render, not a fallback render. Fallback params
                    // (for cacheComponents routes) are plumbed via request meta above.
                    fallbackRouteParams: null,
                    forceStaticRender: false
                }).then(async (result)=>{
                    var _result_value;
                    if (!result) {
                        throw Object.defineProperty(new Error('Invariant: expected a result to be returned'), "__NEXT_ERROR_CODE", {
                            value: "E463",
                            enumerable: false,
                            configurable: true
                        });
                    }
                    if (((_result_value = result.value) == null ? void 0 : _result_value.kind) !== _responsecache.CachedRouteKind.APP_PAGE) {
                        var _result_value1;
                        throw Object.defineProperty(new Error(`Invariant: expected a page response, got ${(_result_value1 = result.value) == null ? void 0 : _result_value1.kind}`), "__NEXT_ERROR_CODE", {
                            value: "E305",
                            enumerable: false,
                            configurable: true
                        });
                    }
                    // Pipe the resume result to the transformer.
                    await result.value.html.pipeTo(transformer.writable);
                }).catch((err)=>{
                    // An error occurred during piping or preparing the render, abort
                    // the transformers writer so we can terminate the stream.
                    transformer.writable.abort(err).catch((e)=>{
                        console.error("couldn't abort transformer", e);
                    });
                });
                return (0, _sendpayload.sendRenderResult)({
                    req,
                    res,
                    generateEtags: nextConfig.generateEtags,
                    poweredByHeader: nextConfig.poweredByHeader,
                    result: body,
                    // We don't want to cache the response if it has postponed data because
                    // the response being sent to the client it's dynamic parts are streamed
                    // to the client on the same request.
                    cacheControl: {
                        revalidate: 0,
                        expire: undefined
                    }
                });
            };
            // TODO: activeSpan code path is for when wrapped by
            // next-server can be removed when this is no longer used
            if (isWrappedByNextServer && activeSpan) {
                await handleResponse(activeSpan);
            } else {
                parentSpan = tracer.getActiveScopeSpan();
                return await tracer.withPropagatedContext(req.headers, ()=>tracer.trace(_constants.BaseServerSpan.handleRequest, {
                        spanName: `${method} ${srcPage}`,
                        kind: _tracer.SpanKind.SERVER,
                        attributes: {
                            'http.method': method,
                            'http.target': httpTarget
                        }
                    }, handleResponse), undefined, !isWrappedByNextServer);
            }
        } catch (err) {
            // If an Instant Navigation Testing document render fails (e.g. the page
            // blocks at the root with no Suspense boundary above it, producing an empty
            // or bailed-out static shell), clear the instant navigation cookie before
            // serving the error page. Otherwise the cookie would persist and every
            // reload would re-render the same broken shell, leaving the user stuck
            // without a way to release the lock.
            if (isInstantNavigationTest && !res.headersSent) {
                res.setHeader('Set-Cookie', `${_approuterheaders.NEXT_INSTANT_TEST_COOKIE}=; Path=/; Max-Age=0`);
            }
            if (!(err instanceof _nofallbackerrorexternal.NoFallbackError)) {
                const silenceLog = false;
                await routeModule.onRequestError(req, err, {
                    routerKind: 'App Router',
                    routePath: srcPage,
                    routeType: 'render',
                    revalidateReason: (0, _utils.getRevalidateReason)({
                        isStaticGeneration: isSSG,
                        isOnDemandRevalidate
                    })
                }, silenceLog, routerServerContext);
            }
            // rethrow so that we can handle serving error page
            throw err;
        }
    }
    return {
        __next_app__,
        routeModule,
        handler
    };
}
// TODO: omit this from production builds, only test builds should include it
/**
 * Creates a readable stream that emits a PPR boundary sentinel.
 *
 * @returns A readable stream that emits a PPR boundary sentinel.
 */ function createPPRBoundarySentinel() {
    return new ReadableStream({
        start (controller) {
            controller.enqueue(new TextEncoder().encode('<!-- PPR_BOUNDARY_SENTINEL -->'));
            controller.close();
        }
    });
}

//# sourceMappingURL=app-page-runtime.js.map