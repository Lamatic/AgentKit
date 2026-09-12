import type { ReadyRuntimeError } from '../utils/get-error-by-type';
import type { HydrationErrorState } from '../../shared/hydration-error';
export declare function useActiveRuntimeError({ runtimeErrors, getSquashedHydrationErrorDetails, activeIdx: controlledActiveIdx, setActiveIndex: controlledSetActiveIndex, }: {
    runtimeErrors: ReadyRuntimeError[];
    getSquashedHydrationErrorDetails: (error: Error) => HydrationErrorState | null;
    activeIdx?: number;
    setActiveIndex?: (index: number) => void;
}): {
    isLoading: boolean;
    activeIdx: number;
    setActiveIndex: (index: number) => void;
    activeError: null;
    errorDetails: null;
    errorCode: null;
    errorType: null;
} | {
    isLoading: false;
    activeIdx: number;
    setActiveIndex: (index: number) => void;
    activeError: ReadyRuntimeError;
    errorDetails: {
        type: "empty";
    } | {
        type: "hydration";
        warning: string | null;
        notes: string | null;
        reactOutputComponentDiff: string | null;
    } | {
        type: "blocking-route";
        variant: import("../components/instant/instant-guidance-data").GuidanceVariant;
        inNavigation: boolean;
    } | {
        type: "client-hook";
        expression: string;
    } | {
        type: "dynamic-metadata";
        variant: import("../components/instant/instant-guidance-data").GuidanceVariant;
    } | {
        type: "dynamic-viewport";
        variant: import("../components/instant/instant-guidance-data").GuidanceVariant;
    } | {
        type: "sync-io";
        cause: string;
    } | {
        type: "sync-io-client";
        cause: string;
    } | {
        type: "unrendered-segment";
        route: string;
        files: string[];
    } | {
        type: "link-prefetch-partial";
        pathname: string;
    };
    errorCode: string | undefined;
    errorType: import("../components/errors/error-type-label/error-type-label").ErrorType;
};
