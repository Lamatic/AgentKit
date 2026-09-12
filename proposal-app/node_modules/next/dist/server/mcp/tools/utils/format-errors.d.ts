import type { OverlayState } from '../../../../next-devtools/dev-overlay/shared';
import type { OriginalStackFramesRequest, OriginalStackFramesResponse } from '../../../../next-devtools/server/shared';
type StackFrameResolver = (request: OriginalStackFramesRequest) => Promise<OriginalStackFramesResponse>;
export declare function setStackFrameResolver(fn: StackFrameResolver): void;
interface StackFrame {
    file: string;
    methodName: string;
    line: number | null;
    column: number | null;
}
interface FormattedRuntimeError {
    type: string;
    errorName: string;
    message: string;
    stack: StackFrame[];
}
interface FormattedSessionError {
    url: string;
    buildError: string | null;
    runtimeErrors: FormattedRuntimeError[];
}
interface FormattedConfigError {
    name: string;
    message: string;
    stack: string | null;
}
export interface FormattedErrorsOutput {
    configErrors: FormattedConfigError[];
    sessionErrors: FormattedSessionError[];
}
export declare function formatErrors(errorsByUrl: Map<string, OverlayState>, nextInstanceErrors?: {
    nextConfig: unknown[];
}): Promise<FormattedErrorsOutput>;
export {};
