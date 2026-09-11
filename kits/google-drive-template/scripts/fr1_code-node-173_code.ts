// Assign the value you want to return from this code node to `output`.
// The `output` variable is already declared.

let docs =  {{chunkNode_411.output.chunks}}

let outputDocs = docs.map(doc => doc.pageContent);

output = outputDocs;