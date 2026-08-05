// Transform Metadata (Index flow, code node after Vectorize).
//
// VectorDB config: Vectors = this node's `vectors`, Metadata = this node's
// `metadata`, primary keys citation_id + chunk_id, duplicate = overwrite.
//
// Bind the three {{ }} below with the (x) picker as whole node outputs;
// nested paths render grey in Studio and resolve inconsistently.
//
// MAX_INDEX_BATCH exists because Lamatic serializes large vector matrices as
// strings on the VectorDB handoff: ~50 rows fails with
// "cannot unmarshal string into ... float32", 7-8 rows succeeds.

let vectorOut = {{vectorizeNode_314.output}};
let texts = {{codeNode_794.output}};
let varsOut = {{variablesNode_658.output}};

let MAX_INDEX_BATCH = 8;

if (typeof vectorOut === "string") {
  try {
    vectorOut = JSON.parse(vectorOut);
  } catch (e) {
    vectorOut = null;
  }
}

let vectors = [];
if (Array.isArray(vectorOut)) {
  vectors = vectorOut;
} else if (vectorOut && typeof vectorOut === "object") {
  if (Array.isArray(vectorOut.vectors)) vectors = vectorOut.vectors;
  else if (Array.isArray(vectorOut.embeddings)) vectors = vectorOut.embeddings;
}
if (!Array.isArray(vectors)) vectors = [];

if (typeof texts === "string") {
  try {
    texts = JSON.parse(texts);
  } catch (e) {
    texts = texts.trim() ? [texts] : [];
  }
}
if (!Array.isArray(texts)) texts = [];

if (typeof varsOut === "string") {
  try {
    varsOut = JSON.parse(varsOut);
  } catch (e) {
    varsOut = null;
  }
}
if (!varsOut || typeof varsOut !== "object") varsOut = {};

function asString(v) {
  if (v == null) return "";
  if (typeof v === "string") {
    return v === "[object Object]" ? "" : v;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function hostnameFromUrl(u) {
  let s = asString(u);
  let m = s.match(/^https?:\/\/([^\/?#]+)/i);
  return m && m[1] ? m[1] : s || "unknown";
}

// Scraped pages carry nav, share links, and newsletter forms that pollute retrieval.
function isJunkChunk(text) {
  let t = String(text || "").toLowerCase();
  if (t.length < 80) return true;
  if (t.indexOf("share on") !== -1) return true;
  if (t.indexOf("skip to main content") !== -1) return true;
  if (t.indexOf("event registration form") !== -1) return true;
  if (t.indexOf("sign up now") !== -1) return true;
  if (t.indexOf("pause slideshow") !== -1) return true;
  if (t.indexOf("effectorplaceholder") !== -1) return true;
  if (t.indexOf("donate today") !== -1 && t.length < 400) return true;
  return false;
}

let titleStr = asString(varsOut.title);
let descStr = asString(varsOut.description);
let sourceStr = asString(varsOut.source);
let citation_id = hostnameFromUrl(sourceStr);

let keptVectors = [];
let keptTexts = [];

// Track errors for each page processed
let pageErrors = [];

for (let i = 0; i < vectors.length; i++) {
  let chunkText = asString(texts[i]);
  if (!chunkText && texts[i] && typeof texts[i] === "object") {
    let o = texts[i];
    chunkText =
      asString(o.pageContent) ||
      asString(o.content) ||
      asString(o.text) ||
      "";
  }
  if (isJunkChunk(chunkText)) continue;
  keptVectors.push(vectors[i]);
  keptTexts.push(chunkText);
}

// If all chunks were filtered as junk, record an error for this page
if (vectors.length > 0 && keptVectors.length === 0) {
  pageErrors.push({
    source: sourceStr,
    error: "All content chunks filtered as junk or boilerplate"
  });
}

// Longest chunks carry the most retrievable substance.
if (keptVectors.length > MAX_INDEX_BATCH) {
  let order = [];
  for (let i = 0; i < keptTexts.length; i++) {
    order.push({ i: i, len: keptTexts[i].length });
  }
  order.sort(function (a, b) {
    return b.len - a.len;
  });
  order = order.slice(0, MAX_INDEX_BATCH);
  order.sort(function (a, b) {
    return a.i - b.i;
  });
  let nv = [];
  let nt = [];
  for (let k = 0; k < order.length; k++) {
    nv.push(keptVectors[order[k].i]);
    nt.push(keptTexts[order[k].i]);
  }
  keptVectors = nv;
  keptTexts = nt;
}

let metadataProps = [];
for (let i = 0; i < keptVectors.length; i++) {
  metadataProps.push({
    content: keptTexts[i],
    title: titleStr,
    description: descStr,
    source: sourceStr,
    citation_id: citation_id,
    chunk_id: titleStr + ":" + i
  });
}

output = { metadata: metadataProps, vectors: keptVectors, indexed_count: keptVectors.length, errors: pageErrors };
