// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const batchOut = {{batchEndNode_630.output.batchOutput}};        // (x) → the Batch's collected output (array, one per chunk)
const chunker  = {{codeNode_773.output}};  // (x) → Chunker node

function extractCols(it) {
  if (!it) return [];
  if (Array.isArray(it.columns)) return it.columns;                 // { columns:[...] }
  if (it.output && Array.isArray(it.output.columns)) return it.output.columns; // { output:{columns} }
  for (const k in it) { const v = it[k];                            // { InstructorLLMNode_400:{output:{columns}} }
    if (v && v.output && Array.isArray(v.output.columns)) return v.output.columns;
    if (v && Array.isArray(v.columns)) return v.columns; }
  return [];
}

const arr = Array.isArray(batchOut) ? batchOut : [batchOut];
let allCols = [];
for (let i = 0; i < arr.length; i++) allCols = allCols.concat(extractCols(arr[i]));

const ch = chunker || {};
output = { dedupe: ch.dedupe, dedupeReason: ch.dedupeReason, columns: allCols };