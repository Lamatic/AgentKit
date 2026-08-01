let vectors = {{ vectorizeNode_919.output.vectors }};
let texts = {{ codeNode_331.output }};
let title = {{ variablesNode_849.output.title }};
let source = {{ variablesNode_849.output.source }};

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
  title: title,
  source: source,
  content: texts[idx],
  chunk_id: `${source || title || "gsheet"}-${idx}`
}));

output = {
  metadata: metadataProps,
  vectors: vectors
};