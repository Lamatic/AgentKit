/**
 * Web debug channel implementation.
 * Loaded by debug-channel-server.ts.
 */
import type { AnyStream } from './app-render-prerender-utils';
export type DebugChannelPair = {
    serverSide: DebugChannelServer;
    clientSide: DebugChannelClient;
};
export type DebugChannelServer = any;
type DebugChannelClient = {
    readable: AnyStream;
};
/**
 * Creates a debug channel using web WritableStream/ReadableStream.
 * Use with renderToWebFlightStream (React's renderToReadableStream),
 * which expects debugChannel = { writable: WritableStream }.
 */
export declare function createWebDebugChannel(): DebugChannelPair;
/**
 * Creates a debug channel using Node.js streams.
 * Use with renderToNodeFlightStream (React's renderToPipeableStream),
 * which expects debugChannel to be a Node.js stream with a .write() method.
 */
export declare function createNodeDebugChannel(): never;
export {};
