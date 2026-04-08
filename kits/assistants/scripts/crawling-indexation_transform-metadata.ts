let vectors = {{ vectorizeNode_314.output.vectors }};
let metadataProps = [];
let texts = {{codeNode_794.output}};

for (const idx in vectors) {
  let metadata = {}
  metadata["content"] = texts[idx];
  metadata["title"] = {{variablesNode_658.output.title}};
  metadata["description"] = {{variablesNode_658.output.description}};
  metadata["source"] = {{variablesNode_658.output.source}};
  metadataProps.push(metadata)
};

output = { "metadata": metadataProps, "vectors": vectors }