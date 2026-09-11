// Assign the value you want to return from this code node to `output`.
// The `output` variable is already declared.



let vectors = {{vectorizeNode_839.output.vectors}};
let metadataProps = [];
let texts = {{codeNode_173.output}};

for (const idx in vectors) {
    let metadata = {}
    metadata["content"] = texts[idx];
    metadata["file_id"] = {{triggerNode_1.output.document_key}};
    metadataProps.push(metadata)
}
console.log("finaldata:", {"metadata": metadataProps, "vectors": vectors});
output = {"metadata": metadataProps, "vectors": vectors}