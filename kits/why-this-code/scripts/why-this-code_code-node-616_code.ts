// Figures out the same & cross file usages of the file by using github's search api
// Context is prevented from bloating by simple heuristics.
// We search for the symbol, from all the candidate files filter those which actually import the reference (commented out code is filtered out thru regex) 
// From the valid files, fetch the file content and the exact invocations.
// Returns the context with the appended usages object:
// usages.status
// usages.files - file path, content, resolved local name (the file may be using alias), invocations(line number + snippet)

const context = {{codeNode_561.output}}

const owner = context.owner;
const ref = context.ref;
const repo = context.repo;
const symbolName = context.symbolName;
const path = context.path;
const profileId = context.profile; // "typescript" or "python"

const token = {{ secrets.project.GITHUB_TOKEN }} || "";

const headers = {
    "User-Agent": "AgentKit-Client",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
    headers["Authorization"] = `Bearer ${token}`;
}

// --- Strippers & Profiles helpers ---
function stripJsComments(code) {
    const regex = /(\/\*[\s\S]*?\*\/|\/\/.*)|('(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|`(?:\\[\s\S]|[^`\\])*`)/g;
    return code.replace(regex, (match, comment) => comment ? comment.replace(/[^\r\n]/g, " ") : match);
}

function stripJsStringLiterals(code) {
    const regex = /(\/\*[\s\S]*?\*\/|\/\/.*)|('(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|`(?:\\[\s\S]|[^`\\])*`)/g;
    return code.replace(regex, (match, comment, str) => {
        if (str) {
            const quote = str[0];
            const endQuote = str[str.length - 1];
            const content = str.slice(1, -1);
            return quote + content.replace(/[^\r\n]/g, " ") + endQuote;
        }
        return match;
    });
}

function stripPyComments(code) {
    const regex = /(#.*|[rRbBfF]{0,2}"""[\s\S]*?"""|[rRbBfF]{0,2}'''[\s\S]*?''')|([rRbBfF]{0,2}'(?:\\[\s\S]|[^'\\])*'|[rRbBfF]{0,2}"(?:\\[\s\S]|[^"\\])*")/g;
    return code.replace(regex, (match, commentOrDocstring) => commentOrDocstring ? commentOrDocstring.replace(/[^\r\n]/g, " ") : match);
}

function stripPyStringLiterals(code) {
    const regex = /(#.*)|([rRbBfF]{0,2}"""[\s\S]*?"""|[rRbBfF]{0,2}'''[\s\S]*?'''|[rRbBfF]{0,2}'(?:\\[\s\S]|[^'\\])*'|[rRbBfF]{0,2}"(?:\\[\s\S]|[^"\\])*")/g;
    return code.replace(regex, (match, comment, str) => {
        if (str) {
            const quoteMatch = str.match(/^([rRbBfF]{0,2}"""|[rRbBfF]{0,2}'''|[rRbBfF]{0,2}'|[rRbBfF]{0,2}")/);
            if (quoteMatch) {
                const quote = quoteMatch[1];
                const quoteLen = quote.length;
                const content = str.slice(quoteLen, -quoteLen);
                return quote + content.replace(/[^\r\n]/g, " ") + quote;
            }
        }
        return match;
    });
}

function importPathMatches(importPath, refPath) {
    const cleanImport = importPath.replace(/\.[a-zA-Z0-9]+$/, "").replace(/\\/g, "/");
    const cleanRef = refPath.replace(/\.[a-zA-Z0-9]+$/, "").replace(/\\/g, "/");
    if (cleanImport === cleanRef) return true;
    const importParts = cleanImport.split("/");
    const suffix = importParts.filter(p => p !== "." && p !== "..").join("/");
    if (suffix && cleanRef.endsWith(suffix)) return true;
    const importBase = cleanImport.split("/").pop();
    const refBase = cleanRef.split("/").pop();
    return importBase === refBase;
}

async function findSameFileUses(fileContent, refName, excludeRange) {
    let strippedCode = fileContent;
    if (profileId === "typescript") {
        strippedCode = stripJsStringLiterals(stripJsComments(fileContent));
    } else if (profileId === "python") {
        strippedCode = stripPyComments(fileContent);
    }
    const originalLines = fileContent.split(/\r?\n/);
    const strippedLines = strippedCode.split(/\r?\n/);
    const uses = [];
    const wordRegex = new RegExp(`\\b${refName}\\b`);

    for (let i = 0; i < strippedLines.length; i++) {
        const lineNum = i + 1;
        if (excludeRange && lineNum >= excludeRange.start && lineNum <= excludeRange.end) {
            continue;
        }
        if (wordRegex.test(strippedLines[i])) {
            uses.push({
                line: lineNum,
                snippet: originalLines[i].trim()
            });
        }
    }
    return uses;
}

async function searchCode(query) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.github.com/search/code?q=${encodedQuery}+repo:${owner}/${repo}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.items && Array.isArray(data.items)) {
        return data.items.map(item => ({ path: item.path }));
    }
    return [];
}

async function getFileContents(filePath) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=HEAD`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    if (data.encoding === "base64" && typeof data.content === "string") {
        const content = Buffer.from(data.content.replace(/\r?\n/g, ""), "base64").toString("utf-8");
        return { content };
    }
    throw new Error("Invalid format");
}

// --- Main Search Logic ---
const searchResults = await searchCode(symbolName);
const files = [];

// TS/JS and Python Regex definitions
const typescriptPatterns = {
    named: /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g,
    namedAliased: /import\s*\{\s*[^}]*?\b(\w+)\s+as\s+(\w+)\b[^}]*?\}\s*from\s*['"]([^'"]+)['"]/g,
    default: /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    namespace: /import\s*\*\s*as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    commonjs: /\b(?:const|let|var)\s+(?:(\w+)|\{\s*([^}]+)\s*\})\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
};

const pythonPatterns = {
    named: /from\s+[\w.]+\s+import\s+((?:\(\s*[a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*\s*\)|[a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*))/g,
    namedAliased: /(?:from\s+[\w.]+\s+import|import)\s+(\w+)\s+as\s+(\w+)/g,
    default: /^import\s+(\w+)/g
};

for (const result of searchResults) {
    if (result.path === path) continue;

    try {
        const { content } = await getFileContents(result.path);
        const importContent = profileId === "typescript" ? stripJsComments(content) : stripPyComments(content);

        let importsSymbol = false;
        let resolvedLocalName = symbolName;
        let isNamespace = false;

        if (profileId === "typescript") {
            const patterns = typescriptPatterns;
            patterns.named.lastIndex = 0;
            patterns.namedAliased.lastIndex = 0;
            patterns.default.lastIndex = 0;
            patterns.namespace.lastIndex = 0;
            patterns.commonjs.lastIndex = 0;

            let match;
            while ((match = patterns.namedAliased.exec(importContent)) !== null) {
                if (match[1] === symbolName && importPathMatches(match[3], path)) {
                    importsSymbol = true;
                    resolvedLocalName = match[2];
                    break;
                }
            }

            if (!importsSymbol) {
                while ((match = patterns.named.exec(importContent)) !== null) {
                    const wordRegex = new RegExp(`\\b${symbolName}\\b`);
                    if (wordRegex.test(match[1]) && importPathMatches(match[2], path)) {
                        importsSymbol = true;
                        resolvedLocalName = symbolName;
                        break;
                    }
                }
            }

            if (!importsSymbol) {
                while ((match = patterns.default.exec(importContent)) !== null) {
                    if (match[1] === symbolName && importPathMatches(match[2], path)) {
                        importsSymbol = true;
                        resolvedLocalName = symbolName;
                        break;
                    }
                }
            }

            if (!importsSymbol) {
                while ((match = patterns.namespace.exec(importContent)) !== null) {
                    if (importPathMatches(match[2], path)) {
                        importsSymbol = true;
                        resolvedLocalName = match[1];
                        isNamespace = true;
                        break;
                    }
                }
            }

            if (!importsSymbol) {
                while ((match = patterns.commonjs.exec(importContent)) !== null) {
                    const modulePath = match[3];
                    if (importPathMatches(modulePath, path)) {
                        if (match[1]) {
                            importsSymbol = true;
                            resolvedLocalName = match[1];
                            isNamespace = true;
                        } else if (match[2]) {
                            const wordRegex = new RegExp(`\\b${symbolName}\\b`);
                            if (wordRegex.test(match[2])) {
                                importsSymbol = true;
                                resolvedLocalName = symbolName;
                            }
                        }
                        break;
                    }
                }
            }
        } else if (profileId === "python") {
            const patterns = pythonPatterns;
            patterns.named.lastIndex = 0;
            patterns.namedAliased.lastIndex = 0;
            patterns.default.lastIndex = 0;

            let match;
            while ((match = patterns.namedAliased.exec(importContent)) !== null) {
                if (match[1] === symbolName) {
                    importsSymbol = true;
                    resolvedLocalName = match[2];
                    break;
                }
            }

            if (!importsSymbol) {
                while ((match = patterns.named.exec(importContent)) !== null) {
                    const wordRegex = new RegExp(`\\b${symbolName}\\b`);
                    if (wordRegex.test(match[1])) {
                        importsSymbol = true;
                        resolvedLocalName = symbolName;
                        break;
                    }
                }
            }

            if (!importsSymbol) {
                while ((match = patterns.default.exec(importContent)) !== null) {
                    if (match[1] === symbolName) {
                        importsSymbol = true;
                        resolvedLocalName = symbolName;
                        break;
                    }
                }
            }
        }

        if (importsSymbol) {
            const searchName = isNamespace ? `${resolvedLocalName}.${symbolName}` : resolvedLocalName;
            const invocations = await findSameFileUses(content, searchName);
            if (invocations.length > 0) {
                files.push({
                    path: result.path,
                    resolvedLocalName,
                    invocations,
                    content
                });
            }
        }
    } catch (e) {
        continue;
    }
}

let status = "NOT FOUND";
if (files.length > 0) {
    status = "STRONG";
}


output = {
    ...context,
    usages: {
        status,
        files
    }
};
