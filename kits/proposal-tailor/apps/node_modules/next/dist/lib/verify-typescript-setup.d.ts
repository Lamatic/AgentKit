import type { TypeCheckResult } from './typescript/runTypeCheck';
export declare function verifyAndRunTypeScript({ dir, distDir, cacheDir, strictRouteTypes, tsconfigPath, shouldRunTypeCheck, typedRoutes, disableStaticImages, hasAppDir, hasPagesDir, appDir, pagesDir, debugBuildPaths, useTypeScriptCli, onFirstCliOutput, }: {
    dir: string;
    distDir: string;
    cacheDir?: string;
    strictRouteTypes: boolean;
    tsconfigPath: string | undefined;
    shouldRunTypeCheck: boolean;
    typedRoutes: boolean;
    disableStaticImages: boolean;
    hasAppDir: boolean;
    hasPagesDir: boolean;
    appDir?: string;
    pagesDir?: string;
    debugBuildPaths?: {
        app?: string[];
        pages?: string[];
    };
    useTypeScriptCli?: boolean;
    /**
     * Called once when the CLI checker first produces output, so the caller can
     * stop the build spinner. Only used on the in-process CLI path.
     */
    onFirstCliOutput?: () => void;
}): Promise<{
    result?: TypeCheckResult;
    version: string | null;
    typeCheckMode: 'typescript-api' | 'typescript-cli';
}>;
/**
 * Worker entrypoint used by `next build` for the TypeScript-API type-check.
 * `verifyAndRunTypeScript` has already printed any error, so on failure we exit
 * the worker directly rather than rethrowing: a thrown error would be retried by
 * jest-worker and surface in the parent as the unhelpful
 * `Jest worker encountered 1 child process exceptions, exceeding retry limit`.
 */
export declare function verifyAndRunTypeScriptInWorker(options: Parameters<typeof verifyAndRunTypeScript>[0]): ReturnType<typeof verifyAndRunTypeScript>;
