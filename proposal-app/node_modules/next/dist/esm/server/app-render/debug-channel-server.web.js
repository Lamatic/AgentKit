/**
 * Web debug channel implementation.
 * Loaded by debug-channel-server.ts.
 */ /**
 * Creates a debug channel using web WritableStream/ReadableStream.
 * Use with renderToWebFlightStream (React's renderToReadableStream),
 * which expects debugChannel = { writable: WritableStream }.
 */ export function createWebDebugChannel() {
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
/**
 * Creates a debug channel using Node.js streams.
 * Use with renderToNodeFlightStream (React's renderToPipeableStream),
 * which expects debugChannel to be a Node.js stream with a .write() method.
 */ export function createNodeDebugChannel() {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}

//# sourceMappingURL=debug-channel-server.web.js.map