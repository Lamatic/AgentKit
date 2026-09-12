/**
 * Web stream operations for the rendering pipeline.
 * Loaded by stream-ops.ts when __NEXT_USE_NODE_STREAMS is false, such as edge
 * bundles where Node.js streams are unavailable.
 *
 * AnyStream = AnyStreamType so the exported type surface matches stream-ops.node.ts,
 * allowing the switcher to assign either module without `as unknown as`.
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
const _server = require("react-dom/server");
const _static = require("react-dom/static");
const _nodewebstreamshelper = require("../stream-utils/node-web-streams-helper");
const _useflightresponse = require("./use-flight-response");
const _apprenderprerenderutils = require("./app-render-prerender-utils");
function continueFizzStream(renderStream, opts) {
    return (0, _nodewebstreamshelper.continueFizzStream)(renderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
async function continueStaticPrerender(prerenderStream, opts) {
    return (0, _nodewebstreamshelper.continueStaticPrerender)(prerenderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
async function continueDynamicPrerender(prerenderStream, opts) {
    return (0, _nodewebstreamshelper.continueDynamicPrerender)(prerenderStream, opts);
}
async function continueStaticFallbackPrerender(prerenderStream, opts) {
    return (0, _nodewebstreamshelper.continueStaticFallbackPrerender)(prerenderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
async function continueDynamicHTMLResumeWeb(renderStream, opts) {
    return (0, _nodewebstreamshelper.continueDynamicHTMLResume)(renderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
function continueDynamicHTMLResumeNode(_renderStream, _opts) {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}
async function streamToBuffer(stream) {
    return (0, _nodewebstreamshelper.streamToBuffer)(stream);
}
function chainStreams(...streams) {
    return (0, _nodewebstreamshelper.chainStreams)(...streams);
}
function createDocumentClosingStream() {
    return (0, _nodewebstreamshelper.createDocumentClosingStream)();
}
async function processPrelude(unprocessedPrelude) {
    return (0, _apprenderprerenderutils.processPrelude)(unprocessedPrelude);
}
function createWebInlinedDataStream(source, nonce, formState) {
    return (0, _useflightresponse.createInlinedDataReadableStream)(source, nonce, formState);
}
function createNodeInlinedDataStream(_source, _nonce, _formState) {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}
function createPendingStream() {
    return new ReadableStream();
}
function createOnHeadersCallback(appendHeader) {
    return (headers)=>{
        headers.forEach((value, key)=>{
            appendHeader(key, value);
        });
    };
}
async function resumeAndAbort(element, postponed, opts) {
    return (0, _server.resume)(element, postponed, opts);
}
function renderToNodeFlightStream(_ComponentMod, _payload, _clientModules, _opts) {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}
function renderToWebFlightStream(ComponentMod, payload, clientModules, opts) {
    return ComponentMod.renderToReadableStream(payload, clientModules, opts);
}
async function streamToString(stream) {
    return (0, _nodewebstreamshelper.streamToString)(stream);
}
async function renderToWebFizzStream(element, streamOptions, _options) {
    const stream = await (0, _nodewebstreamshelper.renderToInitialFizzStream)({
        ReactDOMServer: {
            renderToReadableStream: _server.renderToReadableStream
        },
        element,
        streamOptions
    });
    return {
        stream,
        allReady: stream.allReady,
        abort: undefined
    };
}
async function renderToNodeFizzStream(_element, _streamOptions, _options) {
    throw Object.defineProperty(new Error('Not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1155",
        enumerable: false,
        configurable: true
    });
}
async function resumeToFizzStream(element, postponedState, streamOptions) {
    const stream = await (0, _server.resume)(element, postponedState, streamOptions);
    return {
        stream,
        allReady: stream.allReady,
        abort: undefined
    };
}
function getServerPrerender(ComponentMod) {
    return ComponentMod.prerender;
}
const getClientPrerender = _static.prerender;
function pipeRuntimePrefetchTransform(stream, sentinel, isPartial, staleTime) {
    return stream.pipeThrough((0, _nodewebstreamshelper.createRuntimePrefetchTransformStream)(sentinel, isPartial, staleTime));
}
function teeStream(stream) {
    return stream.tee();
}

//# sourceMappingURL=stream-ops.web.js.map