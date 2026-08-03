let vectors = {{ vectorizeNode_639.output.vectors }};
let texts = {{ codeNode_254.output }};
let title = {{ variablesNode_289.output.title }};
let source = {{ variablesNode_289.output.source }};
let lastModified = {{ variablesNode_289.output.last_modified }};

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

let metadataProps = vectors.map((vector, idx) => ({
  content: texts[idx],
  title: title,
  source: source,
  last_modified: lastModified,
  chunk_id: `${source || title || "onedrive"}-${idx}`
}));

output = {
  metadata: metadataProps,
  vectors: vectors
};