"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "releaseCompressionStream", {
    enumerable: true,
    get: function() {
        return releaseCompressionStream;
    }
});
const _nodestream = require("node:stream");
const noop = ()=>{};
function releaseCompressionStream(res) {
    const maybeStream = res.on('drain', noop);
    // The `Duplex` check keeps a future middleware change from turning this into a
    // `destroy()` on a non-stream, which would throw from a `close` handler.
    if (maybeStream === res || !(maybeStream instanceof _nodestream.Duplex)) {
        res.off('drain', noop);
        return;
    }
    maybeStream.destroy();
}

//# sourceMappingURL=release-compression-stream.js.map