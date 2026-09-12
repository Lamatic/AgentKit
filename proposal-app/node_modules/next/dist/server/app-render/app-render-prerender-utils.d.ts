import type { Readable } from 'node:stream';
export type AnyStream = ReadableStream<Uint8Array> | Readable;
export declare class ReactServerResult {
    private _stream;
    private _replayable;
    constructor(stream: AnyStream);
    tee(): AnyStream;
    consume(): AnyStream;
}
/**
 * Buffers all chunks from a Node.js Readable stream and allows creating new
 * Readable streams that replay the buffered chunks plus any subsequent chunks
 * from the source. Multiple replay streams can be created independently.
 */
export declare class ReplayableNodeStream {
    private _chunks;
    private _done;
    private _error;
    private _subscribers;
    constructor(stream: Readable);
    /**
     * Creates a new Node.js Readable stream that first emits all buffered chunks,
     * then forwards any new chunks from the source as they arrive.
     *
     * Buffered chunks are delivered via _read() (pull-based) rather than pushed
     * eagerly. This is critical because createReplayStream() is called outside
     * of AsyncLocalStorage context, and eagerly pushing chunks triggers internal
     * Node.js stream scheduling (process.nextTick for maybeReadMore) that
     * captures the empty ALS context. By deferring to _read(), chunks are only
     * delivered when the consumer reads, which happens inside the correct ALS
     * scope (e.g. during Fizz's performWork).
     */
    createReplayStream(): Readable;
    /**
     * Clears the buffered chunks and all subscriber references. After calling
     * this, no new replay streams can be created.
     */
    dispose(): void;
}
export type ReactServerPrerenderResolveToType = {
    prelude: ReadableStream<Uint8Array>;
};
export declare function createReactServerPrerenderResult(underlying: Promise<ReactServerPrerenderResolveToType>): Promise<ReactServerPrerenderResult>;
export declare function createReactServerPrerenderResultFromRender(underlying: AnyStream): Promise<ReactServerPrerenderResult>;
export declare class ReactServerPrerenderResult {
    private _chunks;
    private assertChunks;
    private consumeChunks;
    consume(): void;
    constructor(chunks: Array<Uint8Array>);
    asChunks(): Array<Uint8Array>;
    asUnclosingStream(): ReadableStream<Uint8Array>;
    consumeAsUnclosingStream(): ReadableStream<Uint8Array>;
    asStream(): ReadableStream<Uint8Array>;
    consumeAsStream(): ReadableStream<Uint8Array>;
}
export declare function processPrelude(unprocessedPrelude: ReadableStream<Uint8Array>): Promise<{
    prelude: ReadableStream<Uint8Array<ArrayBufferLike>>;
    preludeIsEmpty: boolean;
}>;
