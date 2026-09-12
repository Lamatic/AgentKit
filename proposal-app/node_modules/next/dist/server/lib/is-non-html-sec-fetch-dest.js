/**
 * `Sec-Fetch-Dest` values for subresource requests that can never render an
 * HTML response. Excludes destinations that can display HTML (`document`,
 * `iframe`, etc.) and `empty` (`fetch()`/XHR, including RSC requests).
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isNonHtmlSecFetchDest", {
    enumerable: true,
    get: function() {
        return isNonHtmlSecFetchDest;
    }
});
const NON_HTML_SEC_FETCH_DESTS = new Set([
    'audio',
    'audioworklet',
    'font',
    'image',
    'json',
    'manifest',
    'paintworklet',
    'report',
    'script',
    'serviceworker',
    'sharedworker',
    'style',
    'track',
    'video',
    'webidentity',
    'worker',
    'xslt'
]);
function isNonHtmlSecFetchDest(value) {
    return typeof value === 'string' && NON_HTML_SEC_FETCH_DESTS.has(value);
}

//# sourceMappingURL=is-non-html-sec-fetch-dest.js.map