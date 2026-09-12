import { getLocationOrigin } from '../../utils';
import { searchParamsToUrlQuery } from './querystring';
export function parseRelativeUrl(url, base, parseQuery = true) {
    const globalBase = new URL(typeof window === 'undefined' ? 'http://n' : getLocationOrigin());
    const resolvedBase = base ? new URL(base, globalBase) : url.startsWith('.') ? new URL(typeof window === 'undefined' ? 'http://n' : window.location.href) : globalBase;
    const { pathname, searchParams, search, hash, href, origin } = url.startsWith('/') ? // See https://nodejs.org/api/http.html#messageurl
    // Not using `origin` to support other protocols
    new URL(`${resolvedBase.protocol}//${resolvedBase.host}${url}`) : new URL(url, resolvedBase);
    if (origin !== globalBase.origin) {
        throw Object.defineProperty(new Error(`invariant: invalid relative URL, router received ${url}`), "__NEXT_ERROR_CODE", {
            value: "E159",
            enumerable: false,
            configurable: true
        });
    }
    return {
        auth: null,
        host: null,
        hostname: null,
        pathname,
        port: null,
        protocol: null,
        query: parseQuery ? searchParamsToUrlQuery(searchParams) : undefined,
        search,
        hash,
        href: href.slice(origin.length),
        // We don't know for relative URLs at this point since we set a custom, internal
        // base that isn't surfaced to users.
        slashes: null
    };
}

//# sourceMappingURL=parse-relative-url.js.map