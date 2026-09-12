import { type RequestInsight } from '../../../shared/request-insights';
export declare function getActiveRequestKey(requests: readonly RequestInsight[], selectedRequestKey: string | null): string | null;
export declare function isInternalRequestInsight(request: Pick<RequestInsight, 'kind'>): boolean;
export type RequestListEntry = {
    request: RequestInsight;
    nested: boolean;
};
export declare function getRequestListEntries(requests: readonly RequestInsight[], showInternal: boolean): RequestListEntry[];
export declare function isPageLoadRequest(request: Pick<RequestInsight, 'requestId' | 'kind'>, initialRequestId: string | undefined): boolean;
