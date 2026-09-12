import { addRequestMeta } from '../../request-meta';
import { renderToHTMLOrFlight, runValidationInDevFromSnapshot } from '../../app-render/app-render';
import { RouteModule } from '../route-module';
import * as vendoredContexts from './vendored/contexts/entrypoints';
import { PrerenderManifestMatcher } from './helpers/prerender-manifest-matcher';
import { NEXT_ROUTER_PREFETCH_HEADER, NEXT_ROUTER_SEGMENT_PREFETCH_HEADER, NEXT_ROUTER_STATE_TREE_HEADER, NEXT_URL, RSC_HEADER } from '../../../client/components/app-router-headers';
import { isInterceptionRouteAppPath } from '../../../shared/lib/router/utils/interception-routes';
import { RSCPathnameNormalizer } from '../../normalizers/request/rsc';
import { SegmentPrefixRSCPathnameNormalizer } from '../../normalizers/request/segment-prefix-rsc';
import { applyAppPageRscRequestMetaFromHeaders, normalizeAppPageRequestUrl } from './normalize-request-url';
let vendoredReactRSC;
let vendoredReactSSR;
// the vendored Reacts are loaded from their original source in the edge runtime
if (process.env.NEXT_RUNTIME !== 'edge') {
    vendoredReactRSC = require('./vendored/rsc/entrypoints');
    vendoredReactSSR = require('./vendored/ssr/entrypoints');
    // In Node environments we need to access the correct React instance from external modules such
    // as global patches. We register the loaded React instances here.
    const { registerServerReact, registerClientReact } = require('../../runtime-reacts.external');
    registerServerReact(vendoredReactRSC.React);
    registerClientReact(vendoredReactSSR.React);
}
export class AppPageRouteModule extends RouteModule {
    match(pathname, prerenderManifest) {
        // Lazily create the matcher based on the provided prerender manifest.
        let matcher = this.matchers.get(prerenderManifest);
        if (!matcher) {
            matcher = new PrerenderManifestMatcher(this.definition.pathname, prerenderManifest);
            this.matchers.set(prerenderManifest, matcher);
        }
        // Match the pathname to the dynamic route.
        return matcher.match(pathname);
    }
    normalizeUrl(req, parsedUrl) {
        if (this.normalizers.segmentPrefetchRSC.match(parsedUrl.pathname || '/')) {
            const result = this.normalizers.segmentPrefetchRSC.extract(parsedUrl.pathname || '/');
            if (!result) return false;
            const { originalPathname, segmentPath } = result;
            parsedUrl.pathname = originalPathname;
            // Mark the request as a router prefetch request.
            req.headers[RSC_HEADER] = '1';
            req.headers[NEXT_ROUTER_PREFETCH_HEADER] = '1';
            req.headers[NEXT_ROUTER_SEGMENT_PREFETCH_HEADER] = segmentPath;
            addRequestMeta(req, 'isRSCRequest', true);
            addRequestMeta(req, 'isPrefetchRSCRequest', true);
            addRequestMeta(req, 'segmentPrefetchRSCRequest', segmentPath);
        } else if (this.normalizers.rsc.match(parsedUrl.pathname || '/')) {
            parsedUrl.pathname = this.normalizers.rsc.normalize(parsedUrl.pathname || '/', true);
            // Mark the request as a RSC request.
            req.headers[RSC_HEADER] = '1';
        } else {
            super.normalizeUrl(req, parsedUrl);
        }
        // Minimal adapters can bypass base-server request normalization and invoke
        // route modules directly, so derive RSC/prefetch metadata from headers.
        applyAppPageRscRequestMetaFromHeaders(req);
        normalizeAppPageRequestUrl(req, parsedUrl.pathname || '/');
    }
    render(req, res, context) {
        return renderToHTMLOrFlight(req, res, context.page, context.query, context.fallbackRouteParams, context.renderOpts, context.serverComponentsHmrCache, context.sharedContext);
    }
    /**
   * Worker entry point for dev Cache Components dev validation. The dev
   * validation worker reloads this route's module and calls this so the whole
   * validation runs inside the app-page bundle's React instance (the same one
   * the user's client components resolve through `componentMod`), rebuilding
   * the render context from the transported `message`. `componentMod` is the
   * reloaded module the worker holds; it's passed in because the route module
   * has no back-reference to it. Returns the validation errors for the worker
   * to serialize and the main thread to deliver to the dev overlay.
   */ runValidationInDev(componentMod, message, abortSignal) {
        return runValidationInDevFromSnapshot(message, componentMod, abortSignal);
    }
    pathCouldBeIntercepted(resolvedPathname, interceptionRoutePatterns) {
        return isInterceptionRouteAppPath(resolvedPathname) || interceptionRoutePatterns.some((regexp)=>{
            return regexp.test(resolvedPathname);
        });
    }
    getVaryHeader(resolvedPathname, interceptionRoutePatterns) {
        const baseVaryHeader = `${RSC_HEADER}, ${NEXT_ROUTER_STATE_TREE_HEADER}, ${NEXT_ROUTER_PREFETCH_HEADER}, ${NEXT_ROUTER_SEGMENT_PREFETCH_HEADER}`;
        if (this.pathCouldBeIntercepted(resolvedPathname, interceptionRoutePatterns)) {
            // Interception route responses can vary based on the `Next-URL` header.
            // We use the Vary header to signal this behavior to the client to properly cache the response.
            return `${baseVaryHeader}, ${NEXT_URL}`;
        } else {
            // We don't need to include `Next-URL` in the Vary header for non-interception routes since it won't affect the response.
            // We also set this header for pages to avoid caching issues when navigating between pages and app.
            return baseVaryHeader;
        }
    }
    constructor(...args){
        super(...args), this.matchers = new WeakMap(), this.normalizers = {
            rsc: new RSCPathnameNormalizer(),
            segmentPrefetchRSC: new SegmentPrefixRSCPathnameNormalizer()
        };
    }
}
const vendored = {
    'react-rsc': vendoredReactRSC,
    'react-ssr': vendoredReactSSR,
    contexts: vendoredContexts
};
export { renderToHTMLOrFlight, vendored };
export default AppPageRouteModule;

//# sourceMappingURL=module.js.map