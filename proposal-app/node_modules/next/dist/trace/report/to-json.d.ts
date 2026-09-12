import type { TraceEvent } from '../types';
import type { Reporter } from './types';
export declare function batcher(reportEvents: (evts: TraceEvent[]) => Promise<void>): {
    flushAll: () => Promise<void>;
    report: (event: TraceEvent) => void;
};
export declare function createJsonReporter(options: {
    filename: string;
    sizeLimit: number | ((phase: string) => number);
    filter?: (event: TraceEvent) => boolean;
}): Reporter;
declare const _default: Reporter;
export default _default;
