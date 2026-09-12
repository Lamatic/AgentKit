/**
 * Node debug channel implementation.
 * Loaded by debug-channel-server.ts when __NEXT_USE_NODE_STREAMS is enabled.
 */
import { type Readable } from 'node:stream';
import type { DebugChannelServer } from './debug-channel-server.web';
export { createWebDebugChannel } from './debug-channel-server.web';
/**
 * Node variant: identical to `DebugChannelPair` except the client-side readable
 * is narrowed to a Node `Readable`, so node call sites can consume it (e.g.
 * `new ReplayableNodeStream(...)`) without casting `AnyStream` down.
 */
export type NodeDebugChannelPair = {
    serverSide: DebugChannelServer;
    clientSide: {
        readable: Readable;
    };
};
/**
 * Creates a debug channel using Node.js streams.
 * Use with renderToNodeFlightStream (React's renderToPipeableStream),
 * which expects debugChannel to be a Node.js stream with a .write() method.
 */
export declare function createNodeDebugChannel(): NodeDebugChannelPair;
