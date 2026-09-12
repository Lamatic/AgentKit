import { createBufferedTransformStream } from '../stream-utils/node-web-streams-helper';
import { createNodeBufferedTransformStream } from '../stream-utils/node-buffered-transform-stream';
import { HMR_MESSAGE_SENT_TO_BROWSER } from './hot-reloader-types';
// Chunks are sent to the browser in batches to reduce overhead, flushing
// synchronously once this many bytes have accumulated.
const MAX_DEBUG_CHANNEL_BATCH_BYTES = 128 * 1024;
const reactDebugChannelsByHtmlRequestId = new Map();
/**
 * Reads the React debug channel and forwards its chunks to the browser through
 * the websocket. Branches on the stream type so that Node streams stay
 * node-native — batched with a Node `Transform` and consumed via events.
 */ export function connectReactDebugChannel(requestId, debugChannel, sendToClient) {
    let finished = false;
    const stop = ()=>{
        if (finished) {
            return;
        }
        finished = true;
        sendToClient({
            type: HMR_MESSAGE_SENT_TO_BROWSER.REACT_DEBUG_CHUNK,
            requestId,
            chunk: null
        });
    };
    const onError = (err)=>{
        if (!finished) {
            console.error(Object.defineProperty(new Error('React debug channel stream error', {
                cause: err
            }), "__NEXT_ERROR_CODE", {
                value: "E810",
                enumerable: false,
                configurable: true
            }));
        }
        stop();
    };
    const sendChunk = (chunk)=>{
        sendToClient({
            type: HMR_MESSAGE_SENT_TO_BROWSER.REACT_DEBUG_CHUNK,
            requestId,
            chunk
        });
    };
    const { readable } = debugChannel;
    if (readable instanceof ReadableStream) {
        const reader = readable.pipeThrough(createBufferedTransformStream({
            maxBufferByteLength: MAX_DEBUG_CHANNEL_BATCH_BYTES
        })).getReader();
        const progress = (entry)=>{
            if (entry.done) {
                stop();
            } else {
                sendChunk(entry.value);
                reader.read().then(progress, onError);
            }
        };
        reader.read().then(progress, onError);
    } else {
        const source = readable;
        // `pipe` does not forward source errors to the destination, so handle them
        // on the source directly.
        source.on('error', onError);
        const batched = source.pipe(createNodeBufferedTransformStream(MAX_DEBUG_CHANNEL_BATCH_BYTES));
        batched.on('data', sendChunk);
        batched.on('end', stop);
        batched.on('error', onError);
    }
}
export function connectReactDebugChannelForHtmlRequest(htmlRequestId, sendToClient) {
    const debugChannel = reactDebugChannelsByHtmlRequestId.get(htmlRequestId);
    if (!debugChannel) {
        return;
    }
    reactDebugChannelsByHtmlRequestId.delete(htmlRequestId);
    connectReactDebugChannel(htmlRequestId, debugChannel, sendToClient);
}
export function setReactDebugChannelForHtmlRequest(htmlRequestId, debugChannel) {
    // TODO: Clean up after a timeout, in case the client never connects, e.g.
    // when CURL'ing the page, or loading the page with JavaScript disabled etc.
    reactDebugChannelsByHtmlRequestId.set(htmlRequestId, debugChannel);
}
export function deleteReactDebugChannelForHtmlRequest(htmlRequestId) {
    reactDebugChannelsByHtmlRequestId.delete(htmlRequestId);
}

//# sourceMappingURL=debug-channel.js.map