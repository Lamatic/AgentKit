let vectors = {{ vectorizeNode_623.output.vectors }};
let texts = {{ codeNode_539.output }};
let title = {{ variablesNode_272.output.title }};
let source = {{ variablesNode_272.output.source }};

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

if (typeof title !== "string" || title.trim() === "") {
  throw new Error("Expected a GDrive document identity.");
}

let metadataProps = vectors.map((vector, idx) => ({
  title: title,
  content: texts[idx],
  source: source,
  chunk_id: `${title}-${idx}`
}));

output = {
  metadata: metadataProps,
  vectors: vectors
};