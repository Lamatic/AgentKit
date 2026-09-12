"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    connectReactDebugChannel: null,
    connectReactDebugChannelForHtmlRequest: null,
    deleteReactDebugChannelForHtmlRequest: null,
    setReactDebugChannelForHtmlRequest: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    connectReactDebugChannel: function() {
        return connectReactDebugChannel;
    },
    connectReactDebugChannelForHtmlRequest: function() {
        return connectReactDebugChannelForHtmlRequest;
    },
    deleteReactDebugChannelForHtmlRequest: function() {
        return deleteReactDebugChannelForHtmlRequest;
    },
    setReactDebugChannelForHtmlRequest: function() {
        return setReactDebugChannelForHtmlRequest;
    }
});
const _nodewebstreamshelper = require("../stream-utils/node-web-streams-helper");
const _nodebufferedtransformstream = require("../stream-utils/node-buffered-transform-stream");
const _hotreloadertypes = require("./hot-reloader-types");
// Chunks are sent to the browser in batches to reduce overhead, flushing
// synchronously once this many bytes have accumulated.
const MAX_DEBUG_CHANNEL_BATCH_BYTES = 128 * 1024;
const reactDebugChannelsByHtmlRequestId = new Map();
function connectReactDebugChannel(requestId, debugChannel, sendToClient) {
    let finished = false;
    const stop = ()=>{
        if (finished) {
            return;
        }
        finished = true;
        sendToClient({
            type: _hotreloadertypes.HMR_MESSAGE_SENT_TO_BROWSER.REACT_DEBUG_CHUNK,
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
            type: _hotreloadertypes.HMR_MESSAGE_SENT_TO_BROWSER.REACT_DEBUG_CHUNK,
            requestId,
            chunk
        });
    };
    const { readable } = debugChannel;
    if (readable instanceof ReadableStream) {
        const reader = readable.pipeThrough((0, _nodewebstreamshelper.createBufferedTransformStream)({
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
        const batched = source.pipe((0, _nodebufferedtransformstream.createNodeBufferedTransformStream)(MAX_DEBUG_CHANNEL_BATCH_BYTES));
        batched.on('data', sendChunk);
        batched.on('end', stop);
        batched.on('error', onError);
    }
}
function connectReactDebugChannelForHtmlRequest(htmlRequestId, sendToClient) {
    const debugChannel = reactDebugChannelsByHtmlRequestId.get(htmlRequestId);
    if (!debugChannel) {
        return;
    }
    reactDebugChannelsByHtmlRequestId.delete(htmlRequestId);
    connectReactDebugChannel(htmlRequestId, debugChannel, sendToClient);
}
function setReactDebugChannelForHtmlRequest(htmlRequestId, debugChannel) {
    // TODO: Clean up after a timeout, in case the client never connects, e.g.
    // when CURL'ing the page, or loading the page with JavaScript disabled etc.
    reactDebugChannelsByHtmlRequestId.set(htmlRequestId, debugChannel);
}
function deleteReactDebugChannelForHtmlRequest(htmlRequestId) {
    reactDebugChannelsByHtmlRequestId.delete(htmlRequestId);
}

//# sourceMappingURL=debug-channel.js.map