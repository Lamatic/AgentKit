// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.


const rows = {{codeNode_579.output.rows}};

function buildProfile(files) {
  const rows = (files && files[0] && Array.isArray(files[0].data)) ? files[0].data : [];
  const meta = (files && files[0] && files[0].metadata) ? files[0].metadata : {};
  const rowCount = rows.length;
  const colSet = {};
  for (let i = 0; i < rows.length; i++) { for (const k in rows[i]) colSet[k] = true; }
  const columns = Object.keys(colSet);
  const seen = {};
  let duplicateRows = 0;
  for (let i = 0; i < rows.length; i++) {
    const parts = [];
    for (let c = 0; c < columns.length; c++) {
      const v = rows[i][columns[c]];
      parts.push((v !== undefined && v !== null) ? String(v) : "");
    }
    const key = parts.join("");
    if (seen[key]) duplicateRows++; else seen[key] = 1;
  }
  const toNum = function (v) { if (v === null || v === undefined) return NaN; const s = String(v).trim(); if (s === "") return NaN; return Number(s); };
  const quantile = function (sorted, p) { if (sorted.length === 0) return null; const idx = (sorted.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return sorted[lo]; return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo); };
  const round = function (n, d) { if (n === null || !isFinite(n)) return n; const f = Math.pow(10, d === undefined ? 4 : d); return Math.round(n * f) / f; };
  const BOOL_SETS = [["0","1"],["true","false"],["yes","no"],["y","n"],["t","f"]];
  const numericSeries = {};
  const columnProfiles = columns.map(function (col) {
    const values = []; let missing = 0;
    for (let i = 0; i < rows.length; i++) { const v = rows[i][col]; if (v !== "" && v !== null && v !== undefined) values.push(v); else missing++; }
    const count = values.length;
    const freq = {}; for (let i = 0; i < values.length; i++) { const k = String(values[i]); freq[k] = (freq[k] || 0) + 1; }
    const distinct = Object.keys(freq); const cardinality = distinct.length;
    const nums = []; for (let i = 0; i < values.length; i++) { const n = toNum(values[i]); if (!isNaN(n) && isFinite(n)) nums.push(n); }
    const numericRatio = count > 0 ? nums.length / count : 0;
    let isBoolean = false;
    if (cardinality > 0 && cardinality <= 2) { const low = distinct.map(function (d){return d.toLowerCase();}); for (let b=0;b<BOOL_SETS.length;b++){ if(low.every(function(d){return BOOL_SETS[b].indexOf(d)!==-1;})){isBoolean=true;break;} } }
    let type;
    if (isBoolean) type = "boolean";
    else if (numericRatio >= 0.9 && count > 0) type = "numeric";
    else if (cardinality > 0 && cardinality <= Math.max(20, count * 0.05)) type = "categorical";
    else type = "text";
    const isLikelyId = cardinality === count && count > 1 && (/(^|_|\b)id$/i.test(col) || type === "numeric" || type === "text");
    const p = { name: col, type: type, isLikelyId: isLikelyId, count: count, missing: missing, missingPct: rowCount > 0 ? round(100*missing/rowCount,2) : 0, cardinality: cardinality, sample: values.slice(0,3) };
    if (type === "numeric" && nums.length > 0) {
      const sorted = nums.slice().sort(function(a,b){return a-b;});
      const sum = sorted.reduce(function(a,b){return a+b;},0), mean = sum/sorted.length;
      const q1 = quantile(sorted,0.25), median = quantile(sorted,0.5), q3 = quantile(sorted,0.75);
      let varSum = 0; for (let i=0;i<sorted.length;i++) varSum += (sorted[i]-mean)*(sorted[i]-mean);
      const std = Math.sqrt(varSum/sorted.length), iqr = q3-q1, lo = q1-1.5*iqr, hi = q3+1.5*iqr;
      let outliers = 0; for (let i=0;i<sorted.length;i++) if (sorted[i]<lo||sorted[i]>hi) outliers++;
      p.stats = { min: round(sorted[0]), max: round(sorted[sorted.length-1]), mean: round(mean), median: round(median), std: round(std), q1: round(q1), q3: round(q3), outliers: outliers };
      const minV = sorted[0], maxV = sorted[sorted.length-1], bins = Math.min(10, Math.max(1, cardinality)), width = (maxV-minV)||1, hist = [];
      for (let b=0;b<bins;b++) hist.push(0);
      for (let i=0;i<sorted.length;i++){ let bi=Math.floor(((sorted[i]-minV)/width)*bins); if(bi>=bins)bi=bins-1; if(bi<0)bi=0; hist[bi]++; }
      p.histogram = hist.map(function(c,b){ const start=minV+(width/bins)*b, end=minV+(width/bins)*(b+1); return {label: round(start,2)+"–"+round(end,2), count:c}; });
      if (!isLikelyId) numericSeries[col] = nums;
    }
    if (type === "categorical" || type === "boolean") {
      p.topValues = distinct.map(function(v){return {value:v,count:freq[v]};}).sort(function(a,b){return b.count-a.count;}).slice(0,10);
    }
    return p;
  });
  const numCols = Object.keys(numericSeries); const correlations = [];
  for (let a=0;a<numCols.length;a++){ for (let b=a+1;b<numCols.length;b++){
    const ca=numCols[a], cb=numCols[b], xs=[], ys=[];
    for (let i=0;i<rows.length;i++){ const va=toNum(rows[i][ca]), vb=toNum(rows[i][cb]); if(!isNaN(va)&&isFinite(va)&&!isNaN(vb)&&isFinite(vb)){xs.push(va);ys.push(vb);} }
    const n=xs.length; if(n<3) continue;
    let sx=0,sy=0; for(let i=0;i<n;i++){sx+=xs[i];sy+=ys[i];} const mx=sx/n,my=sy/n;
    let num2=0,dx=0,dy=0; for(let i=0;i<n;i++){num2+=(xs[i]-mx)*(ys[i]-my);dx+=(xs[i]-mx)*(xs[i]-mx);dy+=(ys[i]-my)*(ys[i]-my);}
    const denom=Math.sqrt(dx*dy); if(denom===0) continue;
    correlations.push({a:ca,b:cb,r:round(num2/denom,3)});
  }}
  correlations.sort(function(u,v){return Math.abs(v.r)-Math.abs(u.r);});
  let totalCells = rowCount*columns.length, missingCells = 0;
  for (let i=0;i<columnProfiles.length;i++) missingCells += columnProfiles[i].missing;
  return {
    dataset: { rowCount: rowCount, columnCount: columns.length, duplicateRows: duplicateRows, missingCells: missingCells, missingPct: totalCells>0?round(100*missingCells/totalCells,2):0, filename: meta.filename||null,
      numericColumns: columnProfiles.filter(function(c){return c.type==="numeric";}).map(function(c){return c.name;}),
      categoricalColumns: columnProfiles.filter(function(c){return c.type==="categorical"||c.type==="boolean";}).map(function(c){return c.name;}) },
    columns: columnProfiles, correlations: correlations.slice(0,15)
  };
}

output = buildProfile([{ metadata: {}, data: rows }]);