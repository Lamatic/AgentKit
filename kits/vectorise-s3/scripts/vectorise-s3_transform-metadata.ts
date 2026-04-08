let vectors = {{vectorizeNode_639.output.vectors}}
let metadataProps = [];
let texts = {{ codeNode_620.output }};

for (const idx in vectors) {
    let metadata = {}
    metadata["content"] = texts[idx];
    metadata["file_name"] = {{triggerNode_1.output.document_key}}
    metadataProps.push(metadata)
}
console.log("finaldata:", {"metadata": metadataProps, "vectors": vectors});
output = {"metadata": metadataProps, "vectors": vectors}