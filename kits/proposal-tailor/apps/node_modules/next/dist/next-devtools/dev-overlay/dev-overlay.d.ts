import type { ReadyRuntimeError } from './utils/get-error-by-type';
export declare const RenderErrorContext: import("react").Context<{
    runtimeErrors: ReadyRuntimeError[];
    totalErrorCount: number;
    normalErrorCount: number;
    instantErrorCount: number;
}>;
export declare const useRenderErrorContext: () => {
    runtimeErrors: ReadyRuntimeError[];
    totalErrorCount: number;
    normalErrorCount: number;
    instantErrorCount: number;
};
export declare function DevOverlay(): import("react").JSX.Element;
