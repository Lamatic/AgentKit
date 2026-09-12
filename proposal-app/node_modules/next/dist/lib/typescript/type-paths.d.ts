/**
 * Gets the glob patterns for type definition directories in tsconfig.
 * Next.js uses different distDir paths in development vs production:
 * - Development: "{distDir}/dev"
 * - Production: "{distDir}"
 */
export declare function getTypeDefinitionGlobPatterns(distDir: string): string[];
/**
 * Gets the absolute path to the dev types directory for filtering during type-checking.
 * Returns null in dev mode (where dev types are the main types).
 */
export declare function getDevTypesPath(baseDir: string, distDir: string): string | null;
