import type { ExperimentalConfig } from '../config-shared';
/**
 * An AsyncIterable<number> that yields staleTime values. Each call to
 * `update()` yields the new value. When `close()` is called, the iteration
 * ends.
 *
 * This is included in the RSC payload so Flight serializes each yielded value
 * into the stream immediately. If the prerender is aborted by sync IO, the last
 * yielded value is already in the stream, allowing the prerender to be aborted
 * synchronously.
 */
export declare class StaleTimeIterable {
    private _resolve;
    private _done;
    private _buffer;
    /** The last value passed to `update()`. */
    currentValue: number;
    update(value: number): void;
    close(): void;
    [Symbol.asyncIterator](): AsyncIterator<number>;
}
export declare function createSelectStaleTime(experimental: ExperimentalConfig): (stale: number) => number;
/**
 * Intercepts writes to the `stale` field on the prerender store and yields
 * each update (after applying selectStaleTime) through the iterable. This
 * ensures the latest stale time is always serialized in the Flight stream,
 * even if the prerender is aborted by sync IO.
 */
export declare function trackStaleTime(store: {
    stale: number;
}, iterable: StaleTimeIterable, selectStaleTime: (stale: number) => number): void;
