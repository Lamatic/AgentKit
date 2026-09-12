import type { AttributeValue } from 'next/dist/compiled/@opentelemetry/api';
import type { RequestInsightKind } from '../../../next-devtools/shared/request-insights';
export type SpanStoreAttributes = Record<string, AttributeValue>;
export type SpanStoreLink = {
    traceId: string;
    spanId: string;
    attributes?: SpanStoreAttributes;
};
export type SpanStoreEvent = {
    name: string;
    timestamp: number;
    attributes?: SpanStoreAttributes;
};
export type SpanStoreRecord = {
    name: string;
    timestamp: number;
    startTime?: number;
    durationMs?: number;
    status?: 'ok' | 'error';
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    requestId?: string;
    requestInsightKind?: RequestInsightKind;
    htmlRequestId?: string;
    route?: string;
    url?: string;
    attributes?: SpanStoreAttributes;
    links?: SpanStoreLink[];
    events?: SpanStoreEvent[];
    error?: {
        type?: string;
        message?: string;
    };
};
type SpanRecorderForTest = (span: SpanStoreRecord) => void;
export declare function recordSpan(record: Omit<SpanStoreRecord, 'timestamp'>): void;
export declare function setSpanRecorderForTest(recorder: SpanRecorderForTest | undefined): void;
export declare function isLocalSpanRecordingEnabled(): boolean;
export declare function isRequestInsightsEnabled(): boolean;
export {};
