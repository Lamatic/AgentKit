// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const profile = {{codeNode_941.output}};   // (x) → Profile node
function chunkProfile(profile, maxChars){
  maxChars = maxChars || 8000;
  const cols = (profile && profile.columns) || [];
  const ds = (profile && profile.dataset) || {};
  const lean = cols.map(function(c){ return {
    name:c.name, type:c.type, isLikelyId:c.isLikelyId, missingPct:c.missingPct,
    cardinality:c.cardinality, count:c.count, outliers: c.stats?c.stats.outliers:0,
    sample:(c.sample||[]).slice(0,2) }; });
  const chunks=[]; let cur=[], curLen=0;
  for(let i=0;i<lean.length;i++){ const l=JSON.stringify(lean[i]).length;
    if(cur.length && (curLen+l)>maxChars){ chunks.push(cur); cur=[]; curLen=0; }
    cur.push(lean[i]); curLen+=l; }
  if(cur.length) chunks.push(cur);
  const dedupe = (ds.duplicateRows>0)?"yes":"no";
  return { chunks:chunks, chunkCount:chunks.length, dedupe:dedupe,
    dedupeReason: dedupe==="yes"?("dataset has "+ds.duplicateRows+" exact duplicate rows"):"no exact duplicate rows detected",
    datasetSummary:{ rowCount:ds.rowCount, columnCount:ds.columnCount, missingPct:ds.missingPct } };
}
output = chunkProfile(profile, 8000);