export interface TypeScriptPackageInfo {
    packageJsonPath: string;
    packageDir: string;
    version: string;
    apiPath?: string;
    tscPath?: string;
}
export declare function getTypeScriptPackageInfo(baseDir: string): TypeScriptPackageInfo | null;
export declare function hasNativeTypeScriptPreview(baseDir: string): boolean;
export declare function getTypeScriptApiMissingError(version: string): Error;
export interface TypeScriptCliResult {
    exitCode: number;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
}
export declare function runTypeScriptCli({ cwd, tscPath, args, captureOutput, onFirstOutput, }: {
    cwd: string;
    tscPath: string;
    args: string[];
    /**
     * Accumulate stdout/stderr into the resolved result instead of forwarding it
     * to this process's stdout/stderr (for e.g. parsing `--showConfig` output).
     */
    captureOutput?: boolean;
    /**
     * Called once, on the first chunk of forwarded output. Used to stop the build
     * spinner before `tsc`'s diagnostics appear. Not called when capturing.
     */
    onFirstOutput?: () => void;
}): Promise<TypeScriptCliResult>;
export declare function getTypeScriptConfigurationCli({ baseDir, tsConfigPath, tscPath, }: {
    baseDir: string;
    tsConfigPath: string;
    tscPath: string;
}): Promise<{
    compilerOptions: Record<string, any>;
}>;
