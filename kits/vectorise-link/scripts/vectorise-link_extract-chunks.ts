let docs = {{ chunkNode_967.output.chunks }}

let outputDocs = docs.map((doc) => doc.pageContent)

return outputDocs