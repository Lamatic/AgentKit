/**
 * Compile-time switcher for debug channel operations.
 *
 * When __NEXT_USE_NODE_STREAMS is true, uses a Node PassThrough-based channel.
 * Otherwise, uses web WritableStream APIs.
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
let _m;
if (process.env.__NEXT_USE_NODE_STREAMS) {
    _m = require('./debug-channel-server.node');
} else {
    _m = require('./debug-channel-server.web');
}
function createWebDebugChannel() {
    if (process.env.NODE_ENV === 'production') {
        return undefined;
    }
    return _m.createWebDebugChannel();
}
function createNodeDebugChannel() {
    if (process.env.NODE_ENV === 'production') {
        return undefined;
    }
    return _m.createNodeDebugChannel();
}

//# sourceMappingURL=debug-channel-server.js.map