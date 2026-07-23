// Responsible for looking at the commit history. Here, we have put one parser for the commits parseDiffHunks. The issue is: we fetch the commits via git blame. However, git blame is levelled by file. We need to check the diff and see if the diff contains changes to our symbol of interest's definition. 
// Returns: the context appended with history object. history object contains:
// status - status of the results
// commits - array of commits (hashid, message, origin)
//  originFound - origin of the refernece found or not.

const context = {{codeNode_360.output}}

const owner = context.owner;
const repo = context.repo;
const initialPath = context.path;
const ref = context.ref;
const startLine = parseInt(context.startLine || input.startLine, 10);
const endLine = parseInt(context.endLine || input.endLine, 10);
const cap = 100;

const token = {{ secrets.project.GITHUB_TOKEN }} || "";

const headers = {
    "User-Agent": "AgentKit-Client",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
};

if (token) {
    headers["Authorization"] = `Bearer ${token}`;
}

function parseDiffHunks(diffString) {
    const hunks = [];
    const lines = diffString.split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/);
        if (match) {
            hunks.push({
                oldStart: parseInt(match[1], 10),
                oldLen: match[2] !== undefined ? parseInt(match[2], 10) : 1,
                newStart: parseInt(match[3], 10),
                newLen: match[4] !== undefined ? parseInt(match[4], 10) : 1
            });
        }
    }
    return hunks;
}

function processCommitDiff(hunks, currentRange) {
    const sortedHunks = [...hunks].sort((a, b) => a.newStart - b.newStart);

    const mapCoordinate = (val, isStart) => {
        let mappedVal = val;
        for (const hunk of sortedHunks) {
            const hunkStart = hunk.newStart;
            const hunkEnd = hunk.newStart + hunk.newLen - 1;

            if (hunk.newLen > 0) {
                if (val < hunkStart) {
                    continue;
                } else if (val > hunkEnd) {
                    const shift = hunk.newLen - hunk.oldLen;
                    mappedVal -= shift;
                } else {
                    return isStart ? hunk.oldStart : hunk.oldStart + hunk.oldLen - 1;
                }
            } else {
                if (val <= hunkStart) {
                    continue;
                } else {
                    const shift = hunk.newLen - hunk.oldLen;
                    mappedVal -= shift;
                }
            }
        }
        return mappedVal;
    };

    const nextStart = mapCoordinate(currentRange.start, true);
    const nextEnd = mapCoordinate(currentRange.end, false);
    const nextRange = {
        start: Math.max(1, nextStart),
        end: Math.max(Math.max(1, nextStart), nextEnd)
    };

    let touched = false;
    for (const hunk of sortedHunks) {
        let overlaps = false;
        if (hunk.newLen > 0) {
            const hunkStart = hunk.newStart;
            const hunkEnd = hunk.newStart + hunk.newLen - 1;
            const overlapStart = Math.max(hunkStart, currentRange.start);
            const overlapEnd = Math.min(hunkEnd, currentRange.end);
            if (overlapStart <= overlapEnd) {
                overlaps = true;
            }
        } else {
            const hunkStartPrev = hunk.oldStart;
            const hunkEndPrev = hunk.oldStart + hunk.oldLen - 1;
            const overlapStart = Math.max(hunkStartPrev, nextRange.start);
            const overlapEnd = Math.min(hunkEndPrev, nextRange.end);
            if (overlapStart <= overlapEnd) {
                overlaps = true;
            }
        }

        if (overlaps) {
            touched = true;
        }
    }

    let isLikelyOrigin = false;
    for (const hunk of sortedHunks) {
        if (hunk.oldLen === 0 && hunk.newLen > 0) {
            const hunkStart = hunk.newStart;
            const hunkEnd = hunk.newStart + hunk.newLen - 1;
            if (hunkStart <= currentRange.start && hunkEnd >= currentRange.end) {
                isLikelyOrigin = true;
                break;
            }
        }
    }

    return {
        touched,
        isLikelyOrigin,
        nextRange
    };
}

async function getCommitHistory(currentPath, currentRef, first, after) {
    const query = `
    query($owner: String!, $repo: String!, $expression: String!, $path: String!, $first: Int!, $after: String) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Commit {
            history(path: $path, first: $first, after: $after) {
              nodes {
                oid
                message
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    }
  `;

    const url = "https://api.github.com/graphql";
    const res = await fetch(url, {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query,
            variables: { owner, repo, expression: currentRef, path: currentPath, first, after }
        })
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`GraphQL API error: ${res.status} ${res.statusText} - ${text}`);
    }

    const body = await res.json();
    if (body.errors) {
        throw new Error(`GraphQL Errors: ${JSON.stringify(body.errors)}`);
    }

    const history = body.data?.repository?.object?.history;
    if (history) {
        const nodes = history.nodes || [];
        const pageInfo = history.pageInfo || { hasNextPage: false, endCursor: null };
        return {
            nodes: nodes.map(node => ({
                oid: node.oid,
                message: node.message
            })),
            pageInfo
        };
    }

    return {
        nodes: [],
        pageInfo: { hasNextPage: false, endCursor: null }
    };
}

async function getCommitFileDiff(oid, currentPath) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${oid}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
        throw new Error(`Commits endpoint error: ${res.status}`);
    }
    const data = await res.json();
    if (data.files && Array.isArray(data.files)) {
        const file = data.files.find(f => f.filename === currentPath);
        if (file) {
            return {
                patch: file.patch || null,
                status: file.status,
                previousFilename: file.previous_filename || null
            };
        }
    }
    return null;
}

const commits = [];
let currentRange = { start: startLine, end: endLine };
let originFound = false;
let totalFetched = 0;

let currentPath = initialPath;
let currentRef = ref;
const processedOids = new Set();

while (totalFetched < cap && !originFound) {
    let afterCursor = undefined;
    let hasNextPage = true;

    while (totalFetched < cap && hasNextPage && !originFound) {
        const fetchCount = Math.min(30, cap - totalFetched);
        const { nodes, pageInfo } = await getCommitHistory(
            currentPath,
            currentRef,
            fetchCount,
            afterCursor
        );

        if (nodes.length === 0) {
            break;
        }

        let pathSwitched = false;

        for (const node of nodes) {
            if (processedOids.has(node.oid)) {
                continue;
            }
            processedOids.add(node.oid);
            totalFetched++;

            try {
                const diff = await getCommitFileDiff(node.oid, currentPath);
                if (!diff) {
                    continue;
                }

                const hunks = parseDiffHunks(diff.patch || "");
                const res = processCommitDiff(hunks, currentRange);

                if (res.touched) {
                    commits.push({
                        oid: node.oid,
                        message: node.message,
                        isLikelyOrigin: res.isLikelyOrigin
                    });

                    if (res.isLikelyOrigin) {
                        originFound = true;
                        break;
                    }
                }

                currentRange = res.nextRange;

                if (diff.status === "renamed" && diff.previousFilename) {
                    currentPath = diff.previousFilename;
                    currentRef = node.oid;
                    pathSwitched = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (originFound) {
            break;
        }

        if (pathSwitched) {
            break;
        }

        if (!pageInfo.hasNextPage || !pageInfo.endCursor) {
            hasNextPage = false;
        } else {
            afterCursor = pageInfo.endCursor;
        }
    }

    if (!hasNextPage && !originFound) {
        break;
    }
}

let status = "NOT FOUND";
if (commits.length > 0) {
    status = originFound ? "STRONG" : "WEAK";
}

output = {
    ...context,
    history: {
        status,
        commits,
        originFound
    }
};
