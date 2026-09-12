/**
 * Web debug channel implementation.
 * Loaded by debug-channel-server.ts.
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
        return createWebDebugChannel;
    }
});
function createWebDebugChannel() {
    let readableController;
    const clientSideReadable = new ReadableStream({
        start (controller) {
            readableController = controller;
        }
    });
    return {
        serverSide: {
            writable: new WritableStream({
                write (chunk) {
                    readableController == null ? void 0 : readableController.enqueue(chunk);
                },
                close () {
                    readableController == null ? void 0 : readableController.close();
                },
                abort (err) {
                    readableController == null ? void 0 : readableController.error(err);
                }
            })
        },
        clientSide: {
            readable: clientSideReadable
        }
    };
}
function createNodeDebugChannel() {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}

//# sourceMappingURL=debug-channel-server.web.js.map