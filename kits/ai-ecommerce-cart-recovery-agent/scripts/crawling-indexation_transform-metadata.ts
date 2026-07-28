let vectors = {{ vectorizeNode_314.output.vectors }};
let texts = {{ codeNode_794.output }};
let title = {{ variablesNode_658.output.title }};
let description = {{ variablesNode_658.output.description }};
let source = {{ variablesNode_658.output.source }};

let metadataProps = [];

if (
  Array.isArray(vectors) &&
  Array.isArray(texts) &&
  vectors.length > 0 &&
  vectors.length === texts.length
) {
  metadataProps = vectors.map((vector, idx) => ({
    content: texts[idx],
    title: title,
    description: description,
    source: source,
    chunk_id: `${source || title || "crawling"}-${idx}`
  }));
}

output = {
  metadata: metadataProps,
  vectors: vectors
};