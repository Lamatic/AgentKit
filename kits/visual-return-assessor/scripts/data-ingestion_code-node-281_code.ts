// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const chunks = {{chunkNode_419.output.chunks}}

if(!Array.isArray(chunks) || chunks.length === 0){
  throw new Error("Policy chunks are empty")
}

output = chunks.map((x) => x.pageContent)