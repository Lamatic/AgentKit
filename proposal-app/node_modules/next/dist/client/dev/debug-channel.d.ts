export interface DebugChannelReadableWriterPair {
    /**
     * The remaining, not-yet-handed-out copy of the request's debug stream. A
     * request can be decoded more than once (the primary decode plus any stage
     * extractions that re-parse a slice of the same response, see
     * `decodeStageUntilBoundary`), and each decode needs its own reader. Every
     * time a consumer asks for the readable we tee it and reassign this field to
     * the remainder, so each consumer gets an independent branch. The remainder
     * is only ever tee'd again, never read directly, so it retains every chunk
     * from the start and replays the full stream into each new branch.
     */
    readable: ReadableStream<Uint8Array>;
    readonly writer: WritableStreamDefaultWriter<Uint8Array>;
}
export declare function getOrCreateDebugChannelReadableWriterPair(requestId: string): DebugChannelReadableWriterPair;
export declare function createDebugChannel(requestHeaders: Record<string, string> | undefined): {
    writable?: WritableStream;
    readable?: ReadableStream;
};
