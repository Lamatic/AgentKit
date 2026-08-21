let vectors = {{ vectorizeNode_314.output.vectors }};
let texts = {{ codeNode_794.output }};
let title = {{ variablesNode_658.output.title }};
let description = {{ variablesNode_658.output.description }};
let source = {{ variablesNode_658.output.source }};

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

if (typeof source !== "string" || source.trim() === "") {
  throw new Error("Expected each scraped page to have a unique source URL.");
}

let metadataProps = vectors.map((vector, idx) => ({
  content: texts[idx],
  title: title,
  description: description,
  source: source,
  chunk_id: `${source.trim()}-${idx}`
}));

output = {
  metadata: metadataProps,
  vectors: vectors
};