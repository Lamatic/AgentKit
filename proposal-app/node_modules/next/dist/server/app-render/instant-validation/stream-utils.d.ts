import type { Readable } from 'node:stream';
/**
 * When we abort a staged render, we can still provide react with more chunks from later phases
 * to use for their debug info. This will not cause more contents to be rendered.
 */
export declare function createNodeStreamWithLateRelease(partialChunks: Array<Uint8Array>, allChunks: Array<Uint8Array>, releaseSignal: AbortSignal): Readable;
export declare function createNodeStreamFromChunks(chunks: Array<Uint8Array>, signal?: AbortSignal): Readable;
