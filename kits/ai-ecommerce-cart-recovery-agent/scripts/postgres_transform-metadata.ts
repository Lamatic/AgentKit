let vectors = {{ vectorizeNode_177.output.vectors }};
let texts = {{ codeNode_331.output }};
let title = {{ variablesNode_543.output.title }};
let source = {{ variablesNode_543.output.source }};

let metadataProps = [];

if (
  Array.isArray(vectors) &&
  Array.isArray(texts) &&
  vectors.length > 0 &&
  vectors.length === texts.length
) {
  metadataProps = vectors.map((vector, idx) => ({
    title: title,
    content: texts[idx],
    source: source
  }));
}

output = {
  metadata: metadataProps,
  vectors: vectors
};