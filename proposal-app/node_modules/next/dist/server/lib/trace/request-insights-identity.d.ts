import type { RequestInsightKind } from '../../../next-devtools/shared/request-insights';
export type RequestInsightsIdentity = {
    requestId: string;
    kind?: RequestInsightKind;
    htmlRequestId: string;
    url: string | undefined;
};
export declare function runWithRequestInsightsIdentity<T>(identity: RequestInsightsIdentity, fn: () => T): T;
export declare function getRequestInsightsIdentity(): RequestInsightsIdentity | undefined;
