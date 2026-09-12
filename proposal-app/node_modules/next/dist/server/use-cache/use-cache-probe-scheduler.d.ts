import type { WorkStore } from '../app-render/work-async-storage.external';
import type { RequestStore } from '../app-render/work-unit-async-storage.external';
interface CacheContextWithProbeFields {
    readonly functionId: string;
    readonly handlerKind: string;
}
interface SetupOptions {
    workStore: WorkStore;
    outerRequestStore: RequestStore;
    cacheContext: CacheContextWithProbeFields;
    encodedArguments: string | FormData;
    /**
     * Absolute monotonic deadline (in `performance.now()` units) at which the
     * outer cache fill will be aborted by the dev render-timeout timer. The
     * scheduler derives the up-front budget check, every reschedule budget check,
     * and each probe's internal timeout from this single value.
     */
    fillDeadlineAt: number;
    /**
     * Cache stream to track. Each chunk that flows through resets the idle timer;
     * the returned stream is the same data, transparently observed.
     */
    stream: ReadableStream<Uint8Array>;
    /**
     * Aborts when the probe should stop watching: the cache fill bailed (timeout,
     * upstream cancel, deadlock detection), or it settled normally.
     */
    abortSignal: AbortSignal;
    /**
     * Called once if the probe ran the cache function to completion in isolation
     * while the main fill was still pending. Strong signal that shared state from
     * the outer scope is preventing the body from progressing — the caller
     * decides what to do with that (typically abort the fill and surface a
     * deadlock error).
     */
    onProbeCompleted: () => void;
}
/**
 * Schedule an idle-deadline probe over a cache fill stream (dev-only).
 *
 * Fires the probe when the stream has been idle for `PROBE_THRESHOLD_MS`. The
 * probe re-runs the cache function in a fresh V8 isolate so module-scoped state
 * from the outer render — e.g. a top-level `Map<string, Promise>` deduping
 * fetches — can't poison the body. If the function completes in isolation, the
 * hang is attributable to that shared state and the caller surfaces a specific
 * error instead of waiting out the generic timeout.
 *
 * Returns the input stream unchanged when the scheduler should be skipped: no
 * probe hook installed, or the remaining time until `fillDeadlineAt` is too
 * short to leave room for both the idle threshold and a minimum probe budget.
 */
export declare function setupProbeScheduler(opts: SetupOptions): ReadableStream<Uint8Array>;
export {};
