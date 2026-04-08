// Code: Extract Chunks
// Flow: scraping-indexation

let docs = {{ chunkNode_968.output.chunks }};

let outputDocs = docs.map((doc) => doc.pageContent)

return outputDocs
