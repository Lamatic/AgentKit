let single_name={{triggerNode_1.output.pattern_name}}
let single_content={{triggerNode_1.output.content}}
let batch={{triggerNode_1.output.patterns}}

let vectorData=[]
let metaData=[]

if (batch && Array.isArray(batch) && batch.length > 0) {
  for (let p of batch) {
    vectorData.push("pattern: "+p.pattern_name+" | details: "+p.content)
    metaData.push({pattern_name:p.pattern_name, content:p.content})
  }
} else if (single_name && single_content) {
  vectorData.push("pattern: "+single_name+" | details: "+single_content)
  metaData.push({pattern_name:single_name, content:single_content})
} else {
  throw new Error("No valid input: provide either {pattern_name, content} or {patterns: [...]}")
}

output={vectorData:vectorData,metaData:metaData}
