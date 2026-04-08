let vectors = {{vectorizeNode_295.output.vectors}}
let metadataProps = [];
let texts = {{codeNode_158.output}}

for (const idx in vectors) {
  let metadata = {}
  metadata["content"] = texts[idx];
  metadata["filename"] = {{triggerNode_1.output.filename}}
  metadataProps.push(metadata)
};

output = { "metadata": metadataProps, "vectors": vectors }