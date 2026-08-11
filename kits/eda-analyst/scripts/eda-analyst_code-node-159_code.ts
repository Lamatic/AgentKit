// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.


const rows = {{codeNode_458.output.rows}};
const tasks = {{codeNode_443.output.tasks}};

function _num(v){ if(v===null||v===undefined) return NaN; const s=String(v).trim(); if(s==="") return NaN; return Number(s); }
function _round(n,d){ if(n===null||n===undefined||!isFinite(n)) return n; const f=Math.pow(10,d===undefined?4:d); return Math.round(n*f)/f; }
function _present(v){ return v!=="" && v!==null && v!==undefined; }
function _quantile(sorted,p){ if(!sorted.length) return null; const idx=(sorted.length-1)*p, lo=Math.floor(idx), hi=Math.ceil(idx); if(lo===hi) return sorted[lo]; return sorted[lo]+(sorted[hi]-sorted[lo])*(idx-lo); }

function _distribution(rows,task){
  const col=task.column; const raw=[]; for(let i=0;i<rows.length;i++) if(_present(rows[i][col])) raw.push(rows[i][col]);
  const nums=[]; for(let i=0;i<raw.length;i++){ const n=_num(raw[i]); if(!isNaN(n)&&isFinite(n)) nums.push(n); }
  const numericRatio=raw.length?nums.length/raw.length:0;
  if(numericRatio>=0.9&&nums.length){ nums.sort(function(a,b){return a-b;}); const minV=nums[0],maxV=nums[nums.length-1];
    const uniq={}; for(let i=0;i<nums.length;i++) uniq[nums[i]]=1; const bins=Math.min(12,Math.max(1,Object.keys(uniq).length)), width=(maxV-minV)||1, counts=[];
    for(let b=0;b<bins;b++) counts.push(0);
    for(let i=0;i<nums.length;i++){ let bi=Math.floor(((nums[i]-minV)/width)*bins); if(bi>=bins)bi=bins-1; if(bi<0)bi=0; counts[bi]++; }
    const labels=counts.map(function(c,b){ return _round(minV+(width/bins)*b,2)+"–"+_round(minV+(width/bins)*(b+1),2); });
    let s=0; for(let i=0;i<nums.length;i++) s+=nums[i]; const mean=s/nums.length;
    return { method:"distribution", chart:{type:"bar",labels:labels,data:counts}, title:"Distribution of "+col,
      summary: col+" ranges "+_round(minV,2)+"–"+_round(maxV,2)+", mean "+_round(mean,2)+", median "+_round(_quantile(nums,0.5),2)+" (n="+nums.length+")." }; }
  const freq={}; for(let i=0;i<raw.length;i++){ const k=String(raw[i]); freq[k]=(freq[k]||0)+1; }
  const pairs=Object.keys(freq).map(function(k){return {value:k,count:freq[k]};}).sort(function(a,b){return b.count-a.count;}).slice(0,12);
  const top=pairs[0]||{value:"—",count:0};
  return { method:"distribution", chart:{type:"bar",labels:pairs.map(function(p){return p.value;}),data:pairs.map(function(p){return p.count;})},
    title:col+" counts", summary: col+" has "+Object.keys(freq).length+" distinct values; most common is \""+top.value+"\" ("+top.count+")." };
}
function _compare(rows,task){
  const g=task.groupBy, m=task.measure, agg=(task.agg||"mean").toLowerCase(); const groups={};
  for(let i=0;i<rows.length;i++){ if(!_present(rows[i][g])) continue; const key=String(rows[i][g]);
    if(!groups[key]) groups[key]={sum:0,n:0,cnt:0}; groups[key].cnt++;
    if(agg!=="count"){ const v=_num(rows[i][m]); if(!isNaN(v)&&isFinite(v)){ groups[key].sum+=v; groups[key].n++; } } }
  let keys=Object.keys(groups);
  if(!keys.length) return { method:"compare", chart:null, title:(agg==="count"?"count":agg+" of "+m)+" by "+g, summary:"No groups found for "+g+"." };
  const valOf=function(k){ const gr=groups[k]; if(agg==="count") return gr.cnt; if(agg==="sum") return gr.sum; return gr.n?gr.sum/gr.n:0; };
  keys.sort(function(a,b){return valOf(b)-valOf(a);}); if(keys.length>20) keys=keys.slice(0,20);
  const data=keys.map(function(k){return _round(valOf(k),3);});
  const chartType=(keys.length<=6&&agg!=="mean")?"pie":"bar"; const label=agg==="count"?"count":agg+" of "+m;
  return { method:"compare", chart:{type:chartType,labels:keys,data:data}, title:label+" by "+g,
    summary: label+" by "+g+": highest \""+keys[0]+"\" ("+data[0]+"), lowest \""+keys[keys.length-1]+"\" ("+data[data.length-1]+")." };
}
function _relationship(rows,task){
  const x=task.x, y=task.y, xs=[], ys=[];
  for(let i=0;i<rows.length;i++){ const vx=_num(rows[i][x]), vy=_num(rows[i][y]); if(!isNaN(vx)&&isFinite(vx)&&!isNaN(vy)&&isFinite(vy)){ xs.push(vx); ys.push(vy); } }
  const n=xs.length; if(n<3) return { method:"relationship", chart:null, title:x+" vs "+y, summary:"Not enough numeric pairs to correlate "+x+" and "+y+"." };
  let sx=0,sy=0; for(let i=0;i<n;i++){sx+=xs[i];sy+=ys[i];} const mx=sx/n,my=sy/n; let cov=0,dx=0,dy=0;
  for(let i=0;i<n;i++){cov+=(xs[i]-mx)*(ys[i]-my);dx+=(xs[i]-mx)*(xs[i]-mx);dy+=(ys[i]-my)*(ys[i]-my);}
  const dn=Math.sqrt(dx*dy), r=dn?cov/dn:0; const pts=[]; const step=Math.max(1,Math.floor(n/200)); for(let i=0;i<n;i+=step) pts.push({x:xs[i],y:ys[i]});
  const strength=Math.abs(r)>=0.5?"strong":Math.abs(r)>=0.3?"moderate":"weak";
  return { method:"relationship", chart:{type:"scatter",x:x,y:y,points:pts}, title:x+" vs "+y,
    summary: strength+(r<0?" negative":" positive")+" correlation between "+x+" and "+y+" (r="+_round(r,3)+", n="+n+")." };
}
function _quality(rows,task){
  const col=task.column, action=task.action||"flag"; let missing=0;
  for(let i=0;i<rows.length;i++){ if(!_present(rows[i][col])) missing++; }
  const pct=rows.length?_round(100*missing/rows.length,2):0;
  return { method:"quality", chart:null, title:"Data quality: "+col, summary: col+" has "+missing+" missing ("+pct+"%). Recommended action: "+action+"." };
}
function runAnalysis(rows,task){
  if(!task||!task.method) return {method:"none",summary:"No task.",chart:null};
  switch(task.method){ case "distribution": return _distribution(rows,task); case "compare": return _compare(rows,task);
    case "relationship": return _relationship(rows,task); case "quality": return _quality(rows,task);
    default: return {method:task.method,summary:"Unknown method: "+task.method,chart:null}; }
}

const findings = [];
for (let i = 0; i < (tasks || []).length; i++) { const t = tasks[i];
  try { const f = runAnalysis(rows, t); if (t.title) f.title = t.title; f.reason = t.reason || ""; findings.push(f); }
  catch (e) { findings.push({ method: t.method, title: t.title || "Error", reason: t.reason || "", error: String(e), summary: "Error: " + String(e), chart: null }); } }
output = { findings: findings };