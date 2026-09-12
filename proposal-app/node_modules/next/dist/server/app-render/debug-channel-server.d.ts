/**
 * Compile-time switcher for debug channel operations.
 *
 * When __NEXT_USE_NODE_STREAMS is true, uses a Node PassThrough-based channel.
 * Otherwise, uses web WritableStream APIs.
 */
export type { DebugChannelPair, DebugChannelServer, } from './debug-channel-server.web';
export type { NodeDebugChannelPair } from './debug-channel-server.node';
import type { DebugChannelPair } from './debug-channel-server.web';
import type { NodeDebugChannelPair } from './debug-channel-server.node';
export declare function createWebDebugChannel(): DebugChannelPair | undefined;
export declare function createNodeDebugChannel(): NodeDebugChannelPair | undefined;
