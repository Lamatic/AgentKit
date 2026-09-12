import type { RouteTypesManifest } from './route-types-utils';
export type RootParamValueType = 'string' | 'string[]' | 'undefined';
export type RootParamInfo = Set<RootParamValueType>;
/**
 * Generates TypeScript type definitions for root params.
 * Creates a `declare module 'next/root-params'` block with async getter functions
 * for each root parameter.
 */
export declare function generateRootParamsTypes(rootParams: Map<string, RootParamInfo>): string;
/**
 * Writes root-params type definitions to a file if root params were collected
 * from layouts.
 */
export declare function writeRootParamsTypes(manifest: RouteTypesManifest, filePath: string): Promise<void>;
