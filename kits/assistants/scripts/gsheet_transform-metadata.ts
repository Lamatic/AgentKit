let vectors = {{vectorizeNode_177.output.vectors}};
let metadataProps = [];

let metadata = {}
metadata["title"] = {{ variablesNode_305.output.title }};
metadata["content"] = {{ codeNode_331.output }}[0]
metadata["source"] = {{ variablesNode_305.output.source }};

metadataProps.push(metadata)

console.log("finaldata:", {"metadata": metadataProps, "vectors": vectors});
output = {"metadata": metadataProps, "vectors": vectors}