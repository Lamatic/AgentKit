/**
 * Compile-time switcher for stream operations.
 *
 * When __NEXT_USE_NODE_STREAMS is true, uses Node.js pipeable stream APIs.
 * Otherwise, uses web ReadableStream APIs.
 *
 * Both modules export AnyStream = AnyStreamType so their type surfaces are
 * structurally identical — no `as unknown as` cast is needed.
 */
export type { AnyStream, ContinueFizzStreamOptions, ContinueStaticPrerenderOptions, ContinueStreamSharedOptions, ContinueDynamicHTMLResumeOptions, FlightComponentMod, ServerPrerenderComponentMod, FlightPayload, FlightClientModules, FlightRenderOptions, FizzStreamResult, } from './stream-ops.web';
export declare const continueFizzStream: typeof import("./stream-ops.web").continueFizzStream;
export declare const continueStaticPrerender: typeof import("./stream-ops.web").continueStaticPrerender;
export declare const continueDynamicPrerender: typeof import("./stream-ops.web").continueDynamicPrerender;
export declare const continueStaticFallbackPrerender: typeof import("./stream-ops.web").continueStaticFallbackPrerender;
export declare const continueDynamicHTMLResumeNode: typeof import("./stream-ops.web").continueDynamicHTMLResumeNode;
export declare const continueDynamicHTMLResumeWeb: typeof import("./stream-ops.web").continueDynamicHTMLResumeWeb;
export declare const streamToBuffer: typeof import("./stream-ops.web").streamToBuffer;
export declare const chainStreams: typeof import("./stream-ops.web").chainStreams;
export declare const createDocumentClosingStream: typeof import("./stream-ops.web").createDocumentClosingStream;
export declare const processPrelude: typeof import("./stream-ops.web").processPrelude;
export declare const createWebInlinedDataStream: typeof import("./stream-ops.web").createWebInlinedDataStream;
export declare const createNodeInlinedDataStream: typeof import("./stream-ops.web").createNodeInlinedDataStream;
export declare const createPendingStream: typeof import("./stream-ops.web").createPendingStream;
export declare const createOnHeadersCallback: typeof import("./stream-ops.web").createOnHeadersCallback;
export declare const resumeAndAbort: typeof import("./stream-ops.web").resumeAndAbort;
export declare const renderToWebFlightStream: typeof import("./stream-ops.web").renderToWebFlightStream;
export declare const renderToNodeFlightStream: typeof import("./stream-ops.web").renderToNodeFlightStream;
export declare const streamToString: typeof import("./stream-ops.web").streamToString;
export declare const renderToWebFizzStream: typeof import("./stream-ops.web").renderToWebFizzStream;
export declare const renderToNodeFizzStream: typeof import("./stream-ops.web").renderToNodeFizzStream;
export declare const resumeToFizzStream: typeof import("./stream-ops.web").resumeToFizzStream;
export declare const getServerPrerender: typeof import("./stream-ops.web").getServerPrerender;
export declare const getClientPrerender: typeof import("react-dom/static").prerender;
export declare const pipeRuntimePrefetchTransform: typeof import("./stream-ops.web").pipeRuntimePrefetchTransform;
export declare const teeStream: typeof import("./stream-ops.web").teeStream;
