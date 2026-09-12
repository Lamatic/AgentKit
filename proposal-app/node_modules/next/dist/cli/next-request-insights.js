"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "nextRequestInsights", {
    enumerable: true,
    get: function() {
        return nextRequestInsights;
    }
});
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _lockfile = require("../build/lockfile");
const _getprojectdir = require("../lib/get-project-dir");
const _requestinsights = require("../next-devtools/shared/request-insights");
const _config = /*#__PURE__*/ _interop_require_default(require("../server/config"));
const _utils = require("../server/lib/utils");
const _constants = require("../shared/lib/constants");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const DEFAULT_REQUEST_LIMIT = 20;
const DEFAULT_FETCH_LIMIT = 5;
const DEV_SERVER_DISCOVERY_TIMEOUT_MS = 1000;
const DEV_SERVER_DISCOVERY_RETRY_MS = 50;
async function nextRequestInsights(options, directory) {
    const devServerUrl = options.url ? parseDevServerUrl(options.url) : await discoverDevServerUrl(directory);
    const endpoint = new URL(_constants.REQUEST_INSIGHTS_DEV_ENDPOINT, devServerUrl);
    const response = await fetch(endpoint).catch((error)=>{
        (0, _utils.printAndExit)(`Failed to reach ${endpoint.toString()}: ${error instanceof Error ? error.message : String(error)}`, 1);
        throw error;
    });
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch  {
        (0, _utils.printAndExit)(`Invalid response from ${endpoint.toString()}: ${text}`, 1);
    }
    if (!response.ok) {
        (0, _utils.printAndExit)(getResponseError(data, response.status), 1);
    }
    if (!isRequestInsightsSnapshot(data)) {
        exitWithError(`Invalid response from ${endpoint.toString()}: expected requests and fetches to be arrays.`);
    }
    if (options.json) {
        console.log(JSON.stringify(data, null, 2));
        return;
    }
    const requests = data.requests;
    if (requests.length === 0) {
        console.log('No request insights captured yet.');
        return;
    }
    const limit = options.limit ?? DEFAULT_REQUEST_LIMIT;
    const visibleRequests = requests.slice(-limit).reverse();
    console.log(`Showing ${visibleRequests.length} of ${requests.length} retained requests (newest first).`);
    for (const request of visibleRequests){
        const route = request.route ?? request.url ?? request.requestId;
        const kind = (0, _requestinsights.getRequestInsightKind)(request);
        const duration = formatDuration(request.durationMs);
        console.log(`${kind === 'instant-insights' ? `Instant Insights · ${route}` : route} ${duration} ${request.status ?? 'pending'}`);
        console.log(`  kind ${kind} request ${shortId(request.requestId)} page ${shortId(request.htmlRequestId)}`);
        const visibleFetches = request.fetches.slice(0, DEFAULT_FETCH_LIMIT);
        if (visibleFetches.length < request.fetches.length) {
            console.log(`  showing first ${visibleFetches.length} of ${request.fetches.length} fetches`);
        }
        for (const fetch1 of visibleFetches){
            console.log(`  fetch ${formatDuration(fetch1.durationMs)} ${fetch1.statusCode ?? '-'} ${fetch1.cacheStatus ?? 'unknown'} ${fetch1.method ?? 'GET'} ${fetch1.url ?? ''}`);
        }
    }
}
async function discoverDevServerUrl(directory) {
    const projectDir = (0, _getprojectdir.getProjectDir)(directory);
    const config = await (0, _config.default)(_constants.PHASE_DEVELOPMENT_SERVER, projectDir);
    const lockfilePath = _path.default.join(projectDir, config.distDir, 'lock');
    const deadline = Date.now() + DEV_SERVER_DISCOVERY_TIMEOUT_MS;
    while(Date.now() < deadline){
        const lockfileContent = (0, _lockfile.readLockfileContent)(lockfilePath);
        const serverInfo = lockfileContent ? (0, _lockfile.parseDevServerInfo)(lockfileContent) : undefined;
        if (serverInfo && typeof serverInfo.appUrl === 'string') {
            return parseDevServerUrl(serverInfo.appUrl);
        }
        await new Promise((resolve)=>setTimeout(resolve, DEV_SERVER_DISCOVERY_RETRY_MS));
    }
    return exitWithError(`Unable to discover a running Next.js dev server from ${lockfilePath}. Start next dev or pass --url.`);
}
function exitWithError(message) {
    return (0, _utils.printAndExit)(message, 1);
}
function getResponseError(data, status) {
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
        return data.error;
    }
    return `Request failed with ${status}`;
}
function isRequestInsightsSnapshot(data) {
    return typeof data === 'object' && data !== null && 'requests' in data && Array.isArray(data.requests) && data.requests.every(isRequestInsight);
}
function isRequestInsight(request) {
    return typeof request === 'object' && request !== null && 'fetches' in request && Array.isArray(request.fetches);
}
function parseDevServerUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch  {
        return exitWithError(`Invalid dev server URL "${value}". Pass a valid HTTP or HTTPS URL.`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return exitWithError(`Invalid dev server URL "${value}". Pass a valid HTTP or HTTPS URL.`);
    }
    return url;
}
function formatDuration(durationMs) {
    if (typeof durationMs !== 'number') {
        return '-';
    }
    return durationMs < 1000 ? `${Math.round(durationMs)}ms` : `${(durationMs / 1000).toFixed(2)}s`;
}
function shortId(id) {
    if (!id) {
        return '-';
    }
    return id.length > 8 ? id.slice(0, 8) : id;
}

//# sourceMappingURL=next-request-insights.js.map