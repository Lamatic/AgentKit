// Returns the Docs 
// Looks for md files in  all directories from the target file's parent folder up to the root.
// The current scope we use this heuristic - only look for md files named as readme, architecture, design, docs (most common names).
// Appends docs object to the context. Contains:
// status: "STRONG" if both a readme and an architecture/design file are found.
// "WEAK" if at least one documentation file is found.
// "NOT FOUND" if no matching .md files are found.
// path: its path
// files array containing file object with its path and content


const context = {{codeNode_366.output}};
const owner = context.owner;
const repo = context.repo;
const ref = context.ref;
const filePath = context.path;

if (!owner || !repo) {
    throw new Error("Missing required inputs: owner and repo are required.");
}

const token = {{ secrets.project.GITHUB_TOKEN }} || "";

const headers = {
    "User-Agent": "AgentKit-Client",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
    headers["Authorization"] = `Bearer ${token}`;
}

async function getListing(dir) {
    const url = dir === ""
        ? `https://api.github.com/repos/${owner}/${repo}/contents/?ref=${ref}`
        : `https://api.github.com/repos/${owner}/${repo}/contents/${dir}?ref=${ref}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.map(item => item.name);
    }
    return [];
}

async function getFileContent(docPath) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${docPath}?ref=${ref}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.encoding === "base64" && typeof data.content === "string") {
        return Buffer.from(data.content.replace(/\r?\n/g, ""), "base64").toString("utf-8");
    }
    return null;
}

const parts = filePath.split("/");
const dirsToCheck = [];
for (let i = parts.length - 1; i >= 0; i--) {
    dirsToCheck.push(parts.slice(0, i).join("/"));
}

const foundFiles = [];
const matchedPaths = new Set();

for (const dir of dirsToCheck) {
    try {
        const fileNames = await getListing(dir);
        const docPatterns = [/readme/i, /architecture/i, /design/i, /docs/i];
        const matchingNames = fileNames.filter(name =>
            docPatterns.some(pattern => pattern.test(name)) && name.endsWith(".md")
        );

        for (const name of matchingNames) {
            const docPath = dir === "" ? name : `${dir}/${name}`;
            if (!matchedPaths.has(docPath)) {
                matchedPaths.add(docPath);
                const content = await getFileContent(docPath);
                if (content !== null) {
                    foundFiles.push({ path: docPath, content });
                }
            }
        }
    } catch (e) {
        continue;
    }
}

let status = "NOT FOUND";
if (foundFiles.length > 0) {
    const hasReadme = foundFiles.some(f => f.path.toLowerCase().includes("readme"));
    const hasArch = foundFiles.some(
        f => f.path.toLowerCase().includes("architecture") || f.path.toLowerCase().includes("design")
    );
    status = hasReadme && hasArch ? "STRONG" : "WEAK";
}

output = {
    ...context,
    docs: {
        status,
        files: foundFiles
    }
};
