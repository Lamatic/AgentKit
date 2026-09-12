import { FLIGHT_HEADERS, NEXT_HTML_REQUEST_ID_HEADER, NEXT_REQUEST_ID_HEADER } from '../../client/components/app-router-headers';
import { HeadersAdapter } from '../web/spec-extension/adapters/headers';
import { MutableRequestCookiesAdapter, RequestCookiesAdapter, responseCookiesToRequestCookies, createCookiesWithMutableAccessCheck } from '../web/spec-extension/adapters/request-cookies';
import { ResponseCookies, RequestCookies } from '../web/spec-extension/cookies';
import { DraftModeProvider } from './draft-mode-provider';
import { splitCookiesString } from '../web/utils';
/**
 * Internal request headers that userland `headers()` must not expose. They stay
 * on the shared request headers for framework plumbing.
 *
 * Every internal header that the client can send must be listed here. The
 * sealed userland view reads through to the shared request headers, so an
 * omission leaks the header to userland.
 *
 * The names are lowercased because `HeadersAdapter.seal` matches them in
 * lowercase.
 */ const HIDDEN_REQUEST_HEADERS = new Set([
    ...FLIGHT_HEADERS,
    // The client sends these dev-only request IDs so the server can route debug
    // information back to the originating request. Like the flight headers,
    // they are internal plumbing.
    NEXT_REQUEST_ID_HEADER,
    NEXT_HTML_REQUEST_ID_HEADER
].map((header)=>header.toLowerCase()));
function getHeaders(headers) {
    // The sealed userland view must not copy the request headers.
    // `HeadersAdapter.from` returns a `Headers` instance unchanged, so the view
    // reads through to `NextRequest.headers`. A copy detaches `headers()` from
    // the writes that Proxy makes to `NextRequest.headers` afterwards.
    //
    // The view must also not delete the internal headers. Because
    // `HeadersAdapter.from` does not copy, a delete removes them from the shared
    // `req.headers`. The dev server reads the request-id headers from the raw
    // request again, for example when it renders a redirect target after a server
    // action. Their removal breaks the dev debug channel routing.
    return HeadersAdapter.seal(HeadersAdapter.from(headers), HIDDEN_REQUEST_HEADERS);
}
function getMutableCookies(headers, onUpdateCookies) {
    const cookies = new RequestCookies(HeadersAdapter.from(headers));
    return MutableRequestCookiesAdapter.wrap(cookies, onUpdateCookies);
}
/**
 * If middleware set cookies in this request (indicated by `x-middleware-set-cookie`),
 * then merge those into the existing cookie object, so that when `cookies()` is accessed
 * it's able to read the newly set cookies.
 */ function mergeMiddlewareCookies(headers, existingCookies) {
    // TODO: this only fires for `IncomingHttpHeaders`; `Headers` instances
    // silently fall through (the `in` check and bracket access don't reach header
    // values stored in internal slots). Confirm whether edge / Web `Headers`
    // callers need this merge or already handle it elsewhere.
    if ('x-middleware-set-cookie' in headers && typeof headers['x-middleware-set-cookie'] === 'string') {
        const setCookieValue = headers['x-middleware-set-cookie'];
        const responseHeaders = new Headers();
        for (const cookie of splitCookiesString(setCookieValue)){
            responseHeaders.append('set-cookie', cookie);
        }
        const responseCookies = new ResponseCookies(responseHeaders);
        // Transfer cookies from ResponseCookies to RequestCookies
        for (const cookie of responseCookies.getAll()){
            existingCookies.set(cookie);
        }
    }
}
export function createRequestStoreForRender(req, res, url, rootParams, implicitTags, onUpdateCookies, previewProps, isHmrRefresh, serverComponentsHmrCache, resumeDataCache, fallbackParams, hmrRefreshHash) {
    return createRequestStore({
        // Pages start in render phase by default
        phase: 'render',
        headers: req.headers,
        onUpdateCookies: onUpdateCookies ?? (res ? (cookies)=>{
            res.setHeader('Set-Cookie', cookies);
        } : undefined),
        url,
        rootParams,
        implicitTags,
        resumeDataCache,
        previewProps,
        isHmrRefresh,
        serverComponentsHmrCache,
        hmrRefreshHash,
        fallbackParams
    });
}
export function createRequestStoreForAPI(req, url, implicitTags, onUpdateCookies, previewProps, hmrRefreshHash) {
    return createRequestStore({
        // API routes start in action phase by default
        phase: 'action',
        headers: req.headers,
        onUpdateCookies,
        url,
        rootParams: {},
        implicitTags,
        resumeDataCache: null,
        previewProps,
        isHmrRefresh: false,
        serverComponentsHmrCache: undefined,
        hmrRefreshHash,
        fallbackParams: null
    });
}
/**
 * Build a `RequestStore` from a serializable, request-shaped input. Used
 * directly by the existing `createRequestStoreForRender` /
 * `createRequestStoreForAPI` wrappers, and by side-process consumers like the
 * `'use cache'` deadlock probe worker that don't have a real `req`/`res` pair
 * but do have a forwarded snapshot of the outer request's headers etc.
 */ export function createRequestStore(inputs) {
    const { phase, headers, onUpdateCookies, url, rootParams, implicitTags, resumeDataCache, previewProps, isHmrRefresh, serverComponentsHmrCache, hmrRefreshHash, fallbackParams } = inputs;
    const cache = {};
    return {
        type: 'request',
        phase,
        implicitTags,
        // Rather than just using the whole `url` here, we pull the parts we want
        // to ensure we don't use parts of the URL that we shouldn't. This also
        // lets us avoid requiring an empty string for `search` in the type.
        url: {
            pathname: url.pathname,
            search: url.search ?? ''
        },
        rootParams,
        get headers () {
            if (!cache.headers) {
                // Seal the headers object that'll freeze out any methods that could
                // mutate the underlying data.
                cache.headers = getHeaders(headers);
            }
            return cache.headers;
        },
        get cookies () {
            if (!cache.cookies) {
                // if middleware is setting cookie(s), then include those in
                // the initial cached cookies so they can be read in render
                const requestCookies = new RequestCookies(HeadersAdapter.from(headers));
                mergeMiddlewareCookies(headers, requestCookies);
                // Seal the cookies object that'll freeze out any methods that could
                // mutate the underlying data.
                cache.cookies = RequestCookiesAdapter.seal(requestCookies);
            }
            return cache.cookies;
        },
        set cookies (value){
            cache.cookies = value;
        },
        get mutableCookies () {
            if (!cache.mutableCookies) {
                const mutableCookies = getMutableCookies(headers, onUpdateCookies);
                mergeMiddlewareCookies(headers, mutableCookies);
                cache.mutableCookies = mutableCookies;
            }
            return cache.mutableCookies;
        },
        get userspaceMutableCookies () {
            if (!cache.userspaceMutableCookies) {
                const userspaceMutableCookies = createCookiesWithMutableAccessCheck(this);
                cache.userspaceMutableCookies = userspaceMutableCookies;
            }
            return cache.userspaceMutableCookies;
        },
        get draftMode () {
            if (!cache.draftMode) {
                cache.draftMode = new DraftModeProvider(previewProps, headers, this.cookies, this.mutableCookies);
            }
            return cache.draftMode;
        },
        resumeDataCache: resumeDataCache ?? null,
        isHmrRefresh,
        serverComponentsHmrCache: serverComponentsHmrCache || globalThis.__serverComponentsHmrCache,
        hmrRefreshHash,
        fallbackParams
    };
}
export function synchronizeMutableCookies(store) {
    // TODO: does this need to update headers as well?
    store.cookies = RequestCookiesAdapter.seal(responseCookiesToRequestCookies(store.mutableCookies));
}

//# sourceMappingURL=request-store.js.map