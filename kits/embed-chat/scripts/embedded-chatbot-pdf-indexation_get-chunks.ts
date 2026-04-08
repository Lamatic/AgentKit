// Code: Get Chunks
// Flow: embedded-chatbot-pdf-indexation

let docs =  {{chunkNode_318.output.chunks}}

let outputDocs = docs.map(doc => doc.pageContent);
console.log(outputDocs)
output = outputDocs;
