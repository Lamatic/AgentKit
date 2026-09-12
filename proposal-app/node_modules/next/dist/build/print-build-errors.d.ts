import type { TurbopackResult } from './swc/types';
export declare function formatWarningsHeader(count: number): string;
/**
 * Processes and reports build issues from Turbopack entrypoints.
 *
 * @param entrypoints - The result object containing build issues to process.
 * @param isDev - A flag indicating if the build is running in development mode.
 * @param opts.deferWarnings - When true, warnings are returned instead of
 *                             printed so the caller can print them later.
 * @return The formatted warnings when `deferWarnings` is set and nothing threw.
 * @throws {Error} If a fatal issue is encountered, this function throws an error. In development mode, we only throw on
 *                 'fatal' and 'bug' issues. In production mode, we also throw on 'error' issues.
 */
export declare function printBuildErrors(entrypoints: TurbopackResult, isDev: boolean, opts?: {
    deferWarnings?: boolean;
}): {
    warnings: string[];
};
