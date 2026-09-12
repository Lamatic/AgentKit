import type { Project } from '../../../build/swc/types';
import { type Span } from '../../../trace';
export declare function msToNs(ms: number): bigint;
/**
 * Subscribes to compilation events for `project` and prints them using the
 * `Log` library.
 *
 * When `parentSpan` is provided, `TraceEvent` compilation events are recorded
 * as trace spans in the `.next/trace` file.
 *
 * Returns a promise that resolves when the subscription ends.  Abort the
 * `signal` to close the underlying async iterator and settle the promise
 * promptly.  The iterator also closes automatically when the Rust side
 * drops the subscription (e.g. after project shutdown).
 */
export declare function backgroundLogCompilationEvents(project: Project, { eventTypes, signal, parentSpan, }?: {
    eventTypes?: string[];
    signal?: AbortSignal;
    parentSpan?: Span;
}): Promise<void>;
