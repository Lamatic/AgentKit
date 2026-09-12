import type { StackFrame } from '../../server/lib/parse-stack';
export type { StackFrame };
export interface IgnorableStackFrame extends StackFrame {
    ignored: boolean;
}
export interface OriginalStackFramesRequest {
    frames: readonly StackFrame[];
    isServer: boolean;
    isEdgeServer: boolean;
    isAppDirectory: boolean;
}
export type OriginalStackFramesResponse = OriginalStackFrameResponseResult[];
export type OriginalStackFrameResponseResult = PromiseSettledResult<OriginalStackFrameResponse>;
export interface OriginalStackFrameResponse {
    originalStackFrame: (StackFrame & {
        ignored: boolean;
    }) | null;
    originalCodeFrame: string | null;
}
type CodeFrameRenderOptions = {
    colors?: boolean;
    maxWidth?: number;
};
export declare const DEVTOOLS_CODE_FRAME_MAX_WIDTH = 1000;
export declare function ignoreListAnonymousStackFramesIfSandwiched(responses: OriginalStackFramesResponse): void;
/**
 * It looks up the code frame of the traced source.
 * @note It ignores Next.js/React internals, as these can often be huge bundled files.
 */
export declare function getOriginalCodeFrame(frame: IgnorableStackFrame, source: string | null, colorsOrOptions?: boolean | CodeFrameRenderOptions): string | null;
