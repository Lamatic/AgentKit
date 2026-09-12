/**
 * Compile-time switcher for stream operations.
 *
 * When __NEXT_USE_NODE_STREAMS is true, uses Node.js pipeable stream APIs.
 * Otherwise, uses web ReadableStream APIs.
 *
 * Both modules export AnyStream = AnyStreamType so their type surfaces are
 * structurally identical — no `as unknown as` cast is needed.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    chainStreams: null,
    continueDynamicHTMLResumeNode: null,
    continueDynamicHTMLResumeWeb: null,
    continueDynamicPrerender: null,
    continueFizzStream: null,
    continueStaticFallbackPrerender: null,
    continueStaticPrerender: null,
    createDocumentClosingStream: null,
    createNodeInlinedDataStream: null,
    createOnHeadersCallback: null,
    createPendingStream: null,
    createWebInlinedDataStream: null,
    getClientPrerender: null,
    getServerPrerender: null,
    pipeRuntimePrefetchTransform: null,
    processPrelude: null,
    renderToNodeFizzStream: null,
    renderToNodeFlightStream: null,
    renderToWebFizzStream: null,
    renderToWebFlightStream: null,
    resumeAndAbort: null,
    resumeToFizzStream: null,
    streamToBuffer: null,
    streamToString: null,
    teeStream: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    chainStreams: function() {
        return chainStreams;
    },
    continueDynamicHTMLResumeNode: function() {
        return continueDynamicHTMLResumeNode;
    },
    continueDynamicHTMLResumeWeb: function() {
        return continueDynamicHTMLResumeWeb;
    },
    continueDynamicPrerender: function() {
        return continueDynamicPrerender;
    },
    continueFizzStream: function() {
        return continueFizzStream;
    },
    continueStaticFallbackPrerender: function() {
        return continueStaticFallbackPrerender;
    },
    continueStaticPrerender: function() {
        return continueStaticPrerender;
    },
    createDocumentClosingStream: function() {
        return createDocumentClosingStream;
    },
    createNodeInlinedDataStream: function() {
        return createNodeInlinedDataStream;
    },
    createOnHeadersCallback: function() {
        return createOnHeadersCallback;
    },
    createPendingStream: function() {
        return createPendingStream;
    },
    createWebInlinedDataStream: function() {
        return createWebInlinedDataStream;
    },
    getClientPrerender: function() {
        return getClientPrerender;
    },
    getServerPrerender: function() {
        return getServerPrerender;
    },
    pipeRuntimePrefetchTransform: function() {
        return pipeRuntimePrefetchTransform;
    },
    processPrelude: function() {
        return processPrelude;
    },
    renderToNodeFizzStream: function() {
        return renderToNodeFizzStream;
    },
    renderToNodeFlightStream: function() {
        return renderToNodeFlightStream;
    },
    renderToWebFizzStream: function() {
        return renderToWebFizzStream;
    },
    renderToWebFlightStream: function() {
        return renderToWebFlightStream;
    },
    resumeAndAbort: function() {
        return resumeAndAbort;
    },
    resumeToFizzStream: function() {
        return resumeToFizzStream;
    },
    streamToBuffer: function() {
        return streamToBuffer;
    },
    streamToString: function() {
        return streamToString;
    },
    teeStream: function() {
        return teeStream;
    }
});
let _m;
if (process.env.__NEXT_USE_NODE_STREAMS) {
    _m = require('./stream-ops.node');
} else {
    _m = require('./stream-ops.web');
}
const continueFizzStream = _m.continueFizzStream;
const continueStaticPrerender = _m.continueStaticPrerender;
const continueDynamicPrerender = _m.continueDynamicPrerender;
const continueStaticFallbackPrerender = _m.continueStaticFallbackPrerender;
const continueDynamicHTMLResumeNode = _m.continueDynamicHTMLResumeNode;
const continueDynamicHTMLResumeWeb = _m.continueDynamicHTMLResumeWeb;
const streamToBuffer = _m.streamToBuffer;
const chainStreams = _m.chainStreams;
const createDocumentClosingStream = _m.createDocumentClosingStream;
const processPrelude = _m.processPrelude;
const createWebInlinedDataStream = _m.createWebInlinedDataStream;
const createNodeInlinedDataStream = _m.createNodeInlinedDataStream;
const createPendingStream = _m.createPendingStream;
const createOnHeadersCallback = _m.createOnHeadersCallback;
const resumeAndAbort = _m.resumeAndAbort;
const renderToWebFlightStream = _m.renderToWebFlightStream;
const renderToNodeFlightStream = _m.renderToNodeFlightStream;
const streamToString = _m.streamToString;
const renderToWebFizzStream = _m.renderToWebFizzStream;
const renderToNodeFizzStream = _m.renderToNodeFizzStream;
const resumeToFizzStream = _m.resumeToFizzStream;
const getServerPrerender = _m.getServerPrerender;
const getClientPrerender = _m.getClientPrerender;
const pipeRuntimePrefetchTransform = _m.pipeRuntimePrefetchTransform;
const teeStream = _m.teeStream;

//# sourceMappingURL=stream-ops.js.map