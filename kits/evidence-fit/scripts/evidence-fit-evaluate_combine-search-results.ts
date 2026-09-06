// PASTE into the Evaluate flow -> Combine Search Results (code node placed inside the
// loop, after both Vector Search nodes and before Loop End).
//
// Unlike the other two scripts in this directory, this node vendors nothing from
// apps/lib/evidence/core.ts — it does no scoring. Its only job is to reduce one
// iteration's raw search output to the handful of fields the Metrics node reads, and
// to label it with the acceptance case it belongs to.
//
// Bindings — set all three with Studio's (x) picker rather than typing them, so the
// ids match whatever Studio actually minted for your graph:
//   {{forLoopNode_2.output.currentValue}}  the current acceptance case
//   {{searchNode_3.output}}                Search - Fixed-Width
//   {{searchNode_4.output}}                Search - Clause-Aware
//
// Loop End retains this node's output in each iteration of `loopOutput`,
// and Metrics extracts the per-case records. Metrics indexes ranked hits by
// caseId, so an empty caseId here silently drops the whole iteration from scoring.

let currentCase = {{forLoopNode_2.output.currentValue}};
let fixedOut = {{searchNode_3.output}};
let clauseOut = {{searchNode_4.output}};

const rawCaseType = typeof currentCase;

// Keep ONLY the five fields the Metrics node reads. Chunk text is deliberately not
// forwarded: Metrics recovers it from documentText by offset (buildChunkFromMetadata in
// evidence-fit-evaluate_metrics.ts), and nothing in core.ts reads Chunk.text. Raw hits
// carry the full 1536-float embedding plus scores and store internals, so projecting
// here keeps the loop's accumulated output small enough to read in Studio's log.
const KEEP = ["documentId", "strategy", "chunkId", "start", "end"];

// A little wider than topK, so Metrics can still compute firstCompleteEvidenceRank
// past the cutoff.
const PER_STRATEGY = 8;

function toObject(v) {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch (e) {
    return v;
  }
}

// Lamatic hands loop variables to a code node as JSON text about as often as it hands
// them over as objects. Parsing is required, not defensive: an unparsed currentCase
// leaves caseId empty, Metrics skips every entry with an empty caseId, and the run then
// reports zero for every retrieval metric while span integrity, severed spans and the
// chunk listing all stay correct — so the flow looks healthy and is not.
currentCase = toObject(currentCase);

function caseIdOf(c) {
  if (typeof c === "string") return c;
  if (c && typeof c === "object") {
    const keys = ["id", "caseId", "case_id"];
    for (let i = 0; i < keys.length; i++) {
      const v = c[keys[i]];
      if (typeof v === "string" && v !== "") return v;
      if (typeof v === "number") return String(v);
    }
  }
  return "";
}

// Unwrap whichever envelope the vector search node returns its hits in.
function toResults(v) {
  const p = toObject(v);
  if (Array.isArray(p)) return p;
  if (!p || typeof p !== "object") return [];
  const keys = ["results", "data", "matches", "chunks", "hits", "searchResults"];
  for (let i = 0; i < keys.length; i++) {
    const inner = toObject(p[keys[i]]);
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
    // A hit missing either label cannot be attributed to a strategy, so it is dropped
    // rather than guessed at — the same rule buildChunkFromMetadata applies downstream.
    if (slim.chunkId && slim.strategy) out.push(slim);
  }
  return out;
}

const fixedHits = project(toResults(fixedOut));
const clauseHits = project(toResults(clauseOut));
const caseId = caseIdOf(currentCase);

output = {
  caseId: caseId,
  results: fixedHits.concat(clauseHits),

  // Diagnostics travel with the node output through Loop End. They let its log answer the
  // two questions that actually go wrong here: did the searches return anything, and
  // did the case id survive the trip through the loop variable?
  _rawCaseType: rawCaseType,
  _caseIdEmpty: caseId === "",
  _fixedHits: fixedHits.length,
  _clauseHits: clauseHits.length,
};
