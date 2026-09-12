import type { ReadyRuntimeError } from './get-error-by-type';
export declare function generateErrorInfo({ activeError, errorType, versionInfo, bundler, }: {
    activeError: ReadyRuntimeError | null;
    errorType: string | null;
    versionInfo: string;
    bundler: string;
}): Promise<string>;
