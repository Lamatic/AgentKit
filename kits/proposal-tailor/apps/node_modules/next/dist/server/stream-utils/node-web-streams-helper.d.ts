import type { ReactDOMServerReadableStream } from 'react-dom/server';
import type { AnyStream } from '../app-render/stream-ops';
export declare function chainStreams<T>(...streams: ReadableStream<T>[]): ReadableStream<T>;
export declare function streamFromString(str: string): ReadableStream<Uint8Array>;
export declare function streamFromBuffer(chunk: Buffer): ReadableStream<Uint8Array>;
export declare function webstreamToUint8Array(stream: ReadableStream<Uint8Array>): Promise<Uint8Array>;
export declare function nodestreamToUint8Array(stream: AnyStream): Promise<Uint8Array>;
export declare function streamToUint8Array(stream: AnyStream): Promise<Uint8Array<ArrayBufferLike>>;
export declare function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer>;
export declare function streamToString(stream: ReadableStream<Uint8Array>, signal?: AbortSignal): Promise<string>;
export type BufferedTransformOptions = {
    /**
     * Flush synchronously once the buffer reaches this many bytes.
     */
    readonly maxBufferByteLength?: number;
};
export declare function createBufferedTransformStream(options?: BufferedTransformOptions): TransformStream<Uint8Array, Uint8Array>;
export declare function renderToInitialFizzStream({ ReactDOMServer, element, streamOptions, }: {
    ReactDOMServer: {
        renderToReadableStream: typeof import('react-dom/server').renderToReadableStream;
    };
    element: React.ReactElement;
    streamOptions?: Parameters<typeof ReactDOMServer.renderToReadableStream>[1];
}): Promise<ReactDOMServerReadableStream>;
export declare function createMetadataTransformStream(insert: () => Promise<string> | string): TransformStream<Uint8Array, Uint8Array>;
export declare function createHeadInsertionTransformStream(insert: () => Promise<string>): TransformStream<Uint8Array, Uint8Array>;
export declare function createDeferredSuffixStream(suffix: string): TransformStream<Uint8Array, Uint8Array>;
export declare function createFlightDataInjectionTransformStream(stream: ReadableStream<Uint8Array>, delayDataUntilFirstHtmlChunk: boolean): TransformStream<Uint8Array, Uint8Array>;
export declare const CLOSE_TAG = "</body></html>";
/**
 * This transform stream moves the suffix to the end of the stream, so results
 * like `</body></html><script>...</script>` will be transformed to
 * `<script>...</script></body></html>`.
 */
export declare function createMoveSuffixStream(): TransformStream<Uint8Array, Uint8Array>;
export declare function createHtmlDataDplIdTransformStream(dplId: string): TransformStream<Uint8Array, Uint8Array>;
export declare function createRootLayoutValidatorStream(): TransformStream<Uint8Array, Uint8Array>;
export declare function chainTransformers<T>(readable: ReadableStream<T>, transformers: ReadonlyArray<TransformStream<T, T> | null>): ReadableStream<T>;
export type ContinueStreamOptions = {
    inlinedDataStream: ReadableStream<Uint8Array> | undefined;
    isStaticGeneration: boolean;
    deploymentId: string | undefined;
    getServerInsertedHTML: () => Promise<string>;
    getServerInsertedMetadata: () => Promise<string>;
    validateRootLayout?: boolean;
    /**
     * Suffix to inject after the buffered data, but before the close tags.
     */
    suffix?: string | undefined;
};
export declare function continueFizzStream(renderStream: ReactDOMServerReadableStream, { suffix, inlinedDataStream, isStaticGeneration, deploymentId, getServerInsertedHTML, getServerInsertedMetadata, validateRootLayout, }: ContinueStreamOptions): Promise<ReadableStream<Uint8Array>>;
type ContinueDynamicPrerenderOptions = {
    getServerInsertedHTML: () => Promise<string>;
    getServerInsertedMetadata: () => Promise<string>;
    deploymentId: string | undefined;
};
export declare function continueDynamicPrerender(prerenderStream: ReadableStream<Uint8Array>, { getServerInsertedHTML, getServerInsertedMetadata, deploymentId, }: ContinueDynamicPrerenderOptions): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>>;
type ContinueStaticPrerenderOptions = {
    inlinedDataStream: ReadableStream<Uint8Array>;
    getServerInsertedHTML: () => Promise<string>;
    getServerInsertedMetadata: () => Promise<string>;
    deploymentId: string | undefined;
};
export declare function continueStaticPrerender(prerenderStream: ReadableStream<Uint8Array>, { inlinedDataStream, getServerInsertedHTML, getServerInsertedMetadata, deploymentId, }: ContinueStaticPrerenderOptions): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>>;
export declare function continueStaticFallbackPrerender(prerenderStream: ReadableStream<Uint8Array>, { inlinedDataStream, getServerInsertedHTML, getServerInsertedMetadata, deploymentId, }: ContinueStaticPrerenderOptions): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>>;
type ContinueResumeOptions = {
    inlinedDataStream: ReadableStream<Uint8Array>;
    getServerInsertedHTML: () => Promise<string>;
    getServerInsertedMetadata: () => Promise<string>;
    delayDataUntilFirstHtmlChunk: boolean;
    deploymentId: string | undefined;
};
export declare function continueDynamicHTMLResume(renderStream: ReadableStream<Uint8Array>, { delayDataUntilFirstHtmlChunk, inlinedDataStream, getServerInsertedHTML, getServerInsertedMetadata, deploymentId, }: ContinueResumeOptions): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>>;
export declare function createDocumentClosingStream(): ReadableStream<Uint8Array>;
/**
 * Web TransformStream that replaces the runtime prefetch sentinel in an RSC
 * payload stream: `[<sentinel>]` -> `[<isPartial>,<staleTime>]`.
 *
 * This is the web equivalent of createRuntimePrefetchNodeTransform
 * in node-stream-helpers.ts.
 */
export declare function createRuntimePrefetchTransformStream(sentinel: number, isPartial: boolean, staleTime: number): TransformStream<Uint8Array, Uint8Array>;
export {};
