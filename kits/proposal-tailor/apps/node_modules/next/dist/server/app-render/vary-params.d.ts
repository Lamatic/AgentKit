import type { Params } from '../request/params';
import type { SearchParams } from '../request/search-params';
/**
 * Accumulates vary params for a single segment (or for metadata/rootParams).
 *
 * A VaryParamsAccumulator is an `AsyncIterable<string>` that can be serialized
 * by React Flight. As params are accessed during render, each newly-seen param
 * name is `add`ed, which yields it into the Flight stream immediately. After
 * rendering, call `close()` (via `finishAccumulatingVaryParams`) to end the
 * iteration.
 *
 * Because each access is flushed into the stream as it happens, the set of
 * accessed params is built up incrementally, with no step at the end of the
 * render that has to run for the client to read anything. If the prerender is
 * aborted by sync I/O, the params yielded before the abort are already in the
 * stream — and they're exactly the params the partial response depends on.
 * This mirrors how `StaleTimeIterable` works (see stale-time.ts).
 *
 * Each name is emitted at most once: `add` dedupes against the set of
 * already-yielded names, so the stream never contains a duplicate.
 *
 * NOTE: like `StaleTimeIterable`, this supports a single concurrent iteration
 * (Flight iterates it exactly once). The shared empty singleton below is the
 * only instance referenced by more than one segment, and it only ever yields
 * "done", so concurrent iteration of it is safe.
 */
export declare class VaryParamsAccumulator implements AsyncIterable<string> {
    private _resolve;
    private _done;
    private _buffer;
    private _seen;
    /**
     * Records that a param was accessed. Yields the name into the stream the
     * first time it's seen; subsequent accesses of the same name are no-ops.
     */
    add(paramName: string): void;
    /** Ends the iteration. Best-effort: if skipped (e.g. on a sync-I/O abort),
     * the consumer simply reads the params yielded so far. */
    close(): void;
    [Symbol.asyncIterator](): AsyncIterator<string>;
}
/**
 * A mutable data structure for accumulating per-segment vary params for an
 * entire server response. It's only used during prerenders. It describes
 * metadata about the response itself.
 */
export type ResponseVaryParamsAccumulator = {
    /** Vary params accumulator for metadata/viewport (the "head" segment) */
    head: VaryParamsAccumulator;
    /** Vary params accumulator for root params access */
    rootParams: VaryParamsAccumulator;
    /** Vary params accumulators for each route segment */
    segments: Set<VaryParamsAccumulator>;
};
/**
 * A singleton accumulator that's already closed with no params. Use this for
 * segments where we know upfront that no params will be accessed, such as
 * client components or segments without user code.
 *
 * Benefits:
 * - No need to accumulate or close later
 * - Resilient: reads as an empty set even if other tracking fails
 * - Memory efficient: reuses the same object
 *
 * It's never added to `ResponseVaryParamsAccumulator.segments` (callers pass it
 * directly), so `finishAccumulatingVaryParams` doesn't touch it.
 */
export declare const emptyVaryParamsAccumulator: VaryParamsAccumulator;
export declare function createResponseVaryParamsAccumulator(): ResponseVaryParamsAccumulator;
/**
 * Allocates a new VaryParamsAccumulator and adds it to the response accumulator
 * associated with the current WorkUnitStore.
 *
 * Returns an iterable that yields the segment's vary params as they're
 * accessed. The iterable can be passed directly to React Flight for
 * serialization.
 */
export declare function createVaryParamsAccumulator(): VaryParamsAccumulator | null;
export declare function getMetadataVaryParamsAccumulator(): VaryParamsAccumulator | null;
export declare const getViewportVaryParamsAccumulator: typeof getMetadataVaryParamsAccumulator;
/**
 * Returns the response-level root params iterable for serialization. Root
 * params are emitted once at the top level (not folded into every segment);
 * the client unions them into each segment's set.
 */
export declare function getRootParamsVaryParamsAccumulator(): VaryParamsAccumulator | null;
/**
 * Records that a param was accessed. Adds the param name to the accumulator.
 */
export declare function accumulateVaryParam(accumulator: VaryParamsAccumulator, paramName: string): void;
/**
 * Records a root param access.
 */
export declare function accumulateRootVaryParam(paramName: string): void;
export declare function createVaryingParams(accumulator: VaryParamsAccumulator, originalParamsObject: Params, optionalCatchAllParamName: string | null): Params;
export declare function createVaryingSearchParams(accumulator: VaryParamsAccumulator, originalSearchParamsObject: SearchParams): SearchParams;
/**
 * Closes all accumulators in a ResponseVaryParamsAccumulator, ending their
 * iterables. Call this after rendering is complete.
 *
 * This does NOT merge root params into each segment — root params are
 * serialized separately (at the top level of the response) and unioned in by
 * the client. And it's best-effort: if it's skipped because the render was
 * aborted by sync I/O, the consumer just reads the params each iterable yielded
 * before the abort.
 *
 * If we can't track vary params (e.g., legacy prerender), simply don't call
 * this function - the client treats a missing iterable as "unknown" vary
 * params.
 */
export declare function finishAccumulatingVaryParams(responseAccumulator: ResponseVaryParamsAccumulator): void;
