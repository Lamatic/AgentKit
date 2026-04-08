// Code: Transform Metadata
// Flow: onedrive

let vectors = {{vectorizeNode_639.output.vectors}}
let metadataProps = [];
let texts = {{codeNode_254.output}};

for (const idx in vectors) {
    let metadata = {}
    metadata["content"] = texts[idx];
    metadata["title"] = {{variablesNode_289.output.title}};
    metadata["source"] = {{variablesNode_289.output.source}};
    metadata["last_modified"] = {{variablesNode_289.output.last_modified}};
    
    metadataProps.push(metadata);
}

output = {"metadata": metadataProps, "vectors": vectors}
