import type { RequestInsight } from '../../../shared/request-insights';
export type TraceItem = {
    id: string;
    spanId?: string;
    parentSpanId?: string;
    spanType?: string;
    category: 'nextjs' | 'application';
    label: string;
    startTime: number;
    durationMs?: number;
    status: 'ok' | 'error' | 'pending';
    kind: 'span' | 'fetch';
    depth: number;
};
export type TraceRange = {
    startTime: number;
    durationMs: number;
};
export declare function getTraceItems(request: RequestInsight, verbose: boolean): TraceItem[];
export declare function getTraceRange(request: RequestInsight): TraceRange;
export declare function getTracePosition(item: TraceItem, range: TraceRange): {
    left: number;
    width: number;
    offsetMs: number;
};
