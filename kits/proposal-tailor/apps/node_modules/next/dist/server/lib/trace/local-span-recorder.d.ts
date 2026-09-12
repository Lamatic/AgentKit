import type { AttributeValue, Span, SpanOptions } from 'next/dist/compiled/@opentelemetry/api';
import { isLocalSpanRecordingEnabled, isRequestInsightsEnabled } from './span-store';
export { isLocalSpanRecordingEnabled } from './span-store';
type LocalSpanAttributes = Partial<Record<string, AttributeValue | undefined>>;
type LocalSpanOptions = {
    name: string;
    attributes?: LocalSpanAttributes;
    links?: SpanOptions['links'];
    startTime?: SpanOptions['startTime'];
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    delegateSpan?: Span;
    isolateOpenTelemetry?: boolean;
};
type TraceLocalSpanOptions = Omit<LocalSpanOptions, 'traceId' | 'spanId' | 'parentSpanId' | 'delegateSpan' | 'isolateOpenTelemetry'> & {
    parentSpan?: Span | null;
};
export declare function createLocalSpan({ name, attributes, links, startTime, traceId, spanId, parentSpanId, delegateSpan, isolateOpenTelemetry, }: LocalSpanOptions): Span;
export declare function getActiveLocalSpan(): Span | undefined;
export declare function isLocalRecordingSpan(span: Span): boolean;
export declare function isOpenTelemetryIsolatedSpan(span: Span): boolean;
export declare function withLocalSpan<T>(span: Span, fn: () => T): T;
/**
 * Records an async operation without replacing or exporting through the active
 * OpenTelemetry context. Nested Next.js spans remain in the local trace.
 */
export declare function traceLocalSpan<T>({ parentSpan, ...options }: TraceLocalSpanOptions, fn: () => Promise<T>): Promise<T>;
export type LocalSpanRecorder = {
    createLocalSpan: typeof createLocalSpan;
    getActiveLocalSpan: typeof getActiveLocalSpan;
    isLocalRecordingSpan: typeof isLocalRecordingSpan;
    isOpenTelemetryIsolatedSpan: typeof isOpenTelemetryIsolatedSpan;
    isLocalSpanRecordingEnabled: typeof isLocalSpanRecordingEnabled;
    isRequestInsightsEnabled: typeof isRequestInsightsEnabled;
    traceLocalSpan: typeof traceLocalSpan;
    withLocalSpan: typeof withLocalSpan;
};
export declare function registerLocalSpanRecorder(): void;
