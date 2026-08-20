// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const rows = {{codeNode_579.output.rows}};
const plan = {{codeNode_629.output}};

function _num(v){ if(v===null||v===undefined) return NaN; const s=String(v).trim(); if(s==="") return NaN; return Number(s); }
function _present(v){ return v!=="" && v!==null && v!==undefined; }
function _round(n,d){ if(n===null||n===undefined||!isFinite(n)) return n; const f=Math.pow(10,d===undefined?4:d); return Math.round(n*f)/f; }
function _quantile(sorted,p){ if(!sorted.length) return null; const idx=(sorted.length-1)*p, lo=Math.floor(idx), hi=Math.ceil(idx); if(lo===hi) return sorted[lo]; return sorted[lo]+(sorted[hi]-sorted[lo])*(idx-lo); }

function _computeImpute(rows, col, strat){
  const present=[]; for(let i=0;i<rows.length;i++){ const v=rows[i][col]; if(_present(v)) present.push(v); }
  if(strat==="mean"||strat==="median"){
    const nums=[]; for(let i=0;i<present.length;i++){ const n=_num(present[i]); if(!isNaN(n)&&isFinite(n)) nums.push(n); }
    if(!nums.length) return null;
    if(strat==="mean"){ let s=0; for(let i=0;i<nums.length;i++) s+=nums[i]; return _round(s/nums.length,4); }
    nums.sort(function(a,b){return a-b;}); const m=Math.floor(nums.length/2);
    return nums.length%2 ? nums[m] : _round((nums[m-1]+nums[m])/2,4);
  }
  const freq={}; let best=null, bestC=0;
  for(let i=0;i<present.length;i++){ const k=String(present[i]); freq[k]=(freq[k]||0)+1; if(freq[k]>bestC){bestC=freq[k]; best=present[i];} }
  return best;
}

function applyCleaning(rows, plan){
  rows=rows||[]; plan=plan||{}; const colPlans=plan.columns||[]; const changelog=[]; const dropCols=[], dropReason={}, imputes={};
  for(let i=0;i<colPlans.length;i++){ const cp=colPlans[i];
    if(cp.action==="drop"){ dropCols.push(cp.column); dropReason[cp.column]=cp.reason||""; }
    else if(cp.action==="impute"&&cp.impute) imputes[cp.column]=cp.impute; }
  const imputeVals={}; for(const col in imputes){ imputeVals[col]=_computeImpute(rows,col,imputes[col]); }
  const fillCount={};
  let cleaned=rows.map(function(r){ const o={};
    for(const k in r){ if(k==="__proto__"||k==="constructor"||k==="prototype") continue; if(dropCols.indexOf(k)===-1) o[k]=r[k]; }
    for(const col in imputeVals){ if(imputeVals[col]===null||imputeVals[col]===undefined) continue;
      if(!_present(o[col])){ o[col]=String(imputeVals[col]); fillCount[col]=(fillCount[col]||0)+1; } }
    return o; });
  if(String(plan.dedupe||"").toLowerCase()==="yes"){ const seen={}; const out=[]; let removed=0;
    for(let i=0;i<cleaned.length;i++){ const key=JSON.stringify(cleaned[i]); if(seen[key]) removed++; else { seen[key]=1; out.push(cleaned[i]); } }
    cleaned=out; changelog.push({target:"(rows)",action:"dedupe",detail:"Removed "+removed+" duplicate rows.",reason:plan.dedupeReason||""}); }
  for(const col in imputes){ let rsn=""; for(let i=0;i<colPlans.length;i++) if(colPlans[i].column===col) rsn=colPlans[i].reason||"";
    changelog.push({target:col,action:"impute",detail:imputes[col]+" = "+imputeVals[col]+"; filled "+(fillCount[col]||0)+" missing.",reason:rsn}); }
  for(let di=0;di<dropCols.length;di++){ const col=dropCols[di]; changelog.push({target:col,action:"drop",detail:"Dropped column.",reason:dropReason[col]}); }
  return { cleanedRows: cleaned, changelog: changelog };
}

