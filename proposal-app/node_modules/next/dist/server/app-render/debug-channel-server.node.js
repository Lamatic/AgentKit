/**
 * Node debug channel implementation.
 * Loaded by debug-channel-server.ts when __NEXT_USE_NODE_STREAMS is enabled.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createNodeDebugChannel: null,
    createWebDebugChannel: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createNodeDebugChannel: function() {
        return createNodeDebugChannel;
    },
    createWebDebugChannel: function() {
        return _debugchannelserverweb.createWebDebugChannel;
    }
});
const _nodestream = require("node:stream");
const _debugchannelserverweb = require("./debug-channel-server.web");
function createNodeDebugChannel() {
    // The readable side is a PassThrough that the client reads from. The
    // server-side write target is a separate, write-only Writable that forwards
    // into it rather than the PassThrough itself: React's renderToPipeableStream
    // detects `.read()` on the debug channel and would enter bidirectional mode,
    // reading its own output back as commands.
    //
    // The forwarding must use `passthrough.write()` / `passthrough.end()`, not
    // `passthrough.push()` / `passthrough.push(null)`. A PassThrough is a Duplex;
    // pushing `null` ends only its readable half and leaves the writable half
    // open (`writableEnded` stays false). If the readable is consumed via
    // `Readable.toWeb()`, that web stream never closes while the PassThrough's
    // writable half is still open — so the debug channel would never close on the
    // client. Ending it via `passthrough.end()` closes both halves and the close
    // propagates.
    const passthrough = new _nodestream.PassThrough();
    const writable = new _nodestream.Writable({
        write (chunk, encoding, callback) {
            passthrough.write(chunk, encoding, callback);
        },
        final (callback) {
            passthrough.end(callback);
        }
    });
    return {
        serverSide: writable,
        clientSide: {
            readable: passthrough
        }
    };
}

//# sourceMappingURL=debug-channel-server.node.js.map