"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getInstantTestBootstrapScriptContent", {
    enumerable: true,
    get: function() {
        return getInstantTestBootstrapScriptContent;
    }
});
const _approuterheaders = require("../../client/components/app-router-headers");
const _cachebustingsearchparam = require("../../shared/lib/router/utils/cache-busting-search-param");
async function getInstantTestBootstrapScriptContent() {
    const segmentPath = '/_full';
    const cacheBustingHeader = await (0, _cachebustingsearchparam.computeCacheBustingSearchParam)('1', segmentPath, undefined, undefined);
    const searchStr = `${_approuterheaders.NEXT_RSC_UNION_QUERY}=${cacheBustingHeader}`;
    return `if(document.cookie.indexOf('${_approuterheaders.NEXT_INSTANT_TEST_COOKIE}=')>-1){self.__next_instant_test=fetch(location.pathname+'?${searchStr}',{credentials:'same-origin',headers:{'${_approuterheaders.RSC_HEADER}':'1','${_approuterheaders.NEXT_ROUTER_PREFETCH_HEADER}':'1','${_approuterheaders.NEXT_ROUTER_SEGMENT_PREFETCH_HEADER}':'${segmentPath}'}})}`;
}

//# sourceMappingURL=instant-test-bootstrap.js.map