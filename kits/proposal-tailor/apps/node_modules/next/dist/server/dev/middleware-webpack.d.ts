import { type BasicSourceMapPayload } from '../lib/source-maps';
import { type StackFrame, type OriginalStackFrameResponse, type OriginalStackFramesResponse } from '../../next-devtools/server/shared';
import type { IncomingMessage, ServerResponse } from 'http';
import type webpack from 'webpack';
import type { RawSourceMap } from 'next/dist/compiled/source-map08';
type IgnoredSources = Array<{
    url: string;
    ignored: boolean;
}>;
type Source = {
    type: 'file';
    sourceMap: BasicSourceMapPayload;
    ignoredSources: IgnoredSources;
    moduleURL: string;
} | {
    type: 'bundle';
    sourceMap: BasicSourceMapPayload;
    ignoredSources: IgnoredSources;
    compilation: webpack.Compilation;
    moduleId: string;
    moduleURL: string;
};
export declare function getIgnoredSources(sourceMap: RawSourceMap & {
    ignoreList?: number[];
}): IgnoredSources;
/**
 * Code frame rendering options. The defaults match terminal consumers; only
 * the overlay HTTP path opts in to always-on colors and the wide max width.
 */
type CodeFrameOptions = {
    /** Defaults to `process.stdout.isTTY`. */
    colors?: boolean;
    /** Defaults to the dev server's terminal width. */
    maxWidth?: number;
};
export declare function createOriginalStackFrame({ ignoredByDefault, source, rootDirectory, frame, errorMessage, codeFrameOptions, }: {
    /** setting this to true will not consult ignoreList */
    ignoredByDefault: boolean;
    source: Source;
    rootDirectory: string;
    frame: StackFrame;
    errorMessage?: string;
    codeFrameOptions?: CodeFrameOptions;
}): Promise<OriginalStackFrameResponse | null>;
export declare function getOriginalStackFrames({ isServer, isEdgeServer, isAppDirectory, frames, clientStats, serverStats, edgeServerStats, rootDirectory, codeFrameOptions, }: {
    isServer: boolean;
    isEdgeServer: boolean;
    isAppDirectory: boolean;
    frames: readonly StackFrame[];
    clientStats: () => webpack.Stats | null;
    serverStats: () => webpack.Stats | null;
    edgeServerStats: () => webpack.Stats | null;
    rootDirectory: string;
    codeFrameOptions?: CodeFrameOptions;
}): Promise<OriginalStackFramesResponse>;
export declare function getOverlayMiddleware(options: {
    rootDirectory: string;
    isSrcDir: boolean;
    clientStats: () => webpack.Stats | null;
    serverStats: () => webpack.Stats | null;
    edgeServerStats: () => webpack.Stats | null;
}): (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
export declare function getSourceMapMiddleware(options: {
    clientStats: () => webpack.Stats | null;
    serverStats: () => webpack.Stats | null;
    edgeServerStats: () => webpack.Stats | null;
}): (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
export {};
