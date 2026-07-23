// Lamatic Code node scripts read upstream values through the runtime `workflow`
// object (workflow.<nodeId>.output.<field>) — Mustache expressions inside the
// script body resolve to literal path strings, not substituted values.
// `workflow` and `output` are injected by the Lamatic runtime at execution
// time; declared here only so the editor/TS language server recognizes them.
declare const workflow: any
declare let output: any

const input = workflow.triggerNode_1.output
const single_name = input.pattern_name
const single_content = input.content
const batch = Array.isArray(input.patterns) ? input.patterns : null

// Simple deterministic hash so records get a stable, collision-resistant ID
// even when two patterns share the same pattern_name.
function stableId(name: string, content: string) {
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
} else if (single_name && single_content) {
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