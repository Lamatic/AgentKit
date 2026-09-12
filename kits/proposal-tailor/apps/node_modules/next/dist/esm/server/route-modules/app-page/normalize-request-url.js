import { NEXT_ROUTER_PREFETCH_HEADER, NEXT_ROUTER_SEGMENT_PREFETCH_HEADER, RSC_HEADER } from '../../../client/components/app-router-headers';
import { isRSCRequestHeader } from '../../lib/is-rsc-request';
import { parseReqUrl } from '../../../lib/url';
import { formatUrl } from '../../../shared/lib/router/utils/format-url';
import { addRequestMeta } from '../../request-meta';
function getHeaderValue(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
export function applyAppPageRscRequestMetaFromHeaders(req) {
    const isRscRequest = isRSCRequestHeader(req.headers[RSC_HEADER]);
    if (!isRscRequest) {
        return;
    }
    addRequestMeta(req, 'isRSCRequest', true);
    const isPrefetchRequest = getHeaderValue(req.headers[NEXT_ROUTER_PREFETCH_HEADER]) === '1';
    if (!isPrefetchRequest) {
        return;
    }
    addRequestMeta(req, 'isPrefetchRSCRequest', true);
    const segmentPrefetchPath = getHeaderValue(req.headers[NEXT_ROUTER_SEGMENT_PREFETCH_HEADER]);
    if (segmentPrefetchPath) {
        addRequestMeta(req, 'segmentPrefetchRSCRequest', segmentPrefetchPath);
    }
}
export function normalizeAppPageRequestUrl(req, pathname) {
    if (!req.url) {
        return;
    }
    const normalizedUrl = parseReqUrl(req.url);
    if (!normalizedUrl) {
        return;
    }
    normalizedUrl.pathname = pathname;
    req.url = formatUrl(normalizedUrl);
}

//# sourceMappingURL=normalize-request-url.js.map