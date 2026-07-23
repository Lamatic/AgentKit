// Mustache placeholders are substituted as raw text by the platform before this
// code runs, so they must be wrapped in quotes (as every other node in this kit
// does, e.g. "queryField": "{{triggerNode_1.output.message}}") — otherwise the
// substituted value produces invalid syntax, and "batch" never becomes a real
// array to iterate over.
let single_name = "{{triggerNode_1.output.pattern_name}}"
let single_content = "{{triggerNode_1.output.content}}"
let batchRaw = "{{triggerNode_1.output.patterns}}"

let batch = null
try {
  const parsed = JSON.parse(batchRaw)
  if (Array.isArray(parsed)) {
    batch = parsed
  }
} catch (e) {
  batch = null
}

// Simple deterministic hash so records get a stable, collision-resistant ID
// even when two patterns share the same pattern_name.
function stableId(name, content) {
  let hash = 5381
  const str = String(name) + "|" + String(content)
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0
  }
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + hash.toString(36)
}

let vectorData = []
let metaData = []

if (batch && batch.length > 0) {
  for (let p of batch) {
    vectorData.push("pattern: " + p.pattern_name + " | details: " + p.content)
    metaData.push({
      id: stableId(p.pattern_name, p.content),
      pattern_name: p.pattern_name,
      content: p.content
    })
  }
} else if (single_name && single_name !== "undefined" && single_content && single_content !== "undefined") {
  vectorData.push("pattern: " + single_name + " | details: " + single_content)
  metaData.push({
    id: stableId(single_name, single_content),
    pattern_name: single_name,
    content: single_content
  })
} else {
  throw new Error("No valid input: provide either {pattern_name, content} or {patterns: [...]}")
}

output = { vectorData: vectorData, metaData: metaData }