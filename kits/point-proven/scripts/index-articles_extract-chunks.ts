// PASTE into Index flow → Extract Chunks (code node after Chunking).
// Vectorize REQUIRES: string[]
// Use (x) to bind YOUR chunk node — whole .chunks if available, else whole output.
// Never leave {{ }} in // comments.

let docs = {{chunkNode_968.output.chunks}};

if (docs == null) {
  docs = {{chunkNode_968.output}};
}

if (typeof docs === "string") {
  try {
    let parsed = JSON.parse(docs);
    docs = parsed;
  } catch (e) {
    docs = docs.trim() ? [docs] : [];
  }
}

if (docs && typeof docs === "object" && !Array.isArray(docs)) {
  if (Array.isArray(docs.chunks)) docs = docs.chunks;
  else if (Array.isArray(docs.documents)) docs = docs.documents;
  else if (Array.isArray(docs.data)) docs = docs.data;
  else if (typeof docs.pageContent === "string") docs = [docs.pageContent];
  else if (typeof docs.markdown === "string") docs = [docs.markdown];
  else if (typeof docs.text === "string") docs = [docs.text];
  else docs = [];
}

if (!Array.isArray(docs)) docs = [];

function toChunkString(doc) {
  if (doc == null) return "";
  if (typeof doc === "string") {
    let s = doc.trim();
    return s === "[object Object]" ? "" : s;
  }
  if (typeof doc !== "object") return String(doc);

  // Common chunk / LangChain shapes
  let candidates = [
    doc.pageContent,
    doc.content,
    doc.text,
    doc.markdown,
    doc.chunk,
    doc.value
  ];
  for (let i = 0; i < candidates.length; i++) {
    let c = candidates[i];
    if (typeof c === "string" && c.trim() && c !== "[object Object]") {
      return c.trim();
    }
  }
  // Never String(object) → "[object Object]"
  return "";
}

let outputDocs = [];
for (let i = 0; i < docs.length; i++) {
  let s = toChunkString(docs[i]);
  if (s) outputDocs.push(s);
}

// Debug-friendly: if empty, expose why (still valid string[])
output = outputDocs;
