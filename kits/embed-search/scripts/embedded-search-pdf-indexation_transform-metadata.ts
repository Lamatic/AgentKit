// Code: Transform Metadata
// Flow: embedded-search-pdf-indexation

let vectors = {{vectorizeNode_639.output.vectors}}
let metadataProps = [];
let texts = {{codeNode_254.output}};

for (const idx in vectors) {
    let metadata = {}
    metadata["content"] = texts[idx];
    metadata["title"] = {{variablesNode_954.output.title}};
    metadata["source"] = {{variablesNode_954.output.source}};
    metadataProps.push(metadata);
}

output = {"metadata": metadataProps, "vectors": vectors}
