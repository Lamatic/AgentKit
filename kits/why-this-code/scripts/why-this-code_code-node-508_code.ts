// To prevent the context from bloating due to file sizes, we are trimming file content to only contain invocations with 10 lines around them for usage context. 
// However, we do return the full file content via referencing the output of the previous node in the response node

const context = {{codeNode_616.output}};

function trimFileContent(fileContent, keepRanges) {
    if (!fileContent) return "";
    const lines = fileContent.split(/\r?\n/);
    if (lines.length === 0) return "";

    // Merge ranges
    const sorted = [...keepRanges].sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of sorted) {
        if (merged.length === 0) {
            merged.push([...r]);
        } else {
            const last = merged[merged.length - 1];
            if (r[0] <= last[1] + 1) {
                last[1] = Math.max(last[1], r[1]);
            } else {
                merged.push([...r]);
            }
        }
    }

    const outputLines = [];
    let lastIndex = 0; // 0-indexed line pointer

    for (const [start, end] of merged) {
        const startIdx = Math.max(0, start - 1);
        const endIdx = Math.min(lines.length - 1, end - 1);

        if (startIdx > lastIndex) {
            outputLines.push(`// ... [lines ${lastIndex + 1}-${startIdx} skipped] ...`);
        }

        for (let i = startIdx; i <= endIdx; i++) {
            outputLines.push(`L${i + 1}: ${lines[i]}`);
        }
        lastIndex = endIdx + 1;
    }

    if (lastIndex < lines.length) {
        outputLines.push(`// ... [lines ${lastIndex + 1}-${lines.length} skipped] ...`);
    }

    return outputLines.join("\n");
}

// 1. Trim context.fileContent (Target definition file)
if (context.fileContent && context.startLine !== undefined && context.endLine !== undefined) {
    const totalLines = context.fileContent.split(/\r?\n/).length;
    const startLine = context.startLine;
    const endLine = context.endLine;
    const bufferStart = Math.max(1, startLine - 10);
    const bufferEnd = Math.min(totalLines, endLine + 10);
    context.fileContent = trimFileContent(context.fileContent, [[bufferStart, bufferEnd]]);
}

// 2. Trim context.usages.files
if (context.usages && Array.isArray(context.usages.files)) {
    context.usages.files = context.usages.files.map(file => {
        if (file.content && Array.isArray(file.invocations) && file.invocations.length > 0) {
            const totalLines = file.content.split(/\r?\n/).length;
            const ranges = file.invocations.map(inv => {
                const line = parseInt(inv.line, 10);
                return [Math.max(1, line - 10), Math.min(totalLines, line + 10)];
            });
            const trimmed = trimFileContent(file.content, ranges);
            return {
                ...file,
                content: trimmed
            };
        }
        return file;
    });
}

output = {
    context
};
