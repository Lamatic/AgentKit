// Code: Transform Metadata
// Flow: gdrive

let vectors = {{vectorizeNode_623.output.vectors}};
let metadataProps = [];
let texts = {{codeNode_539.output}};

for (const idx in vectors) {
    let metadata = {}
    metadata["title"] = {{variablesNode_272.output.title}};
    metadata["content"] = texts[idx];
    metadata["source"] = {{variablesNode_272.output.source}};
    metadataProps.push(metadata);
}


output = {"metadata": metadataProps, "vectors": vectors}
