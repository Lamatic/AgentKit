import type { PageExtensions } from '../build/page-extensions-type';
interface ResolvedBuildPaths {
    appPaths: string[];
    pagePaths: string[];
}
/**
 * Resolves glob patterns and explicit paths to actual file paths.
 * Categorizes them into App Router and Pages Router paths.
 *
 * Supports negation patterns prefixed with "!" to exclude paths.
 * e.g., "app/**,!app/[lang]/page.js" includes all App Router paths except
 * app/[lang]/page.js
 */
export declare function resolveBuildPaths(patterns: string[], projectDir: string, pageExtensions: PageExtensions): Promise<ResolvedBuildPaths>;
/**
 * Parse build paths from comma-separated format
 * Supports:
 * - Comma-separated values: "app/page.tsx,app/about/page.tsx"
 *
 * @param input - String input to parse
 * @returns Array of path patterns
 */
export declare function parseBuildPathsInput(input: string): string[];
export {};
