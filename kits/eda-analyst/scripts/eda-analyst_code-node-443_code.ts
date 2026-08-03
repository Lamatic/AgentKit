// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.


const validTasks = {{codeNode_459.output.validTasks}};
const replanResults = {{batchEndNode_210.output.batchOutput}};
const profile = {{codeNode_458.output.profile}};

function _colMap(p){ const m={}; const c=(p&&p.columns)||[]; for(let i=0;i<c.length;i++) m[c[i].name]=c[i]; return m; }
function _isNum(c){ return c && c.type==="numeric"; }
function _cat(c){ return c && (c.type==="categorical"||c.type==="boolean"||(c.type==="numeric"&&c.cardinality<=20)); }
function validateTask(t,m){
  if(!t||!t.method) return false;
  if(t.method==="distribution"){ const c=m[t.column]; return !!c && !c.isLikelyId; }
  if(t.method==="compare"){ const g=m[t.groupBy], me=m[t.measure], agg=(t.agg||"").toLowerCase(); if(!g||!_cat(g)) return false; if(agg!=="count" && !(me&&(_isNum(me)||me.type==="boolean"))) return false; return ["mean","sum","count"].indexOf(agg)!==-1; }
  if(t.method==="relationship"){ const x=m[t.x], y=m[t.y]; return !!x&&!!y&&_isNum(x)&&_isNum(y)&&t.x!==t.y; }
  if(t.method==="quality"){ return !!m[t.column]; }
  return false;
}
function mergeInsightTasks(validTasks, replanResults, profile){
  const m=_colMap(profile); const seen={}; const out=[];
  const add=function(t){ if(!validateTask(t,m)) return; const key=(t.method||"")+"|"+(t.column||"")+"|"+(t.groupBy||"")+"|"+(t.measure||"")+"|"+(t.x||"")+"|"+(t.y||""); if(seen[key]) return; seen[key]=1; out.push(t); };
  for(let i=0;i<(validTasks||[]).length;i++) add(validTasks[i]);
  const arr=Array.isArray(replanResults)?replanResults:[];
  for(let i=0;i<arr.length;i++){ const r=arr[i]; let tasks=null;
    if(r&&r.tasks) tasks=r.tasks; else if(r&&r.output&&r.output.tasks) tasks=r.output.tasks;
    else { for(const k in r){ const v=r[k]; if(v&&v.output&&v.output.tasks){tasks=v.output.tasks;break;} if(v&&v.tasks){tasks=v.tasks;break;} } }
    if(tasks) for(let j=0;j<tasks.length;j++) add(tasks[j]); }
  return { tasks: out };
}
output = mergeInsightTasks(validTasks, replanResults, profile);