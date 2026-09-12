import type { Issue } from '../../../../build/swc/types';
export interface FormattedIssue {
    severity: string;
    filePath: string;
    title: string;
    description?: string;
    detail?: string;
    source?: {
        filePath: string;
        range?: {
            /** 1-indexed */
            start: {
                line: number;
                column: number;
            };
            /** 1-indexed */
            end: {
                line: number;
                column: number;
            };
        };
    };
    /** Code frame with ANSI codes stripped */
    codeFrame?: string;
}
/**
 * Transform raw Turbopack issues into a clean format for MCP consumers:
 * - Converts StyledString trees (title/description/detail) to Markdown
 * - Strips ANSI codes from code frames
 * - Converts 0-indexed source positions to 1-indexed
 * - Deduplicates issues (same error can surface from multiple endpoints)
 */
export declare function formatCompilationIssues(issues: Issue[]): FormattedIssue[];
