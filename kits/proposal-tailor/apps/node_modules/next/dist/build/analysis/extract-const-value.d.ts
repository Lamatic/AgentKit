import type { Module } from '@swc/core';
export type ExtractValueResult = {
    value: any;
} | {
    unsupported: string;
    path?: string;
};
/**
 * Extracts the value of an exported const variable named `exportedName`
 * (e.g. "export const config = { runtime: 'edge' }") from swc's AST.
 * The value must be one of (or returns unsupported):
 *   - string
 *   - boolean
 *   - number
 *   - null
 *   - undefined
 *   - array containing values listed in this list
 *   - object containing values listed in this list
 *
 * Returns null if the declaration is not found.
 * Returns { unsupported, path? } if the value contains unsupported nodes.
 */
export declare function extractExportedConstValue(module: Module | null, exportedName: string): ExtractValueResult | null;
