/**
 * Converts a cache handler path to a filesystem path.
 * ESM's import.meta.resolve() returns file:// URLs which break when concatenated
 * with .next/ or used with path.join/path.relative.
 * @param filePath - Absolute path, relative path, or file:// URL (e.g. from import.meta.resolve)
 * @returns A filesystem path suitable for path operations
 */
export declare function resolveCacheHandlerPathToFilesystem(filePath: string): string;
/**
 * The path for a dynamic route must be URLs with a valid scheme.
 *
 * When an absolute Windows path is passed to it, it interprets the beginning of the path as a protocol (`C:`).
 * Therefore, it is important to always construct a complete path.
 * @param dir File directory
 * @param filePath Absolute or relative path, or file:// URL (e.g. from import.meta.resolve)
 */
export declare const formatDynamicImportPath: (dir: string, filePath: string) => string;
