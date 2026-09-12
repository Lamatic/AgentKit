export type RequestInsightKind = 'request' | 'instant-insights';
export type RequestInsightIdentity = {
    requestId: string;
    kind?: RequestInsightKind;
};
export declare function getRequestInsightKind(insight: Pick<RequestInsightIdentity, 'kind'>): RequestInsightKind;
export declare function getRequestInsightKey(insight: RequestInsightIdentity): string;
