// Responsible for collecting PRs & issues connected with commits found in the last node.
// First it figures out all the PRs connected with the commits. Then, performs a BFS upto depth of 3 to find all the issues/further PRs. Takes care of visited as well thru a map.

// Returns the context appended with discussions object:
// status
// prs: prs linked. each contains the number, title, body
// issues: issues linked. each contains the number, title, body


const input = {{codeNode_325.output}}

const context = input || {};
const owner = context.owner || input.owner;
const repo = context.repo || input.repo;
let commitOids = [];

const inputCommits = context.history?.commits || input.commitOids;
if (Array.isArray(inputCommits)) {
    if (inputCommits.length > 0 && typeof inputCommits[0] === "object") {
        commitOids = inputCommits.map(c => c.oid);
    } else {
        commitOids = inputCommits;
    }
} else if (typeof inputCommits === "string") {
    try {
        const parsed = JSON.parse(inputCommits);
        if (Array.isArray(parsed)) {
            if (parsed.length > 0 && typeof parsed[0] === "object") {
                commitOids = parsed.map(c => c.oid);
            } else {
                commitOids = parsed;
            }
        }
    } catch (e) {
        commitOids = inputCommits.split(",").map(s => s.trim()).filter(Boolean);
    }
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

function extractRefs(text) {
    const numbers = [];
    const numRegex = /(?:#|gh-)(\d+)\b/gi;
    let match;
    while ((match = numRegex.exec(text)) !== null) {
        numbers.push(parseInt(match[1], 10));
    }
    const urlRegex = /github\.com\/[^/]+\/[^/]+\/(?:issues|pull)\/(\d+)\b/gi;
    urlRegex.lastIndex = 0;
    while ((match = urlRegex.exec(text)) !== null) {
        numbers.push(parseInt(match[1], 10));
    }
    return Array.from(new Set(numbers));
}

async function getCommitPRs(oid) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${oid}/pulls`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.map(pr => ({
            number: pr.number,
            title: pr.title || "",
            body: pr.body || ""
        }));
    }
    return [];
}

async function getIssueOrPR(number) {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${number}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Failed to fetch issue/PR #${number}`);
    const data = await res.json();
    return {
        number: data.number,
        title: data.title || "",
        body: data.body || "",
        isPullRequest: !!data.pull_request
    };
}

const prsMap = new Map();
const issuesMap = new Map();
const visited = new Set();
const queue = [];

// Step 1: Seed queue with direct PRs associated with commit hashes
for (const oid of commitOids) {
    try {
        const commitPrs = await getCommitPRs(oid);
        for (const pr of commitPrs) {
            if (!visited.has(pr.number)) {
                visited.add(pr.number);
                prsMap.set(pr.number, pr);
                queue.push({ number: pr.number, depth: 1 });
            }
        }
    } catch (e) {
        continue;
    }
}

// Step 2: Seed queue with direct Issue references mentioned in those PRs
for (const pr of prsMap.values()) {
    const linkedRefs = extractRefs(`${pr.title} ${pr.body}`);
    for (const num of linkedRefs) {
        if (!visited.has(num)) {
            visited.add(num);
            queue.push({ number: num, depth: 1 });
        }
    }
}

// Step 3: Run recursive BFS queue walk up to depth 3
while (queue.length > 0) {
    const item = queue.shift();
    const isPRAlreadyFetched = prsMap.has(item.number);
    const isIssueAlreadyFetched = issuesMap.has(item.number);

    let title = "";
    let body = "";
    let isPR = false;

    if (isPRAlreadyFetched) {
        const pr = prsMap.get(item.number);
        title = pr.title;
        body = pr.body;
        isPR = true;
    } else if (isIssueAlreadyFetched) {
        const iss = issuesMap.get(item.number);
        title = iss.title;
        body = iss.body;
        isPR = false;
    } else {
        try {
            const fetched = await getIssueOrPR(item.number);
            title = fetched.title;
            body = fetched.body;
            isPR = fetched.isPullRequest;

            if (isPR) {
                prsMap.set(item.number, { number: fetched.number, title: fetched.title, body: fetched.body });
            } else {
                issuesMap.set(item.number, { number: fetched.number, title: fetched.title, body: fetched.body });
            }
        } catch (e) {
            continue;
        }
    }

    if (item.depth < 3) {
        const textToScan = `${title} ${body}`;
        const linkedRefs = extractRefs(textToScan);
        for (const num of linkedRefs) {
            if (!visited.has(num)) {
                visited.add(num);
                queue.push({ number: num, depth: item.depth + 1 });
            }
        }
    }
}

const prs = Array.from(prsMap.values());
const issues = Array.from(issuesMap.values());

let status = "NOT FOUND";
if (prs.length > 0 && issues.length > 0) {
    status = "STRONG";
} else if (prs.length > 0 || issues.length > 0) {
    status = "WEAK";
}

output = {
    ...context,
    discussions: {
        status,
        prs,
        issues
    }
};
