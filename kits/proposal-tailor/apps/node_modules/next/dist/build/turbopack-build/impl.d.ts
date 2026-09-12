import { NextBuildContext } from '../build-context';
import { Telemetry } from '../../telemetry/storage';
import { getTraceEvents } from '../../trace';
import type { TraceState } from '../../trace';
export declare function turbopackBuild(telemetry: Telemetry): Promise<{
    duration: number;
    buildTraceContext: undefined;
    shutdownPromise: Promise<void>;
    warnings: string[];
}>;
export declare function workerMain(workerData: {
    buildContext: typeof NextBuildContext;
    traceState: TraceState & {
        shouldSaveTraceEvents: boolean;
    };
}): Promise<Omit<Awaited<ReturnType<typeof turbopackBuild>>, 'shutdownPromise'>>;
export declare function waitForShutdown(): Promise<{
    debugTraceEvents?: ReturnType<typeof getTraceEvents>;
}>;
