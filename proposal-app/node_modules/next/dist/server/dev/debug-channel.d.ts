import { type HmrMessageSentToBrowser } from './hot-reloader-types';
import type { AnyStream } from '../app-render/stream-ops';
export interface ReactDebugChannelForBrowser {
    readonly readable: AnyStream;
}
/**
 * Reads the React debug channel and forwards its chunks to the browser through
 * the websocket. Branches on the stream type so that Node streams stay
 * node-native — batched with a Node `Transform` and consumed via events.
 */
export declare function connectReactDebugChannel(requestId: string, debugChannel: ReactDebugChannelForBrowser, sendToClient: (message: HmrMessageSentToBrowser) => void): void;
export declare function connectReactDebugChannelForHtmlRequest(htmlRequestId: string, sendToClient: (message: HmrMessageSentToBrowser) => void): void;
export declare function setReactDebugChannelForHtmlRequest(htmlRequestId: string, debugChannel: ReactDebugChannelForBrowser): void;
export declare function deleteReactDebugChannelForHtmlRequest(htmlRequestId: string): void;
