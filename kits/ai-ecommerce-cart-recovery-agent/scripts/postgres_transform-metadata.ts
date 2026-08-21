let vectors = {{ vectorizeNode_177.output.vectors }};
let texts = {{ codeNode_331.output }};
let title = {{ variablesNode_543.output.title }};
let source = {{ variablesNode_543.output.source }};

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
  throw new Error("Expected each document to have a unique source.");
}

let metadataProps = vectors.map((vector, idx) => ({
  title: title,
  content: texts[idx],
  source: source,
 chunk_id: `${source.trim()}-${idx}`
}));

output = {
  metadata: metadataProps,
  vectors: vectors
};