let vectors = {{ vectorizeNode_919.output }};
let texts = {{ codeNode_331.output }};
let title = {{ variablesNode_849.output.title }};
let source = {{ variablesNode_849.output.source }};

let metadataProps = [];

if (Array.isArray(vectors) && Array.isArray(texts) && vectors.length === texts.length) {
  for (let i = 0; i < vectors.length; i++) {
    metadataProps.push({
      title: title,
      source: source,
      content: texts[i]
    });
  }
}

output = {
  vectors: vectors,
  metadata: metadataProps
};