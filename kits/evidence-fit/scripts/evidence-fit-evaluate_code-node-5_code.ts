let currentCase = {{forLoopNode_2.output.currentValue}};
let fixedOut = {{searchNode_3.output}};
let clauseOut = {{searchNode_4.output}};

// Keep ONLY the six fields the Metrics node reads. Search hits carry the full
// embedding vector (1536 floats) plus scores and internals; inlining all of that
// into the Metrics code node is what blows Lamatic's execution payload limit.
const KEEP = ["documentId", "strategy", "chunkId", "start", "end"];
const PER_STRATEGY = 8;

function toObject(v) {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch (e) { return v; }
}

function toResults(v) {
  const p = toObject(v);
  if (Array.isArray(p)) return p;
  if (!p || typeof p !== "object") return [];
  for (const k of ["results", "data", "matches", "chunks", "hits", "searchResults"]) {
    const inner = toObject(p[k]);
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function metaOf(item) {
  if (!item || typeof item !== "object") return null;
  if (item.metadata && typeof item.metadata === "object") return item.metadata;
  if (item.document && typeof item.document === "object") return item.document;
  if (item.record && typeof item.record === "object") return item.record;
  return item;
}

function project(list) {
  const out = [];
  for (let i = 0; i < list.length && out.length < PER_STRATEGY; i++) {
    const m = metaOf(list[i]);
    if (!m) continue;
    const slim = {};
    for (const k of KEEP) if (m[k] !== undefined) slim[k] = m[k];
    if (slim.chunkId && slim.strategy) out.push(slim);
  }
  return out;
}

output = {
  caseId: currentCase && currentCase.id ? String(currentCase.id) : "",
  results: project(toResults(fixedOut)).concat(project(toResults(clauseOut))),
};
