// Code: Extract Chunked Text
// Flow: gdrive

let docs =  {{chunkNode_934.output.chunks}};

let outputDocs = docs.map(doc => doc.pageContent);

output = outputDocs;
