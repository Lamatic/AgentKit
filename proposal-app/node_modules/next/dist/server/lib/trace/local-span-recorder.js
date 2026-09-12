"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createLocalSpan: null,
    getActiveLocalSpan: null,
    isLocalRecordingSpan: null,
    isLocalSpanRecordingEnabled: null,
    isOpenTelemetryIsolatedSpan: null,
    registerLocalSpanRecorder: null,
    traceLocalSpan: null,
    withLocalSpan: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createLocalSpan: function() {
        return createLocalSpan;
    },
    getActiveLocalSpan: function() {
        return getActiveLocalSpan;
    },
    isLocalRecordingSpan: function() {
        return isLocalRecordingSpan;
    },
    isLocalSpanRecordingEnabled: function() {
        return _spanstore.isLocalSpanRecordingEnabled;
    },
    isOpenTelemetryIsolatedSpan: function() {
        return isOpenTelemetryIsolatedSpan;
    },
    registerLocalSpanRecorder: function() {
        return registerLocalSpanRecorder;
    },
    traceLocalSpan: function() {
        return traceLocalSpan;
    },
    withLocalSpan: function() {
        return withLocalSpan;
    }
});
const _api = require("next/dist/compiled/@opentelemetry/api");
const _spanstore = require("./span-store");
const TRACE_ID_HEX_LENGTH = 32;
const SPAN_ID_HEX_LENGTH = 16;
let lastLocalTraceId = 0;
let lastLocalSpanId = 0;
let localSpanAsyncStorage;
const getLocalTraceId = ()=>(++lastLocalTraceId).toString(16).padStart(TRACE_ID_HEX_LENGTH, '0');
const getLocalSpanId = ()=>(++lastLocalSpanId).toString(16).padStart(SPAN_ID_HEX_LENGTH, '0');
function createLocalSpan({ name, attributes, links, startTime, traceId, spanId, parentSpanId, delegateSpan, isolateOpenTelemetry }) {
    return new LocalRecordingSpan({
        name,
        attributes,
        links,
        startTime,
        delegateSpan,
        traceId: traceId ?? getLocalTraceId(),
        spanId: spanId ?? getLocalSpanId(),
        parentSpanId,
        requestIdentity: getCurrentRequestIdentity(),
        isolateOpenTelemetry: isolateOpenTelemetry ?? false
    });
}
function getActiveLocalSpan() {
    return localSpanAsyncStorage == null ? void 0 : localSpanAsyncStorage.getStore();
}
function isLocalRecordingSpan(span) {
    return span instanceof LocalRecordingSpan;
}
function isOpenTelemetryIsolatedSpan(span) {
    return span instanceof LocalRecordingSpan && span.isOpenTelemetryIsolated();
}
function withLocalSpan(span, fn) {
    return getLocalSpanAsyncStorage().run(span, fn);
}
async function traceLocalSpan({ parentSpan, ...options }, fn) {
    const resolvedParentSpan = parentSpan === undefined ? getActiveLocalSpan() : parentSpan;
    const parentSpanContext = resolvedParentSpan == null ? void 0 : resolvedParentSpan.spanContext();
    const span = createLocalSpan({
        ...options,
        traceId: parentSpanContext == null ? void 0 : parentSpanContext.traceId,
        parentSpanId: parentSpanContext == null ? void 0 : parentSpanContext.spanId,
        isolateOpenTelemetry: true
    });
    return withLocalSpan(span, async ()=>{
        try {
            return await fn();
        } catch (err) {
            span.recordException(err);
            span.setStatus({
                code: _api.SpanStatusCode.ERROR
            });
            throw err;
        } finally{
            span.end();
        }
    });
}
function registerLocalSpanRecorder() {
    const key = Symbol.for('@next/local-span-recorder');
    globalThis[key] = {
        createLocalSpan,
        getActiveLocalSpan,
        isLocalRecordingSpan,
        isOpenTelemetryIsolatedSpan,
        isLocalSpanRecordingEnabled: _spanstore.isLocalSpanRecordingEnabled,
        isRequestInsightsEnabled: _spanstore.isRequestInsightsEnabled,
        traceLocalSpan,
        withLocalSpan
    };
}
function getLocalSpanAsyncStorage() {
    if (!localSpanAsyncStorage) {
        const { createAsyncLocalStorage } = require('../../app-render/async-local-storage');
        localSpanAsyncStorage = createAsyncLocalStorage();
    }
    return localSpanAsyncStorage;
}
class LocalRecordingSpan {
    constructor({ name, attributes, links, startTime, delegateSpan, traceId, spanId, parentSpanId, requestIdentity, isolateOpenTelemetry }){
        this.name = name;
        this.attributes = cleanSpanStoreAttributes(attributes);
        this.events = [];
        this.delegateSpan = delegateSpan;
        this.openTelemetryIsolated = isolateOpenTelemetry;
        this.spanContextValue = (delegateSpan == null ? void 0 : delegateSpan.spanContext()) ?? {
            traceId,
            spanId,
            traceFlags: 0
        };
        this.links = getSpanStoreLinks(links);
        this.parentSpanId = parentSpanId;
        this.requestIdentity = requestIdentity;
        this.startTime = getTimestamp(startTime);
        this.statusCode = undefined;
        this.statusMessage = undefined;
        this.exception = undefined;
        this.ended = false;
    }
    spanContext() {
        return this.spanContextValue;
    }
    isOpenTelemetryIsolated() {
        return this.openTelemetryIsolated;
    }
    setAttribute(key, value) {
        var _this_delegateSpan;
        if (this.ended) {
            return this;
        }
        this.attributes[key] = value;
        (_this_delegateSpan = this.delegateSpan) == null ? void 0 : _this_delegateSpan.setAttribute(key, value);
        return this;
    }
    setAttributes(attributes) {
        var _this_delegateSpan;
        if (this.ended) {
            return this;
        }
        // OpenTelemetry attributes may be undefined. Ignore them instead of
        // overwriting an existing value as Object.assign would.
        for (const key of Object.keys(attributes)){
            const value = attributes[key];
            if (value !== undefined) {
                this.attributes[key] = value;
            }
        }
        (_this_delegateSpan = this.delegateSpan) == null ? void 0 : _this_delegateSpan.setAttributes(attributes);
        return this;
    }
    addEvent(name, attributesOrStartTime, startTime) {
        var _this_delegateSpan;
        if (this.ended) {
            return this;
        }
        const eventTime = startTime === undefined && isTimestampInput(attributesOrStartTime) ? attributesOrStartTime : startTime;
        this.events.push({
            name,
            timestamp: getTimestamp(eventTime),
            attributes: isSpanStoreAttributes(attributesOrStartTime) ? cleanSpanStoreAttributes(attributesOrStartTime) : undefined
        });
        (_this_delegateSpan = this.delegateSpan) == null ? void 0 : _this_delegateSpan.addEvent(name, attributesOrStartTime, startTime);
        return this;
    }
    setStatus(status) {
        var _this_delegateSpan;
        if (this.ended) {
            return this;
        }
        this.statusCode = status.code;
        this.statusMessage = status.message;
        (_this_delegateSpan = this.delegateSpan) == null ? void 0 : _this_delegateSpan.setStatus(status);
        return this;
    }
    updateName(name) {
        var _this_delegateSpan;
        if (this.ended) {
            return this;
        }
        this.name = name;
        (_this_delegateSpan = this.delegateSpan) == null ? void 0 : _this_delegateSpan.updateName(name);
        return this;
    }
    end(endTime) {
        if (this.ended) {
            return;
        }
        this.ended = true;
        try {
            var _this_delegateSpan;
            (_this_delegateSpan = this.delegateSpan) == null ? void 0 : _this_delegateSpan.end(endTime);
        } finally{
            try {
                this.record(endTime);
            } finally{
                this.releaseReferences();
            }
        }
    }
    isRecording() {
        return !this.ended;
    }
    recordException(exception, time) {
        var _this_delegateSpan;
        if (this.ended) {
            return;
        }
        this.exception = getSpanStoreException(exception);
        this.events.push({
            name: 'exception',
            timestamp: getTimestamp(time),
            attributes: getSpanStoreExceptionAttributes(this.exception)
        });
        (_this_delegateSpan = this.delegateSpan) == null ? void 0 : _this_delegateSpan.recordException(exception, time);
    }
    record(endTime) {
        const recordAttributes = Object.keys(this.attributes).length > 0 ? this.attributes : undefined;
        (0, _spanstore.recordSpan)({
            name: this.name,
            startTime: this.startTime,
            durationMs: Math.max(0, getTimestamp(endTime) - this.startTime),
            status: this.statusCode === _api.SpanStatusCode.ERROR ? 'error' : 'ok',
            traceId: this.spanContextValue.traceId,
            spanId: this.spanContextValue.spanId,
            parentSpanId: this.parentSpanId,
            requestId: this.requestIdentity.requestId,
            requestInsightKind: this.requestIdentity.requestInsightKind,
            htmlRequestId: this.requestIdentity.htmlRequestId,
            route: getStringAttribute(recordAttributes, 'next.route') ?? getStringAttribute(recordAttributes, 'http.route') ?? this.requestIdentity.route,
            url: getStringAttribute(recordAttributes, 'http.url') ?? this.requestIdentity.url,
            attributes: recordAttributes,
            links: this.links,
            events: this.events.length > 0 ? this.events : undefined,
            error: this.getRecordError()
        });
    }
    releaseReferences() {
        // AsyncLocalStorage can keep an ended span reachable when work spawned
        // inside the span outlives it. Keep only the immutable span context and
        // primitive timing/identity fields needed by the Span API after end.
        this.name = '';
        this.attributes = {};
        this.events = [];
        this.delegateSpan = undefined;
        this.links = undefined;
        this.requestIdentity = {};
        this.statusMessage = undefined;
        this.exception = undefined;
    }
    getRecordError() {
        if (this.exception) {
            return this.exception;
        }
        if (this.statusCode === _api.SpanStatusCode.ERROR && this.statusMessage) {
            return {
                message: this.statusMessage
            };
        }
        return undefined;
    }
}
function getSpanStoreLinks(links) {
    const spanStoreLinks = links == null ? void 0 : links.map((link)=>({
            traceId: link.context.traceId,
            spanId: link.context.spanId,
            attributes: cleanSpanStoreAttributes(link.attributes)
        }));
    return (spanStoreLinks == null ? void 0 : spanStoreLinks.length) ? spanStoreLinks : undefined;
}
function cleanSpanStoreAttributes(attributes) {
    const cleanedAttributes = {};
    if (attributes) {
        for (const key of Object.keys(attributes)){
            const value = attributes[key];
            if (value !== undefined) {
                cleanedAttributes[key] = value;
            }
        }
    }
    return cleanedAttributes;
}
function getTimestamp(time) {
    if (time instanceof Date) {
        return time.getTime();
    }
    if (Array.isArray(time)) {
        return time[0] * 1000 + time[1] / 1000000;
    }
    if (typeof time === 'number') {
        return time < performance.timeOrigin / 2 ? performance.timeOrigin + time : time;
    }
    return performance.timeOrigin + performance.now();
}
function getStringAttribute(attributes, key) {
    const value = attributes == null ? void 0 : attributes[key];
    return typeof value === 'string' ? value : undefined;
}
function isSpanStoreAttributes(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}
function isTimestampInput(value) {
    return typeof value === 'number' || Array.isArray(value) || value instanceof Date;
}
function getSpanStoreException(exception) {
    if (exception instanceof Error) {
        return {
            type: exception.name,
            message: exception.message
        };
    }
    if (typeof exception === 'string') {
        return {
            message: exception
        };
    }
    if (exception && typeof exception === 'object') {
        var _exception_constructor;
        return {
            type: (_exception_constructor = exception.constructor) == null ? void 0 : _exception_constructor.name,
            message: 'message' in exception ? String(exception.message) : undefined
        };
    }
    return undefined;
}
function getSpanStoreExceptionAttributes(exception) {
    if (!exception) {
        return undefined;
    }
    const attributes = {};
    if (exception.type !== undefined) {
        attributes['exception.type'] = exception.type;
    }
    if (exception.message !== undefined) {
        attributes['exception.message'] = exception.message;
    }
    return Object.keys(attributes).length > 0 ? attributes : undefined;
}
function getCurrentRequestIdentity() {
    try {
        const { getRequestInsightsIdentity } = require('./request-insights-identity');
        const { workAsyncStorage } = require('../../app-render/work-async-storage.external');
        const { workUnitAsyncStorage } = require('../../app-render/work-unit-async-storage.external');
        const workStore = workAsyncStorage.getStore();
        const workUnitStore = workUnitAsyncStorage.getStore();
        const requestInsightsIdentity = getRequestInsightsIdentity();
        const url = workUnitStore && 'url' in workUnitStore ? workUnitStore.url : undefined;
        return {
            requestId: (requestInsightsIdentity == null ? void 0 : requestInsightsIdentity.requestId) ?? (workStore == null ? void 0 : workStore.requestId),
            requestInsightKind: requestInsightsIdentity == null ? void 0 : requestInsightsIdentity.kind,
            htmlRequestId: (requestInsightsIdentity == null ? void 0 : requestInsightsIdentity.htmlRequestId) ?? (workStore == null ? void 0 : workStore.htmlRequestId),
            route: workStore == null ? void 0 : workStore.route,
            url: url ? `${url.pathname}${url.search}` : requestInsightsIdentity == null ? void 0 : requestInsightsIdentity.url
        };
    } catch  {
        return {};
    }
}

//# sourceMappingURL=local-span-recorder.js.map