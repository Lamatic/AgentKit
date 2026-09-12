/**
 * Web stream operations for the rendering pipeline.
 * Loaded by stream-ops.ts when __NEXT_USE_NODE_STREAMS is false, such as edge
 * bundles where Node.js streams are unavailable.
 *
 * AnyStream = AnyStreamType so the exported type surface matches stream-ops.node.ts,
 * allowing the switcher to assign either module without `as unknown as`.
 */ import { resume, renderToReadableStream } from 'react-dom/server';
import { prerender } from 'react-dom/static';
import { renderToInitialFizzStream, streamToString as webStreamToString, createRuntimePrefetchTransformStream, continueFizzStream as webContinueFizzStream, continueStaticPrerender as webContinueStaticPrerender, continueDynamicPrerender as webContinueDynamicPrerender, continueStaticFallbackPrerender as webContinueStaticFallbackPrerender, continueDynamicHTMLResume as webContinueDynamicHTMLResume, streamToBuffer as webStreamToBuffer, chainStreams as webChainStreams, createDocumentClosingStream as webCreateDocumentClosingStream } from '../stream-utils/node-web-streams-helper';
import { createInlinedDataReadableStream } from './use-flight-response';
import { processPrelude as webProcessPrelude } from './app-render-prerender-utils';
// ---------------------------------------------------------------------------
// Continue function wrappers
// Thin wrappers that accept AnyStream and narrow to
// ReadableStream<Uint8Array> internally for the web helper functions.
// ---------------------------------------------------------------------------
export function continueFizzStream(renderStream, opts) {
    return webContinueFizzStream(renderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
export async function continueStaticPrerender(prerenderStream, opts) {
    return webContinueStaticPrerender(prerenderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
export async function continueDynamicPrerender(prerenderStream, opts) {
    return webContinueDynamicPrerender(prerenderStream, opts);
}
export async function continueStaticFallbackPrerender(prerenderStream, opts) {
    return webContinueStaticFallbackPrerender(prerenderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
export async function continueDynamicHTMLResumeWeb(renderStream, opts) {
    return webContinueDynamicHTMLResume(renderStream, {
        ...opts,
        inlinedDataStream: opts.inlinedDataStream
    });
}
export function continueDynamicHTMLResumeNode(_renderStream, _opts) {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}
export async function streamToBuffer(stream) {
    return webStreamToBuffer(stream);
}
export function chainStreams(...streams) {
    return webChainStreams(...streams);
}
export function createDocumentClosingStream() {
    return webCreateDocumentClosingStream();
}
export async function processPrelude(unprocessedPrelude) {
    return webProcessPrelude(unprocessedPrelude);
}
// ---------------------------------------------------------------------------
// Composed helpers
// ---------------------------------------------------------------------------
export function createWebInlinedDataStream(source, nonce, formState) {
    return createInlinedDataReadableStream(source, nonce, formState);
}
export function createNodeInlinedDataStream(_source, _nonce, _formState) {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}
export function createPendingStream() {
    return new ReadableStream();
}
export function createOnHeadersCallback(appendHeader) {
    return (headers)=>{
        headers.forEach((value, key)=>{
            appendHeader(key, value);
        });
    };
}
export async function resumeAndAbort(element, postponed, opts) {
    return resume(element, postponed, opts);
}
export function renderToNodeFlightStream(_ComponentMod, _payload, _clientModules, _opts) {
    throw Object.defineProperty(new Error('not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1154",
        enumerable: false,
        configurable: true
    });
}
export function renderToWebFlightStream(ComponentMod, payload, clientModules, opts) {
    return ComponentMod.renderToReadableStream(payload, clientModules, opts);
}
export async function streamToString(stream) {
    return webStreamToString(stream);
}
export async function renderToWebFizzStream(element, streamOptions, _options) {
    const stream = await renderToInitialFizzStream({
        ReactDOMServer: {
            renderToReadableStream
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
export async function renderToNodeFizzStream(_element, _streamOptions, _options) {
    throw Object.defineProperty(new Error('Not implemented'), "__NEXT_ERROR_CODE", {
        value: "E1155",
        enumerable: false,
        configurable: true
    });
}
export async function resumeToFizzStream(element, postponedState, streamOptions) {
    const stream = await resume(element, postponedState, streamOptions);
    return {
        stream,
        allReady: stream.allReady,
        abort: undefined
    };
}
export function getServerPrerender(ComponentMod) {
    return ComponentMod.prerender;
}
export const getClientPrerender = prerender;
export function pipeRuntimePrefetchTransform(stream, sentinel, isPartial, staleTime) {
    return stream.pipeThrough(createRuntimePrefetchTransformStream(sentinel, isPartial, staleTime));
}
export function teeStream(stream) {
    return stream.tee();
}

//# sourceMappingURL=stream-ops.web.js.map