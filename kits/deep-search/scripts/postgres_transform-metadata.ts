// Code: Transform Metadata
// Flow: postgres

let vectors = {{vectorizeNode_177.output.vectors}};
let metadataProps = [];

let metadata = {}
metadata["title"] = {{ variablesNode_543.output.title }};
metadata["content"] = {{ codeNode_331.output }}[0]
metadata["source"] = {{ variablesNode_543.output.source }};

metadataProps.push(metadata)

console.log("finaldata:", {"metadata": metadataProps, "vectors": vectors});
output = {"metadata": metadataProps, "vectors": vectors}
