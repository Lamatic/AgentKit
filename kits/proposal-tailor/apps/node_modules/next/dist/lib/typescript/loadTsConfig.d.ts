export type RelevantCompilerOptions = {
    paths?: Record<string, string[]>;
    /** Absolute path for an explicitly configured baseUrl. */
    baseUrl?: string;
    /** Absolute directory containing an inherited paths option without baseUrl. */
    pathsBasePath?: string;
};
/**
 * Loads only the tsconfig options Next.js needs outside of the TypeScript API.
 * Paths and baseUrl keep the directory they were declared in while resolving
 * an extends chain, including arrays of extended configs.
 */
export declare function loadTsConfigOptions(configPath: string): RelevantCompilerOptions;
