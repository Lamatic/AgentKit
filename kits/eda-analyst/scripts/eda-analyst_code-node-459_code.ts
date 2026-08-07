// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const tasks = {{InstructorLLMNode_740.output.tasks}};
const profile = {{codeNode_458.output.profile}};

function _colMap(p){ const m={}; const c=(p&&p.columns)||[]; for(let i=0;i<c.length;i++) m[c[i].name]=c[i]; return m; }
function _isNum(c){ return c && c.type==="numeric"; }
// A usable compare groupBy must be low cardinality (<=20 distinct), since the
// profiler labels columns "categorical" up to max(20, 5% of rows) which can be
// far too many groups for a meaningful comparison.
function _cat(c){ return c && (c.type==="categorical"||c.type==="boolean"||c.type==="numeric") && c.cardinality<=20; }
// Which method mix the schema can actually support, so we never demand an
// impossible task (compare needs a low-cardinality column; relationship needs
// two eligible numeric columns). Plan-level check; not part of the 443 mirror.
function _planCapabilities(p){
  const cols=(p&&p.columns)||[]; let numeric=0, hasCat=false, analyzable=0;
  for(let i=0;i<cols.length;i++){ const c=cols[i]; if(!c||c.isLikelyId) continue; analyzable++; if(_isNum(c)) numeric++; if(_cat(c)) hasCat=true; }
  return { distribution: analyzable>=1, compare: hasCat, relationship: numeric>=2, analyzable: analyzable };
}
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
  const caps=_planCapabilities(profile);
  const missing=[]; if(caps.distribution&&!have.distribution) missing.push("distribution"); if(caps.compare&&!have.compare) missing.push("compare"); if(caps.relationship&&!have.relationship) missing.push("relationship");
  // Cap the target at what the schema can structurally yield (one distribution
  // per analyzable column, plus a compare/relationship when supported) so a
  // sparse profile terminates with its valid smaller plan instead of looping.
  const target = Math.min(3, caps.analyzable + (caps.compare?1:0) + (caps.relationship?1:0));
  const replanNeeded = missing.length>0 || valid.length<target || dropped.length>0;
  let critique="";
  if(replanNeeded){ const parts=[]; if(missing.length) parts.push("missing method(s): "+missing.join(", ")); if(dropped.length) parts.push(dropped.length+" invalid task(s) dropped ("+dropped.map(function(d){return d.why;}).join("; ")+")"); if(valid.length<target) parts.push("too few valid tasks ("+valid.length+" of "+target+")"); critique="Fix the plan: "+parts.join("; ")+". Propose ONLY additional valid tasks to fill these gaps using exact column names."; }
  return { validTasks:valid, dropped:dropped, coverage:have, replanNeeded:replanNeeded, critique:critique, replanPayload: replanNeeded ? [{critique:critique, existingTitles: valid.map(function(t){return t.title;})}] : [] };
}
output = validateInsightPlan(tasks, profile);