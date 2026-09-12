/**
 * Node.js stream operations for the rendering pipeline.
 * Loaded by stream-ops.ts when process.env.__NEXT_USE_NODE_STREAMS is true.
 *
 * AnyStream = AnyStreamType so the exported type surface matches stream-ops.web.ts,
 * allowing the switcher to assign either module without casts.
 * Rendering uses pipeable APIs; continue functions wrap the existing web
 * transforms via Readable.fromWeb() on their output.
 */
import type { PostponedState, PrerenderOptions } from 'react-dom/static';
import { Readable } from 'node:stream';
import { type AnyStream as AnyStreamType } from './app-render-prerender-utils';
import type { FlightPayload, FlightClientModules, FlightRenderOptions } from './stream-ops.web';
export type { ContinueStreamSharedOptions, ContinueFizzStreamOptions, ContinueStaticPrerenderOptions, ContinueDynamicHTMLResumeOptions, ServerPrerenderComponentMod, FlightPayload, FlightClientModules, FlightRenderOptions, } from './stream-ops.web';
export type AnyStream = AnyStreamType;
export type FlightComponentMod = {
    renderToReadableStream: (model: any, webpackMap: any, options?: any) => ReadableStream<Uint8Array>;
    renderToPipeableStream?: (model: any, webpackMap: any, options?: any) => {
        pipe<Writable extends NodeJS.WritableStream>(destination: Writable): Writable;
        abort(reason?: unknown): void;
    };
};
export type FizzStreamResult = {
    stream: AnyStream;
    allReady: Promise<void>;
    abort?: (reason?: unknown) => void;
};
export { renderToWebFlightStream } from './stream-ops.web';
export declare function renderToNodeFlightStream(ComponentMod: FlightComponentMod, payload: FlightPayload, clientModules: FlightClientModules, opts: FlightRenderOptions): AnyStream;
export { renderToWebFizzStream } from './stream-ops.web';
export declare function renderToNodeFizzStream(element: React.ReactElement, streamOptions: any, options?: {
    waitForAllReady?: boolean;
}): Promise<FizzStreamResult>;
export declare function resumeToFizzStream(element: React.ReactElement, postponedState: PostponedState, streamOptions: any, runInContext?: <T>(fn: () => T) => T): Promise<FizzStreamResult>;
export declare function resumeAndAbort(element: React.ReactElement, postponed: PostponedState | null, opts: any): Promise<AnyStream>;
export declare function continueFizzStream(renderStream: AnyStream, { suffix, inlinedDataStream, isStaticGeneration, allReady, deploymentId, getServerInsertedHTML, getServerInsertedMetadata, validateRootLayout, }: import('./stream-ops.web').ContinueFizzStreamOptions): Promise<Readable>;
export declare function continueStaticPrerender(prerenderStream: AnyStream, opts: import('./stream-ops.web').ContinueStaticPrerenderOptions): Promise<AnyStream>;
export declare function continueDynamicPrerender(prerenderStream: AnyStream, opts: {
    getServerInsertedHTML: () => Promise<string>;
    getServerInsertedMetadata: () => Promise<string>;
    deploymentId: string | undefined;
}): Promise<AnyStream>;
export declare function continueStaticFallbackPrerender(prerenderStream: AnyStream, opts: import('./stream-ops.web').ContinueStaticPrerenderOptions): Promise<AnyStream>;
export declare function continueDynamicHTMLResumeNode(renderStream: AnyStream, { delayDataUntilFirstHtmlChunk, inlinedDataStream, getServerInsertedHTML, getServerInsertedMetadata, deploymentId, }: import('./stream-ops.web').ContinueDynamicHTMLResumeOptions): Promise<AnyStream>;
export declare function continueDynamicHTMLResumeWeb(renderStream: AnyStream, opts: import('./stream-ops.web').ContinueDynamicHTMLResumeOptions): Promise<AnyStream>;
export declare function chainStreams(...streams: AnyStream[]): AnyStream;
export declare function streamToBuffer(stream: AnyStream): Promise<Buffer>;
export declare function streamToString(stream: AnyStream): Promise<string>;
export declare function createWebInlinedDataStream(source: AnyStream, nonce: string | undefined, formState: unknown | null): AnyStream;
export declare function createNodeInlinedDataStream(source: AnyStream, nonce: string | undefined, formState: unknown | null): AnyStream;
export declare function createPendingStream(): AnyStream;
export declare function createDocumentClosingStream(): AnyStream;
export declare function createOnHeadersCallback(appendHeader: (key: string, value: string) => void): NonNullable<PrerenderOptions['onHeaders']>;
export declare function pipeRuntimePrefetchTransform(stream: AnyStream, sentinel: number, isPartial: boolean, staleTime: number): AnyStream;
export declare function processPrelude(unprocessedPrelude: AnyStream): Promise<{
    prelude: AnyStream;
    preludeIsEmpty: boolean;
}>;
export declare function getServerPrerender(ComponentMod: {
    prerender: (...args: any[]) => Promise<any>;
}): (...args: any[]) => any;
export declare const getClientPrerender: typeof import('react-dom/static').prerender;
export declare function teeStream(stream: AnyStream): [AnyStream, AnyStream];
