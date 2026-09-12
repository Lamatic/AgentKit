"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    applyAppPageRscRequestMetaFromHeaders: null,
    normalizeAppPageRequestUrl: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    applyAppPageRscRequestMetaFromHeaders: function() {
        return applyAppPageRscRequestMetaFromHeaders;
    },
    normalizeAppPageRequestUrl: function() {
        return normalizeAppPageRequestUrl;
    }
});
const _approuterheaders = require("../../../client/components/app-router-headers");
const _isrscrequest = require("../../lib/is-rsc-request");
const _url = require("../../../lib/url");
const _formaturl = require("../../../shared/lib/router/utils/format-url");
const _requestmeta = require("../../request-meta");
function getHeaderValue(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
function applyAppPageRscRequestMetaFromHeaders(req) {
    const isRscRequest = (0, _isrscrequest.isRSCRequestHeader)(req.headers[_approuterheaders.RSC_HEADER]);
    if (!isRscRequest) {
        return;
    }
    (0, _requestmeta.addRequestMeta)(req, 'isRSCRequest', true);
    const isPrefetchRequest = getHeaderValue(req.headers[_approuterheaders.NEXT_ROUTER_PREFETCH_HEADER]) === '1';
    if (!isPrefetchRequest) {
        return;
    }
    (0, _requestmeta.addRequestMeta)(req, 'isPrefetchRSCRequest', true);
    const segmentPrefetchPath = getHeaderValue(req.headers[_approuterheaders.NEXT_ROUTER_SEGMENT_PREFETCH_HEADER]);
    if (segmentPrefetchPath) {
        (0, _requestmeta.addRequestMeta)(req, 'segmentPrefetchRSCRequest', segmentPrefetchPath);
    }
}
function normalizeAppPageRequestUrl(req, pathname) {
    if (!req.url) {
        return;
    }
    const normalizedUrl = (0, _url.parseReqUrl)(req.url);
    if (!normalizedUrl) {
        return;
    }
    normalizedUrl.pathname = pathname;
    req.url = (0, _formaturl.formatUrl)(normalizedUrl);
}

//# sourceMappingURL=normalize-request-url.js.map