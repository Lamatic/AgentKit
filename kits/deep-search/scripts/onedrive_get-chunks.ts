// Code: Get Chunks
// Flow: onedrive

let docs =  {{chunkNode_318.output.chunks}}

let outputDocs = docs.map(doc => doc.pageContent);
console.log(outputDocs)
output = outputDocs;
