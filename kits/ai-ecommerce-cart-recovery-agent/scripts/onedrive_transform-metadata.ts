let vectors = {{ vectorizeNode_639.output.vectors }};
let texts = {{ codeNode_254.output }};
let title = {{ variablesNode_289.output.title }};
let source = {{ variablesNode_289.output.source }};
let lastModified = {{ variablesNode_289.output.last_modified }};

let metadataProps = [];

if (Array.isArray(vectors) && Array.isArray(texts) && vectors.length === texts.length) {
  metadataProps = vectors.map((vector, idx) => ({
    content: texts[idx],
    title: title,
    source: source,
    last_modified: lastModified
  }));
}

output = {
  metadata: metadataProps,
  vectors: vectors
};