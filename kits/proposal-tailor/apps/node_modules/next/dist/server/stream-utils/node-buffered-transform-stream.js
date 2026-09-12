"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createNodeBufferedTransformStream", {
    enumerable: true,
    get: function() {
        return createNodeBufferedTransformStream;
    }
});
const _nodestream = require("node:stream");
function createNodeBufferedTransformStream(maxBufferByteLength = Infinity) {
    let bufferedChunks = [];
    let bufferByteLength = 0;
    let flushScheduled = false;
    function flushBuffered(stream) {
        if (bufferedChunks.length === 0) return;
        const merged = new Uint8Array(bufferByteLength);
        let copiedBytes = 0;
        for(let i = 0; i < bufferedChunks.length; i++){
            const bufferedChunk = bufferedChunks[i];
            merged.set(bufferedChunk, copiedBytes);
            copiedBytes += bufferedChunk.byteLength;
        }
        bufferedChunks.length = 0;
        bufferByteLength = 0;
        stream.push(merged);
    }
    return new _nodestream.Transform({
        transform (chunk, _encoding, callback) {
            bufferedChunks.push(chunk);
            bufferByteLength += chunk.byteLength;
            if (bufferByteLength >= maxBufferByteLength) {
                flushBuffered(this);
            } else if (!flushScheduled) {
                flushScheduled = true;
                queueMicrotask(()=>{
                    flushScheduled = false;
                    flushBuffered(this);
                });
            }
            callback();
        },
        flush (callback) {
            flushBuffered(this);
            callback();
        }
    });
}

//# sourceMappingURL=node-buffered-transform-stream.js.map