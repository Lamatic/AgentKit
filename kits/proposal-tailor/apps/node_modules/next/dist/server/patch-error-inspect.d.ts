import { type ModernSourceMapPayload } from './lib/source-maps';
import type { IgnorableStackFrame } from '../next-devtools/server/shared';
type FindSourceMapPayload = (sourceURL: string) => ModernSourceMapPayload | undefined;
export declare function setBundlerFindSourceMapImplementation(findSourceMapImplementation: FindSourceMapPayload): void;
type CodeFrameRenderer = (frame: IgnorableStackFrame, source: string | null, colors: boolean) => string | null;
export declare function setCodeFrameRenderer(renderer: CodeFrameRenderer): void;
export declare function patchErrorInspectNodeJS(errorConstructor: ErrorConstructor): void;
export declare function patchErrorInspectEdgeLite(errorConstructor: ErrorConstructor): void;
export {};
