/**
 * Web stream operations for the rendering pipeline.
 * Loaded by stream-ops.ts when __NEXT_USE_NODE_STREAMS is false, such as edge
 * bundles where Node.js streams are unavailable.
 *
 * AnyStream = AnyStreamType so the exported type surface matches stream-ops.node.ts,
 * allowing the switcher to assign either module without `as unknown as`.
 */
import type { PostponedState, PrerenderOptions } from 'react-dom/static';
import { resume } from 'react-dom/server';
import type { renderToReadableStream as flightRenderToReadableStream } from 'react-server-dom-webpack/server';
import type { AnyStream as AnyStreamType } from './app-render-prerender-utils';
type FlightRenderToReadableStream = typeof flightRenderToReadableStream;
export type AnyStream = AnyStreamType;
export type ContinueStreamSharedOptions = {
    deploymentId: string | undefined;
    getServerInsertedHTML: () => Promise<string>;
    getServerInsertedMetadata: () => Promise<string>;
};
export type ContinueFizzStreamOptions = ContinueStreamSharedOptions & {
    inlinedDataStream: AnyStream | undefined;
    isStaticGeneration: boolean;
    allReady?: Promise<void>;
    validateRootLayout?: boolean;
    suffix?: string;
};
export type ContinueStaticPrerenderOptions = ContinueStreamSharedOptions & {
    inlinedDataStream: AnyStream;
};
export type ContinueDynamicHTMLResumeOptions = ContinueStreamSharedOptions & {
    inlinedDataStream: AnyStream;
    delayDataUntilFirstHtmlChunk: boolean;
};
export type FlightComponentMod = {
    renderToReadableStream: FlightRenderToReadableStream;
};
export type ServerPrerenderComponentMod = {
    prerender: (...args: any[]) => Promise<any>;
};
export type FlightPayload = Parameters<FlightRenderToReadableStream>[0];
export type FlightClientModules = Parameters<FlightRenderToReadableStream>[1];
/**
 * The options our Flight render wrappers accept, taken from React's Flight
 * `renderToReadableStream`. `signal` aborts the render: the Web wrapper passes
 * it straight to `renderToReadableStream`, while the Node wrapper aborts the
 * pipeable returned by `renderToPipeableStream` (which has no `signal` option)
 * when it fires.
 */
export type FlightRenderOptions = NonNullable<Parameters<FlightRenderToReadableStream>[2]>;
export type FizzStreamResult = {
    stream: AnyStream;
    allReady: Promise<void>;
    abort?: (reason?: unknown) => void;
};
export declare function continueFizzStream(renderStream: AnyStream, opts: ContinueFizzStreamOptions): Promise<AnyStream>;
export declare function continueStaticPrerender(prerenderStream: AnyStream, opts: ContinueStaticPrerenderOptions): Promise<AnyStream>;
export declare function continueDynamicPrerender(prerenderStream: AnyStream, opts: {
    getServerInsertedHTML: () => Promise<string>;
    getServerInsertedMetadata: () => Promise<string>;
    deploymentId: string | undefined;
}): Promise<AnyStream>;
export declare function continueStaticFallbackPrerender(prerenderStream: AnyStream, opts: ContinueStaticPrerenderOptions): Promise<AnyStream>;
export declare function continueDynamicHTMLResumeWeb(renderStream: AnyStream, opts: ContinueDynamicHTMLResumeOptions): Promise<AnyStream>;
export declare function continueDynamicHTMLResumeNode(_renderStream: AnyStream, _opts: ContinueDynamicHTMLResumeOptions): Promise<AnyStream>;
export declare function streamToBuffer(stream: AnyStream): Promise<Buffer>;
export declare function chainStreams(...streams: AnyStream[]): AnyStream;
export declare function createDocumentClosingStream(): AnyStream;
export declare function processPrelude(unprocessedPrelude: AnyStream): Promise<{
    prelude: AnyStream;
    preludeIsEmpty: boolean;
}>;
export declare function createWebInlinedDataStream(source: AnyStream, nonce: string | undefined, formState: unknown | null): AnyStream;
export declare function createNodeInlinedDataStream(_source: AnyStream, _nonce: string | undefined, _formState: unknown | null): AnyStream;
export declare function createPendingStream(): AnyStream;
export declare function createOnHeadersCallback(appendHeader: (key: string, value: string) => void): NonNullable<PrerenderOptions['onHeaders']>;
export declare function resumeAndAbort(element: React.ReactElement, postponed: PostponedState | null, opts: Parameters<typeof resume>[2] & {
    nonce?: string;
}): Promise<AnyStream>;
export declare function renderToNodeFlightStream(_ComponentMod: FlightComponentMod, _payload: FlightPayload, _clientModules: FlightClientModules, _opts: FlightRenderOptions): AnyStream;
export declare function renderToWebFlightStream(ComponentMod: FlightComponentMod, payload: FlightPayload, clientModules: FlightClientModules, opts: FlightRenderOptions): AnyStream;
export declare function streamToString(stream: AnyStream): Promise<string>;
export declare function renderToWebFizzStream(element: React.ReactElement, streamOptions: any, _options?: {
    waitForAllReady?: boolean;
}): Promise<FizzStreamResult>;
export declare function renderToNodeFizzStream(_element: React.ReactElement, _streamOptions: any, _options?: {
    waitForAllReady?: boolean;
}): Promise<FizzStreamResult>;
export declare function resumeToFizzStream(element: React.ReactElement, postponedState: PostponedState, streamOptions: any): Promise<FizzStreamResult>;
export declare function getServerPrerender(ComponentMod: ServerPrerenderComponentMod): (...args: any[]) => any;
export declare const getClientPrerender: typeof import('react-dom/static').prerender;
export declare function pipeRuntimePrefetchTransform(stream: AnyStream, sentinel: number, isPartial: boolean, staleTime: number): AnyStream;
export declare function teeStream(stream: AnyStream): [AnyStream, AnyStream];
export {};
