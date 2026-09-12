export function getRequestInsightKind(insight) {
    return insight.kind ?? 'request';
}
export function getRequestInsightKey(insight) {
    return `${getRequestInsightKind(insight)}:${insight.requestId}`;
}

//# sourceMappingURL=request-insights.js.map