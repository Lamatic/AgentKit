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

// Node's crypto module is available in the Lamatic Code node runtime;
// declared here only so the editor/TS language server recognizes it
// (no @types/node in this project, so we keep this loosely typed).
declare function require(module: string): any
const { createHash } = require("crypto")

// Deterministic, collision-resistant ID: a SHA-256 digest of the canonical
// name/content pair, with the existing human-readable name-based prefix
// preserved so IDs stay legible while avoiding 32-bit hash collisions.
function stableId(name: string, content: string) {
  const canonical = String(name) + "|" + String(content)
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex")
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + digest
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