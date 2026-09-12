let spanRecorderForTest;
export function recordSpan(record) {
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
export function setSpanRecorderForTest(recorder) {
    spanRecorderForTest = recorder;
}
export function isLocalSpanRecordingEnabled() {
    if (!process.env.__NEXT_DEV_SERVER) {
        return false;
    }
    return spanRecorderForTest !== undefined || isRequestInsightsEnabled();
}
export function isRequestInsightsEnabled() {
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