// MIRROR of buildProfile — the authoritative copy is in
// scripts/eda-analyst_code-node-941_code.ts. Keep the two synchronized.
function buildProfile(files){
  const rows=(files&&files[0]&&Array.isArray(files[0].data))?files[0].data:[];
  const meta=(files&&files[0]&&files[0].metadata)?files[0].metadata:{}; const rowCount=rows.length;
  const colSet={}; for(let i=0;i<rows.length;i++){ for(const k in rows[i]) colSet[k]=true; } const columns=Object.keys(colSet);
  const seen={}; let duplicateRows=0;
  for(let i=0;i<rows.length;i++){ const parts=[]; for(let c=0;c<columns.length;c++){ const v=rows[i][columns[c]]; parts.push((v!==undefined&&v!==null)?String(v):""); } const key=parts.join(""); if(seen[key]) duplicateRows++; else seen[key]=1; }
  const BOOL_SETS=[["0","1"],["true","false"],["yes","no"],["y","n"],["t","f"]]; const numericSeries={};
  const columnProfiles=columns.map(function(col){
    const values=[]; let missing=0;
    for(let i=0;i<rows.length;i++){ const v=rows[i][col]; if(v!==""&&v!==null&&v!==undefined) values.push(v); else missing++; }
    const count=values.length; const freq={}; for(let i=0;i<values.length;i++){ const k=String(values[i]); freq[k]=(freq[k]||0)+1; }
    const distinct=Object.keys(freq); const cardinality=distinct.length;
    const nums=[]; for(let i=0;i<values.length;i++){ const n=_num(values[i]); if(!isNaN(n)&&isFinite(n)) nums.push(n); }
    const numericRatio=count>0?nums.length/count:0; let isBoolean=false;
    if(cardinality>0&&cardinality<=2){ const low=distinct.map(function(d){return d.toLowerCase();}); for(let b=0;b<BOOL_SETS.length;b++){ if(low.every(function(d){return BOOL_SETS[b].indexOf(d)!==-1;})){isBoolean=true;break;} } }
    let type; if(isBoolean) type="boolean"; else if(numericRatio>=0.9&&count>0) type="numeric"; else if(cardinality>0&&cardinality<=Math.max(20,count*0.05)) type="categorical"; else type="text";
    const allInteger=type==="numeric"&&nums.length>0&&nums.every(function(n){return Number.isInteger(n);});
    const isLikelyId=cardinality===count&&count>1&&(/(^|_|\b)id$/i.test(col)||type==="text"||allInteger);
    const p={name:col,type:type,isLikelyId:isLikelyId,count:count,missing:missing,missingPct:rowCount>0?_round(100*missing/rowCount,2):0,cardinality:cardinality,sample:values.slice(0,3)};
    if(type==="numeric"&&nums.length>0){ const sorted=nums.slice().sort(function(a,b){return a-b;}); let s=0; for(let i=0;i<sorted.length;i++) s+=sorted[i]; const mean=s/sorted.length;
      const q1=_quantile(sorted,0.25), median=_quantile(sorted,0.5), q3=_quantile(sorted,0.75); let vs=0; for(let i=0;i<sorted.length;i++) vs+=(sorted[i]-mean)*(sorted[i]-mean);
      const std=Math.sqrt(vs/sorted.length), iqr=q3-q1, lo=q1-1.5*iqr, hi=q3+1.5*iqr; let outliers=0; for(let i=0;i<sorted.length;i++) if(sorted[i]<lo||sorted[i]>hi) outliers++;
      p.stats={min:_round(sorted[0]),max:_round(sorted[sorted.length-1]),mean:_round(mean),median:_round(median),std:_round(std),q1:_round(q1),q3:_round(q3),outliers:outliers};
      const minV=sorted[0],maxV=sorted[sorted.length-1],bins=Math.min(10,Math.max(1,cardinality)),width=(maxV-minV)||1,hist=[]; for(let b=0;b<bins;b++) hist.push(0);
      for(let i=0;i<sorted.length;i++){ let bi=Math.floor(((sorted[i]-minV)/width)*bins); if(bi>=bins)bi=bins-1; if(bi<0)bi=0; hist[bi]++; }
      p.histogram=hist.map(function(c,b){ return {label:_round(minV+(width/bins)*b,2)+"–"+_round(minV+(width/bins)*(b+1),2),count:c}; });
      if(!isLikelyId) numericSeries[col]=nums; }
    if(type==="categorical"||type==="boolean"){ p.topValues=distinct.map(function(v){return {value:v,count:freq[v]};}).sort(function(a,b){return b.count-a.count;}).slice(0,10); }
    return p; });
  const numCols=Object.keys(numericSeries); const correlations=[];
  for(let a=0;a<numCols.length;a++){ for(let b=a+1;b<numCols.length;b++){ const ca=numCols[a],cb=numCols[b],xs=[],ys=[];
    for(let i=0;i<rows.length;i++){ const va=_num(rows[i][ca]),vb=_num(rows[i][cb]); if(!isNaN(va)&&isFinite(va)&&!isNaN(vb)&&isFinite(vb)){xs.push(va);ys.push(vb);} }
    const n=xs.length; if(n<3) continue; let sx=0,sy=0; for(let i=0;i<n;i++){sx+=xs[i];sy+=ys[i];} const mx=sx/n,my=sy/n; let nm=0,dx=0,dy=0;
    for(let i=0;i<n;i++){nm+=(xs[i]-mx)*(ys[i]-my);dx+=(xs[i]-mx)*(xs[i]-mx);dy+=(ys[i]-my)*(ys[i]-my);} const dnm=Math.sqrt(dx*dy); if(dnm===0) continue; correlations.push({a:ca,b:cb,r:_round(nm/dnm,3)}); } }
  correlations.sort(function(u,v){return Math.abs(v.r)-Math.abs(u.r);});
  let totalCells=rowCount*columns.length, missingCells=0; for(let i=0;i<columnProfiles.length;i++) missingCells+=columnProfiles[i].missing;
  return { dataset:{rowCount:rowCount,columnCount:columns.length,duplicateRows:duplicateRows,missingCells:missingCells,missingPct:totalCells>0?_round(100*missingCells/totalCells,2):0,filename:meta.filename||null,
    numericColumns:columnProfiles.filter(function(c){return c.type==="numeric";}).map(function(c){return c.name;}),
    categoricalColumns:columnProfiles.filter(function(c){return c.type==="categorical"||c.type==="boolean";}).map(function(c){return c.name;})},
    columns:columnProfiles, correlations:correlations.slice(0,15) };
}

const res = applyCleaning(rows, plan);
const profile = buildProfile([{ metadata: {}, data: res.cleanedRows }]);
output = { cleanedRows: res.cleanedRows, changelog: res.changelog, profile: profile };