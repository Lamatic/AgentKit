// Response for parsing and validation of the symbol path url client has sent
// We throw specific errors corresponding to validation issues, catch block catches them and sets the status flag 'failure'. Conditional Node kills the whole flow and sends an API response right away with the error
// The node returns this output:
// output:
    //     status (of the validation)
    //     owner (parsed from the url)
    //     repo (parsed from the url)
    //     ref (parsed from the url)
    //     path (parsed from the url)
    //     profile (parsed from the file type. handy to deal with different language quirks)
    //     fileContent (of the symbol path)
    //     startLine (where the reference (function or class) begins)
    //     endLine  (where the reference (function or class) ends)
    //     symbolName (symbol name)
    //     docstring (docstring if any)

try {
    const url = {{ triggerNode_1.output.url }}
    // const url = input.url;
    
    // --- Helper Sanitizers & Profile Configs ---
    function stripJsComments(code) {
        const regex = /(\/\*[\s\S]*?\*\/|\/\/.*)|('(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|`(?:\\[\s\S]|[^`\\])*`)/g;
        return code.replace(regex, (match, comment) => {
            if (comment) {
                return comment.replace(/[^\r\n]/g, " ");
            }
            return match;
        });
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
        return code.replace(regex, (match, commentOrDocstring) => {
            if (commentOrDocstring) {
                return commentOrDocstring.replace(/[^\r\n]/g, " ");
            }
            return match;
        });
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
    
    const typescriptProfile = {
        id: "typescript",
        boundaryStrategy: "brace",
        fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
        aliasCaptureGroup: 2,
        commentStripper: stripJsComments,
        stringLiteralStripper: stripJsStringLiterals,
        declarationPatterns: [
            /^\s*(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+(\w+)/,
            /^\s*(?:export\s+(?:default\s+)?)?class\s+(\w+)/,
            /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>/
        ]
    };
    
    const pythonProfile = {
        id: "python",
        boundaryStrategy: "indentation",
        fileExtensions: [".py"],
        aliasCaptureGroup: 2,
        commentStripper: stripPyComments,
        stringLiteralStripper: stripPyStringLiterals,
        declarationPatterns: [
            /^\s*(?:async\s+)?def\s+(\w+)/,
            /^\s*class\s+(\w+)/
        ]
    };
    
    const profiles = [typescriptProfile, pythonProfile];
    
    function getLanguageProfile(filenameOrLangName) {
        const normalized = filenameOrLangName.toLowerCase().trim();
        let match = profiles.find((p) => p.id === normalized || (normalized === "javascript" && p.id === "typescript"));
        if (match) return match;
        match = profiles.find((p) =>
            p.fileExtensions.some((ext) => normalized.endsWith(ext) || `.${normalized}` === ext)
        );
        if (match) return match;
        throw new Error(`Unsupported language or file extension: "${filenameOrLangName}"`);
    }
    
    // --- Step 1: Parse URL ---
    if (typeof url !== "string" || !url.trim()) {
        throw new Error("GitHub URL must be a non-empty string.");
    }
    
    const urlRegex = /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/([^#?]+)(?:\?[\s\S]*?)?(?:#L(\d+)(?:-L(\d+))?)?/;
    const match = url.match(urlRegex);
    
    if (!match) {
        if (!url.startsWith("https://github.com") && !url.startsWith("http://github.com")) {
            throw new Error(`Invalid GitHub URL: Must start with "https://github.com". Received: "${url}"`);
        }
        if (!url.includes("/blob/")) {
            throw new Error(`Invalid GitHub URL: Permalinks must contain "/blob/" to reference a specific file. Received: "${url}"`);
        }
        throw new Error(`Invalid GitHub permalink URL format: "${url}"`);
    }
    
    const owner = match[1];
    const repo = match[2];
    const ref = match[3];
    const path = match[4];
    const urlStartLine = match[5] ? parseInt(match[5], 10) : 1;
    const urlEndLine = match[6] ? parseInt(match[6], 10) : urlStartLine;
    
    if (urlStartLine < 1 || urlEndLine < urlStartLine) {
        throw new Error(`Invalid line range in URL: start line must be >= 1 and end line must be >= start line. Parsed start: ${urlStartLine}, end: ${urlEndLine}`);
    }
    
    if (!owner || !repo || !ref || !path) {
        throw new Error(`Invalid GitHub URL structure: owner, repo, ref, and path must all be present. Parsed: owner="${owner}", repo="${repo}", ref="${ref}", path="${path}"`);
    }
    
    // --- Step 2: Load Profile & Fetch Content ---
    const profile = getLanguageProfile(path);
    
    const apiPropsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
    
    const headers = {
        "User-Agent": "AgentKit-Client",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };
    
    const token = {{ secrets.project.GITHUB_TOKEN }} || "";
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(apiPropsUrl, { headers });
    
    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    
    const apiData = await res.json();
    
    if (apiData.encoding !== "base64" || typeof apiData.content !== "string") {
        throw new Error(`Unexpected content format for path: ${path}`);
    }
    
    const fileContent = Buffer.from(apiData.content.replace(/\r?\n/g, ""), "base64").toString("utf-8");
    const lines = fileContent.split(/\r?\n/);
    
    if (urlStartLine > lines.length) {
        throw new Error(`Requested start line ${urlStartLine} is out of bounds. File only has ${lines.length} lines.`);
    }
    
    // --- Step 3: Match Declaration Patterns ---
    let declarationValid = false;
    let symbolName = "";
    let declLineIdx = urlStartLine - 1;
    
    // Strip comments from the file content first (while preserving line numbers/newlines)
    const cleanContent = profile.commentStripper(fileContent);
    const cleanLines = cleanContent.split(/\r?\n/);
    
    const searchLimit = urlEndLine;
    
    for (let i = urlStartLine - 1; i < Math.min(cleanLines.length, searchLimit); i++) {
        for (const pattern of profile.declarationPatterns) {
            const pMatch = cleanLines[i].match(pattern);
            if (pMatch) {
                declarationValid = true;
                symbolName = pMatch[1];
                declLineIdx = i;
                break;
            }
        }
        if (declarationValid) break;
    }
    
    if (!declarationValid) {
        throw new Error(`Declaration is invalid: Line range ${urlStartLine}-${urlEndLine} of file "${path}" does not contain a valid function or class definition for ${profile.id}.`);
    }
    
    // --- Step 4: Find Reference End Line ---
    const startLine = declLineIdx + 1;
    let endLine = lines.length;
    
    if (profile.boundaryStrategy === "brace") {
        let openBraces = 0;
        let foundOpen = false;
    
        for (let i = declLineIdx; i < lines.length; i++) {
            const stripped = profile.stringLiteralStripper
                ? profile.stringLiteralStripper(profile.commentStripper(lines[i]))
                : profile.commentStripper(lines[i]);
    
            for (const char of stripped) {
                if (char === "{") {
                    openBraces++;
                    foundOpen = true;
                } else if (char === "}") {
                    openBraces--;
                }
            }
    
            if (foundOpen && openBraces <= 0) {
                endLine = i + 1;
                break;
            }
        }
    } else if (profile.boundaryStrategy === "indentation") {
        const declLine = lines[declLineIdx];
        const declIndent = declLine.match(/^\s*/)?.[0].length || 0;
    
        for (let i = declLineIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (trimmed === "" || trimmed.startsWith("#")) {
                continue;
            }
    
            const indent = line.match(/^\s*/)?.[0].length || 0;
            if (indent <= declIndent) {
                endLine = i;
                break;
            }
        }
    }
    
    // --- Step 5: Extract Comments & Docstrings ---
    const comments = [];
    let idx = declLineIdx - 1;
    
    while (idx >= 0) {
        const line = lines[idx].trim();
        if (line === "") {
            idx--;
            continue;
        }
    
        if (profile.id === "typescript") {
            if (line.startsWith("//")) {
                comments.push(lines[idx]);
                idx--;
            } else if (line.endsWith("*/")) {
                let blockLines = [];
                while (idx >= 0) {
                    const bl = lines[idx].trim();
                    blockLines.push(lines[idx]);
                    if (bl.startsWith("/*") || bl.startsWith("/**")) {
                        break;
                    }
                    idx--;
                }
                comments.push(...blockLines);
                idx--;
            } else {
                break;
            }
        } else if (profile.id === "python") {
            if (line.startsWith("#")) {
                comments.push(lines[idx]);
                idx--;
            } else {
                break;
            }
        }
    }
    
    let docstring = comments.reverse().join("\n").trim();
    
    if (profile.id === "python") {
        const bodyLines = lines.slice(declLineIdx, endLine);
        const docLines = [];
        let insideDoc = false;
        let quoteChar = "";
    
        for (let i = 1; i < bodyLines.length; i++) {
            const line = bodyLines[i].trim();
            if (line === "") continue;
    
            if (!insideDoc) {
                if (line.startsWith('"""')) {
                    insideDoc = true;
                    quoteChar = '"""';
                    docLines.push(bodyLines[i]);
                    if (line.endsWith('"""') && line.length > 3) {
                        break;
                    }
                } else if (line.startsWith("'''")) {
                    insideDoc = true;
                    quoteChar = "'''";
                    docLines.push(bodyLines[i]);
                    if (line.endsWith("'''") && line.length > 3) {
                        break;
                    }
                } else {
                    break;
                }
            } else {
                docLines.push(bodyLines[i]);
                if (line.endsWith(quoteChar)) {
                    break;
                }
            }
        }
        const pyDoc = docLines.join("\n").trim();
        if (pyDoc) {
            docstring = docstring ? `${docstring}\n${pyDoc}` : pyDoc;
        }
    }
    
    output = {
        status: "success",
        validationError: "none",
        owner,
        repo,
        ref,
        path,
        profile: profile.id,
        fileContent,
        startLine,
        endLine,
        symbolName,
        docstring
    };
} catch (error) {
    console.error("Error in Resolve Reference node: ", error.message);
    output = {
        status: "failure",
        validationError: error.message
    };
}
