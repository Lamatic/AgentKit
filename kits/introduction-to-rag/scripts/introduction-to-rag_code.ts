let vectors = {{vectorizeNode_222.output.vectors}}
let metadataProps = [];
let texts = {{codeNode_502.output}}

for (const idx in vectors) {
    let metadata = {}
    metadata["content"] = texts[idx];
    metadata["file_name"] = "Test File"
    metadataProps.push(metadata)
}
console.log("finaldata:", {"metadata": metadataProps, "vectors": vectors});
output = {"metadata": metadataProps, "vectors": vectors}