"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    clearRequestInsightsForTest: null,
    getRequestInsightsSnapshot: null,
    isRequestInsightsEnabled: null,
    recordRequestInsightFetch: null,
    recordRequestInsightSpan: null,
    subscribeRequestInsights: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    clearRequestInsightsForTest: function() {
        return clearRequestInsightsForTest;
    },
    getRequestInsightsSnapshot: function() {
        return getRequestInsightsSnapshot;
    },
    isRequestInsightsEnabled: function() {
        return _spanstore.isRequestInsightsEnabled;
    },
    recordRequestInsightFetch: function() {
        return recordRequestInsightFetch;
    },
    recordRequestInsightSpan: function() {
        return recordRequestInsightSpan;
    },
    subscribeRequestInsights: function() {
        return subscribeRequestInsights;
    }
});
const _requestinsights = require("../../../shared/lib/request-insights");
const _spanstore = require("./span-store");
const MAX_REQUEST_INSIGHTS = 100;
const REQUEST_INSIGHTS_STORE_KEY = Symbol.for('@next/request-insights-store');
const CLIENT_COMPONENT_LOADING_SPAN_TYPE = 'NextNodeServer.clientComponentLoading';
const REDACTED_VALUE = 'redacted';
const SAFE_SPAN_ATTRIBUTE_KEYS = new Set([
    'http.method',
    'http.route',
    'http.status_code',
    'http.url',
    'net.peer.name',
    'net.peer.port',
    'next.fetch.cache_reason',
    'next.fetch.cache_status',
    'next.fetch.idx',
    'next.route',
    'next.rsc',
    'next.segment',
    'next.span_category',
    'next.span_name',
    'next.span_type'
]);
const SENSITIVE_PARAM_NAME_RE = /(?:^|[_-])(?:access[_-]?token|api[_-]?key|auth|authorization|code|cookie|credential|id[_-]?token|jwt|key|password|secret|session|signature|sig|token)(?:$|[_-])/i;
class InMemoryRequestInsightsStore {
    recordSpan(span) {
        var _span_attributes;
        if (!span.requestId) {
            return;
        }
        const insight = this.getOrCreateRequest({
            requestId: span.requestId,
            kind: span.requestInsightKind,
            htmlRequestId: span.htmlRequestId,
            route: span.route,
            url: span.url
        }, span.startTime ?? span.timestamp);
        const spanStartTime = span.startTime ?? span.timestamp;
        insight.htmlRequestId = span.htmlRequestId ?? insight.htmlRequestId;
        insight.route = insight.route ?? span.route;
        insight.url = insight.url ?? sanitizeUrl(span.url);
        this.updateTiming(insight, spanStartTime, span.durationMs, ((_span_attributes = span.attributes) == null ? void 0 : _span_attributes['next.span_type']) === 'BaseServer.handleRequest');
        insight.status = insight.status === 'error' || span.status === 'error' ? 'error' : span.status === 'ok' ? 'ok' : insight.status;
        insight.spans.push({
            name: span.name,
            startTime: spanStartTime,
            durationMs: span.durationMs,
            status: span.status,
            traceId: span.traceId,
            spanId: span.spanId,
            parentSpanId: span.parentSpanId,
            attributes: sanitizeSpanAttributes(span.attributes),
            links: sanitizeSpanLinks(span.links),
            events: sanitizeSpanEvents(span.events),
            error: span.error
        });
        const fetch = getFetchInsight(span);
        if (fetch) {
            this.recordFetchForInsight(insight, fetch);
        }
        this.notify(insight);
    }
    recordFetch(identity, fetch) {
        if (!identity.requestId) {
            return;
        }
        const fetchStartTime = fetch.startTime ?? getCurrentTimestamp();
        const insight = this.getOrCreateRequest(identity, fetchStartTime);
        this.updateTiming(insight, fetchStartTime, fetch.durationMs, false);
        this.recordFetchForInsight(insight, sanitizeFetchInsight(fetch));
        this.notify(insight);
    }
    getSnapshot() {
        return {
            requests: this.requestOrder.map((insightKey)=>this.requests.get(insightKey)).filter((request)=>request !== undefined)
        };
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return ()=>{
            this.listeners.delete(listener);
        };
    }
    clear() {
        this.requests.clear();
        this.requestTimings.clear();
        this.requestOrder.length = 0;
    }
    updateTiming(insight, startTime, durationMs, isRequestSpan) {
        const insightKey = (0, _requestinsights.getRequestInsightKey)(insight);
        if (isRequestSpan && durationMs !== undefined) {
            const requestTiming = {
                startTime,
                durationMs
            };
            this.requestTimings.set(insightKey, requestTiming);
            insight.startTime = requestTiming.startTime;
            insight.durationMs = requestTiming.durationMs;
            return;
        }
        const requestTiming = this.requestTimings.get(insightKey);
        if (requestTiming) {
            insight.startTime = requestTiming.startTime;
            insight.durationMs = requestTiming.durationMs;
            return;
        }
        const endTime = startTime + (durationMs ?? 0);
        const requestEndTime = insight.startTime + (insight.durationMs ?? 0);
        insight.startTime = Math.min(insight.startTime, startTime);
        insight.durationMs = Math.max(requestEndTime, endTime) - insight.startTime;
    }
    notify(insight) {
        for (const listener of this.listeners){
            listener(insight);
        }
    }
    getOrCreateRequest(identity, startTime) {
        const requestId = identity.requestId;
        const insightKey = (0, _requestinsights.getRequestInsightKey)({
            requestId,
            kind: identity.kind
        });
        let insight = this.requests.get(insightKey);
        if (!insight) {
            insight = {
                requestId,
                kind: (0, _requestinsights.getRequestInsightKind)(identity),
                htmlRequestId: identity.htmlRequestId ?? requestId,
                route: identity.route,
                url: sanitizeUrl(identity.url),
                startTime,
                status: 'pending',
                spans: [],
                fetches: []
            };
            this.requests.set(insightKey, insight);
            this.requestOrder.push(insightKey);
            this.trim();
        }
        insight.htmlRequestId = identity.htmlRequestId ?? insight.htmlRequestId;
        insight.route = insight.route ?? identity.route;
        insight.url = insight.url ?? sanitizeUrl(identity.url);
        insight.startTime = Math.min(insight.startTime, startTime);
        return insight;
    }
    recordFetchForInsight(insight, fetch) {
        if (insight.fetches.some((existingFetch)=>existingFetch.url === fetch.url && (existingFetch.index !== undefined && fetch.index !== undefined ? existingFetch.index === fetch.index : existingFetch.startTime === fetch.startTime))) {
            return;
        }
        insight.fetches.push(sanitizeFetchInsight(fetch));
    }
    trim() {
        while(this.requestOrder.length > MAX_REQUEST_INSIGHTS){
            const insightKey = this.requestOrder.shift();
            if (insightKey) {
                this.requests.delete(insightKey);
                this.requestTimings.delete(insightKey);
            }
        }
    }
    constructor(){
        this.requests = new Map();
        this.requestTimings = new Map();
        this.requestOrder = [];
        this.listeners = new Set();
    }
}
function recordRequestInsightSpan(span) {
    var _span_attributes;
    if (((_span_attributes = span.attributes) == null ? void 0 : _span_attributes['next.span_type']) === CLIENT_COMPONENT_LOADING_SPAN_TYPE) {
        return;
    }
    getRequestInsightsStore().recordSpan(span);
}
function recordRequestInsightFetch(identity, fetch) {
    getRequestInsightsStore().recordFetch(identity, fetch);
}
function getRequestInsightsSnapshot() {
    return getRequestInsightsStore().getSnapshot();
}
function subscribeRequestInsights(listener) {
    return getRequestInsightsStore().subscribe(listener);
}
function clearRequestInsightsForTest() {
    getRequestInsightsStore().clear();
}
function getRequestInsightsStore() {
    const globalStore = globalThis;
    return globalStore[REQUEST_INSIGHTS_STORE_KEY] ??= new InMemoryRequestInsightsStore();
}
function getFetchInsight(span) {
    const attributes = span.attributes;
    if (!attributes || attributes['next.span_type'] !== 'AppRender.fetch') {
        return null;
    }
    return {
        url: sanitizeUrl(getStringAttribute(attributes['http.url']) ?? span.url),
        method: getStringAttribute(attributes['http.method']),
        statusCode: getNumberAttribute(attributes['http.status_code']),
        startTime: span.startTime ?? span.timestamp,
        durationMs: span.durationMs,
        cacheStatus: getStringAttribute(attributes['next.fetch.cache_status']),
        cacheReason: getStringAttribute(attributes['next.fetch.cache_reason']),
        index: getNumberAttribute(attributes['next.fetch.idx'])
    };
}
function sanitizeFetchInsight(fetch) {
    return {
        ...fetch,
        url: sanitizeUrl(fetch.url)
    };
}
function getCurrentTimestamp() {
    return performance.timeOrigin + performance.now();
}
function sanitizeSpanAttributes(attributes) {
    if (!attributes) {
        return undefined;
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(attributes)){
        if (!SAFE_SPAN_ATTRIBUTE_KEYS.has(key)) {
            continue;
        }
        sanitized[key] = key === 'http.url' ? sanitizeUrlAttribute(value) : value;
    }
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}
function sanitizeSpanEvents(events) {
    return events == null ? void 0 : events.map((event)=>({
            ...event,
            attributes: sanitizeSpanAttributes(event.attributes)
        }));
}
function sanitizeSpanLinks(links) {
    return links == null ? void 0 : links.map((link)=>({
            ...link,
            attributes: sanitizeSpanAttributes(link.attributes)
        }));
}
function sanitizeUrlAttribute(value) {
    return typeof value === 'string' ? sanitizeUrl(value) ?? '' : value;
}
function sanitizeUrl(value) {
    if (!value) {
        return value;
    }
    const isRelativeUrl = value.startsWith('/');
    try {
        const url = isRelativeUrl ? new URL(value, 'http://n') : new URL(value);
        url.username = '';
        url.password = '';
        for (const name of Array.from(url.searchParams.keys())){
            if (SENSITIVE_PARAM_NAME_RE.test(name)) {
                url.searchParams.set(name, REDACTED_VALUE);
            }
        }
        return isRelativeUrl ? `${url.pathname}${url.search}${url.hash}` : url.href;
    } catch  {
        return value;
    }
}
function getStringAttribute(value) {
    return typeof value === 'string' ? value : undefined;
}
function getNumberAttribute(value) {
    return typeof value === 'number' ? value : undefined;
}

//# sourceMappingURL=request-insights.js.map