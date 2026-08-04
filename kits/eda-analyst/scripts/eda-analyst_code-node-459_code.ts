// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const tasks = {{InstructorLLMNode_740.output.tasks}};
const profile = {{codeNode_458.output.profile}};

function _colMap(p){ const m={}; const c=(p&&p.columns)||[]; for(let i=0;i<c.length;i++) m[c[i].name]=c[i]; return m; }
function _isNum(c){ return c && c.type==="numeric"; }
function _cat(c){ return c && (c.type==="categorical"||c.type==="boolean"||(c.type==="numeric"&&c.cardinality<=20)); }
// AUTHORITATIVE, reason-returning task validator. A boolean mirror lives in
// scripts/eda-analyst_code-node-443_code.ts (MergeInsights). Keep the two in sync.
function validateTask(t,m){
  if(!t||!t.method) return {ok:false,why:"no method"};
  if(t.method==="distribution"){ const c=m[t.column]; if(!c) return {ok:false,why:"distribution: unknown column "+t.column}; if(c.isLikelyId) return {ok:false,why:"distribution: ID-like "+t.column}; return {ok:true}; }
  if(t.method==="compare"){ const g=m[t.groupBy], me=m[t.measure], agg=(t.agg||"").toLowerCase();
    if(!g) return {ok:false,why:"compare: unknown groupBy "+t.groupBy}; if(!_cat(g)) return {ok:false,why:"compare: groupBy "+t.groupBy+" not low-cardinality"};
    if(agg!=="count"){ if(!me) return {ok:false,why:"compare: unknown measure "+t.measure}; if(!(_isNum(me)||me.type==="boolean")) return {ok:false,why:"compare: measure "+t.measure+" not numeric/boolean"}; }
    if(["mean","sum","count"].indexOf(agg)===-1) return {ok:false,why:"compare: bad agg "+t.agg}; return {ok:true}; }
  if(t.method==="relationship"){ const x=m[t.x], y=m[t.y]; if(!x||!y) return {ok:false,why:"relationship: unknown column(s)"}; if(!_isNum(x)||!_isNum(y)) return {ok:false,why:"relationship: "+t.x+"/"+t.y+" must be numeric"}; if(t.x===t.y) return {ok:false,why:"relationship: x==y"}; return {ok:true}; }
  if(t.method==="quality"){ const c=m[t.column]; if(!c) return {ok:false,why:"quality: unknown column "+t.column}; return {ok:true}; }
  return {ok:false,why:"unknown method "+t.method};
}
function validateInsightPlan(tasks, profile){
  const m=_colMap(profile); const valid=[], dropped=[];
  for(let i=0;i<(tasks||[]).length;i++){ const r=validateTask(tasks[i],m); if(r.ok) valid.push(tasks[i]); else dropped.push({task:tasks[i],why:r.why}); }
  const have={distribution:0,compare:0,relationship:0,quality:0};
  for(let i=0;i<valid.length;i++) have[valid[i].method]=(have[valid[i].method]||0)+1;
  const missing=[]; if(!have.distribution) missing.push("distribution"); if(!have.compare) missing.push("compare"); if(!have.relationship) missing.push("relationship");
  const replanNeeded = missing.length>0 || valid.length<3 || dropped.length>0;
  let critique="";
  if(replanNeeded){ const parts=[]; if(missing.length) parts.push("missing method(s): "+missing.join(", ")); if(dropped.length) parts.push(dropped.length+" invalid task(s) dropped ("+dropped.map(function(d){return d.why;}).join("; ")+")"); if(valid.length<3) parts.push("too few valid tasks ("+valid.length+")"); critique="Fix the plan: "+parts.join("; ")+". Propose ONLY additional valid tasks to fill these gaps using exact column names."; }
  return { validTasks:valid, dropped:dropped, coverage:have, replanNeeded:replanNeeded, critique:critique, replanPayload: replanNeeded ? [{critique:critique, existingTitles: valid.map(function(t){return t.title;})}] : [] };
}
output = validateInsightPlan(tasks, profile);