let vectors = {{ vectorizeNode_314.output.vectors }};
let texts = {{ codeNode_794.output }};
let title = {{ variablesNode_658.output.title }};
let description = {{ variablesNode_658.output.description }};
let source = {{ variablesNode_658.output.source }};

let metadataProps = [];

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

metadataProps = vectors.map((vector, idx) => ({
  content: texts[idx],
  title: title,
  description: description,
  source: source,
 chunk_id: `${source || title || "scraping"}-${idx}`
}));
output = {
  metadata: metadataProps,
  vectors: vectors
};