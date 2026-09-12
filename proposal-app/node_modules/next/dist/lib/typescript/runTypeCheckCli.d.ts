import type { TypeCheckResult } from './runTypeCheck';
export declare function runTypeCheckCli({ baseDir, tsConfigPath, tscPath, cacheDir, onFirstOutput, }: {
    baseDir: string;
    tsConfigPath: string;
    tscPath: string;
    cacheDir?: string;
    /**
     * Called once when `tsc` first produces output. Used to stop the build
     * spinner so it does not sit above the diagnostics.
     */
    onFirstOutput?: () => void;
}): Promise<TypeCheckResult>;
