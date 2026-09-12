import { searchParamsToUrlQuery } from './querystring';
import { parseRelativeUrl } from './parse-relative-url';
export function parseUrl(url) {
    if (url.startsWith('/')) {
        return parseRelativeUrl(url);
    }
    const parsedURL = new URL(url);
    const username = parsedURL.username;
    const password = parsedURL.password;
    const auth = username ? password ? `${username}:${password}` : username : null;
    const pathname = parsedURL.pathname;
    const search = parsedURL.search;
    return {
        auth,
        hash: parsedURL.hash,
        hostname: parsedURL.hostname,
        href: parsedURL.href,
        pathname,
        port: parsedURL.port,
        protocol: parsedURL.protocol,
        query: searchParamsToUrlQuery(parsedURL.searchParams),
        search,
        origin: parsedURL.origin,
        slashes: parsedURL.href.slice(parsedURL.protocol.length, parsedURL.protocol.length + 2) === '//'
    };
}

//# sourceMappingURL=parse-url.js.map