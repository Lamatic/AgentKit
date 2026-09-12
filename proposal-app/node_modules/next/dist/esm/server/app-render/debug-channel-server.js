/**
 * Compile-time switcher for debug channel operations.
 *
 * When __NEXT_USE_NODE_STREAMS is true, uses a Node PassThrough-based channel.
 * Otherwise, uses web WritableStream APIs.
 */ let _m;
if (process.env.__NEXT_USE_NODE_STREAMS) {
    _m = require('./debug-channel-server.node');
} else {
    _m = require('./debug-channel-server.web');
}
export function createWebDebugChannel() {
    if (process.env.NODE_ENV === 'production') {
        return undefined;
    }
    return _m.createWebDebugChannel();
}
export function createNodeDebugChannel() {
    if (process.env.NODE_ENV === 'production') {
        return undefined;
    }
    return _m.createNodeDebugChannel();
}

//# sourceMappingURL=debug-channel-server.js.map