let vectors = {{vectorizeNode_697.output.vectors}};
let metadataProps = [];
let texts = {{codeNode_602.output}};
const filename = {{extractFromFileNode_736.output.files}}[0]['metadata']['filename'];

for (const idx in vectors) {
  let metadata = {}
  metadata["content"] = texts[idx];
  metadata["uuid"] = Math.random().toString(36).slice(2, 18);
  metadata["url"] = {{triggerNode_1.output.document_url}};

  let data = {{InstructorLLMNode_664.output}};
  if (data._meta) {
    delete data._meta;
  }
  metadata["metadata"] = JSON.stringify(data); // Change based on user output.
  metadataProps.push(metadata)
};

output = { "metadata": metadataProps, "vectors": vectors }