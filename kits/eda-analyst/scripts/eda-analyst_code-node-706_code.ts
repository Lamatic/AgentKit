// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const findings = {{codeNode_159.output.findings}};
function findingsGate(findings){
  const out=[]; const dropped=[];
  for(let i=0;i<(findings||[]).length;i++){ const f=findings[i]; if(!f) continue;
    if(f.error){ dropped.push({title:f.title,why:f.error}); continue; }
    if(!f.chart){ out.push(f); continue; }
    const ch=f.chart; let ok=true, why="";
    if(ch.type==="scatter"){ if(!ch.points||!ch.points.length){ ok=false; why="empty scatter"; } }
    else { const d=ch.data||[]; if(!d.length){ ok=false; why="empty chart"; } else if(!d.every(function(v){return typeof v==="number"&&isFinite(v);})){ ok=false; why="non-finite data"; } }
    if(ok) out.push(f); else dropped.push({title:f.title,why:why}); }
  return { findings: out, dropped: dropped, note: dropped.length ? (dropped.length+" finding(s) rejected by gate.") : "All findings valid." };
}
output = findingsGate(findings);