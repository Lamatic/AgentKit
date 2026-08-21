let docs = {{ chunkNode_968.output.chunks }};

let outputDocs = (docs || []).map((doc) => doc.pageContent);

output = outputDocs;