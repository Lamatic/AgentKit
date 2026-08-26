let vectors = {{ vectorizeNode_314.output.vectors }};
let texts = {{ codeNode_794.output }};
let chunkId = {{ variablesNode_658.output.chunk_id }};
let source = {{ variablesNode_658.output.source }};
let description = {{ variablesNode_658.output.description }};

if (!Array.isArray(vectors)) {
  throw new Error("Expected vectors to be an array.");
}

if (!Array.isArray(texts)) {
  throw new Error("Expected texts to be an array.");
}

if (vectors.length !== texts.length) {
  throw new Error(
    `Vector count (${vectors.length}) does not match text count (${texts.length}).`
  );
}

if (typeof chunkId !== "string" || chunkId.trim() === "") {
  throw new Error(
    "Expected each crawled page to have a stable chunk_id."
  );
}

let stableChunkId = chunkId.trim();

let metadataProps = vectors.map((vector, idx) => ({
  content: texts[idx],
  source: typeof source === "string" ? source.trim() : source,
  description: description,
  chunk_id: `${stableChunkId}-${idx}`
}));

output = {
  metadata: metadataProps,
  vectors: vectors
};