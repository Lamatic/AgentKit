let vectors = {{ vectorizeNode_623.output.vectors }};
let texts = {{ codeNode_539.output }};
let title = {{ variablesNode_272.output.title }};
let source = {{ variablesNode_272.output.source }};

let metadataProps = [];

if (Array.isArray(vectors) && Array.isArray(texts) && vectors.length === texts.length) {
  metadataProps = vectors.map((vector, idx) => ({
    title: title,
    content: texts[idx],
    source: source,
    chunk_id: `${source || title || "gdrive"}-${idx}`
  }));
}

output = {
  metadata: metadataProps,
  vectors: vectors
};