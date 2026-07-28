let vectors = {{ vectorizeNode_639.output.vectors }};
let texts = {{ codeNode_254.output }};
let title = {{ variablesNode_289.output.title }};
let source = {{ variablesNode_289.output.source }};
let lastModified = {{ variablesNode_289.output.last_modified }};

let metadataProps = [];

if (Array.isArray(vectors) && Array.isArray(texts) && vectors.length === texts.length && vectors.length > 0) {
  metadataProps = vectors.map((vector, idx) => ({
    content: texts[idx],
    title: title,
    source: source,
    last_modified: lastModified,
    chunk_id: `${source || title || "sharepoint"}-${idx}`
  }));
}

output = {
  metadata: metadataProps,
  vectors: vectors
};