let docs =  {{chunkNode_318.output.chunks}}

let outputDocs = docs.map(doc => doc.pageContent);
output = outputDocs;