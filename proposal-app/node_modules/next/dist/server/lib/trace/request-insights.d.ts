import type { RequestInsight, RequestInsightFetch, RequestInsightsSnapshot } from '../../../next-devtools/shared/request-insights';
import type { RequestInsightKind } from '../../../shared/lib/request-insights';
import type { SpanStoreRecord } from './span-store';
export { isRequestInsightsEnabled } from './span-store';
type RequestInsightsListener = (insight: RequestInsight) => void;
type RequestInsightIdentity = {
    requestId?: string;
    kind?: RequestInsightKind;
    htmlRequestId?: string;
    route?: string;
    url?: string;
};
export declare function recordRequestInsightSpan(span: SpanStoreRecord): void;
export declare function recordRequestInsightFetch(identity: RequestInsightIdentity, fetch: RequestInsightFetch): void;
export declare function getRequestInsightsSnapshot(): RequestInsightsSnapshot;
export declare function subscribeRequestInsights(listener: RequestInsightsListener): () => void;
export declare function clearRequestInsightsForTest(): void;
