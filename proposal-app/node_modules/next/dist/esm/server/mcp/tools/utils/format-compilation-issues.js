import stripAnsi from 'next/dist/compiled/strip-ansi';
/** Convert a StyledString tree to Markdown. */ function styledStringToMarkdown(s) {
    switch(s.type){
        case 'text':
            return s.value;
        case 'code':
            return `\`${s.value}\``;
        case 'strong':
            return `**${s.value}**`;
        case 'line':
            return s.value.map(styledStringToMarkdown).join('');
        case 'stack':
            return s.value.map(styledStringToMarkdown).join('\n');
        default:
            return '';
    }
}
/**
 * Transform raw Turbopack issues into a clean format for MCP consumers:
 * - Converts StyledString trees (title/description/detail) to Markdown
 * - Strips ANSI codes from code frames
 * - Converts 0-indexed source positions to 1-indexed
 * - Deduplicates issues (same error can surface from multiple endpoints)
 */ export function formatCompilationIssues(issues) {
    const seen = new Set();
    const formattedIssues = [];
    for (const issue of issues){
        var _issue_source_range, _issue_source, _issue_source_range1, _issue_source1;
        const title = styledStringToMarkdown(issue.title);
        // Include source position in the key so two distinct errors in the same
        // file with the same message are not collapsed into one.
        const startLine = ((_issue_source = issue.source) == null ? void 0 : (_issue_source_range = _issue_source.range) == null ? void 0 : _issue_source_range.start.line) ?? '';
        const startCol = ((_issue_source1 = issue.source) == null ? void 0 : (_issue_source_range1 = _issue_source1.range) == null ? void 0 : _issue_source_range1.start.column) ?? '';
        const key = `${issue.severity}|${issue.filePath}|${title}|${startLine}:${startCol}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const { range } = issue.source ?? {};
        formattedIssues.push({
            severity: issue.severity,
            filePath: issue.filePath,
            title,
            description: issue.description ? styledStringToMarkdown(issue.description) : undefined,
            detail: issue.detail ? styledStringToMarkdown(issue.detail) : undefined,
            source: issue.source ? {
                filePath: issue.source.source.filePath,
                range: range ? {
                    start: {
                        line: range.start.line + 1,
                        column: range.start.column + 1
                    },
                    end: {
                        line: range.end.line + 1,
                        column: range.end.column + 1
                    }
                } : undefined
            } : undefined,
            codeFrame: issue.codeFrame ? stripAnsi(issue.codeFrame) : undefined
        });
    }
    return formattedIssues;
}

//# sourceMappingURL=format-compilation-issues.js.map