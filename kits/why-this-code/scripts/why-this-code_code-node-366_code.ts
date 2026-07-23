// Returns framework context. It contains:
//  status - Confidence level ("STRONG" if signature files exist, otherwise "NOT FOUND")
//  language - which language it is (based on language profile)
//  signatureFiles - package management & config files
//  projectStructure - root level project structure
//  parentStructure - project structure of the parent
//  parentPath - Relative path to parent directory (defaults to "/").


const context = {{codeNode_360.output}};
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

async function getRepoLanguage() {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return "";
    const data = await res.json();
    return data.language || "";
}

async function getListing(dir) {
    const url = dir === ""
        ? `https://api.github.com/repos/${owner}/${repo}/contents/?ref=${ref}`
        : `https://api.github.com/repos/${owner}/${repo}/contents/${dir}?ref=${ref}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.map(item => item.type === "dir" ? `${item.name}/` : item.name);
    }
    return [];
}

const language = await getRepoLanguage();
const rootFiles = await getListing("");

const sigFiles = [
    "package.json",
    "tsconfig.json",
    "jsconfig.json",
    "requirements.txt",
    "pyproject.toml",
    "setup.py",
    "manage.py",
    "Pipfile"
];

const signatureFiles = rootFiles.filter(file =>
    sigFiles.some(sig => file.replace("/", "").toLowerCase() === sig.toLowerCase())
);

let parentStructure = [];
let parentPath = "";
if (filePath) {
    const parts = filePath.split("/");
    if (parts.length > 1) {
        parentPath = parts.slice(0, -1).join("/");
        parentStructure = await getListing(parentPath);
    } else {
        parentPath = "";
        parentStructure = rootFiles;
    }
}

let status = signatureFiles.length > 0 ? "STRONG" : "NOT FOUND";

output = {
        ...context,
        frameworkContext: {
            status,
            language,
            signatureFiles,
            projectStructure: rootFiles,
            parentStructure,
            parentPath: parentPath === "" ? "/" : parentPath
        }
};