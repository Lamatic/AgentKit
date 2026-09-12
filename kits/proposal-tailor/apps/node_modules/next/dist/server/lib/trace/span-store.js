"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    isLocalSpanRecordingEnabled: null,
    isRequestInsightsEnabled: null,
    recordSpan: null,
    setSpanRecorderForTest: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    isLocalSpanRecordingEnabled: function() {
        return isLocalSpanRecordingEnabled;
    },
    isRequestInsightsEnabled: function() {
        return isRequestInsightsEnabled;
    },
    recordSpan: function() {
        return recordSpan;
    },
    setSpanRecorderForTest: function() {
        return setSpanRecorderForTest;
    }
});
let spanRecorderForTest;
function recordSpan(record) {
    if (!isLocalSpanRecordingEnabled()) {
        return;
    }
    const spanRecord = {
        timestamp: getCurrentTimestamp(),
        ...record
    };
    spanRecorderForTest == null ? void 0 : spanRecorderForTest(spanRecord);
    if (isRequestInsightsEnabled() && spanRecord.requestId) {
        const { recordRequestInsightSpan } = require('./request-insights');
        recordRequestInsightSpan(spanRecord);
    }
}
function setSpanRecorderForTest(recorder) {
    spanRecorderForTest = recorder;
}
function isLocalSpanRecordingEnabled() {
    if (!process.env.__NEXT_DEV_SERVER) {
        return false;
    }
    return spanRecorderForTest !== undefined || isRequestInsightsEnabled();
}
function isRequestInsightsEnabled() {
    if (!process.env.__NEXT_DEV_SERVER) {
        return false;
    }
    const value = process.env.__NEXT_REQUEST_INSIGHTS;
    return isEnabledEnvValue(value);
}
function isEnabledEnvValue(value) {
    return value === '1' || value === 'true' || value === true;
}
function getCurrentTimestamp() {
    return performance.timeOrigin + performance.now();
}

//# sourceMappingURL=span-store.js.map