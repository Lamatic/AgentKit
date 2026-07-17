const data = {{codeNode_951.output.raw_data}};
const cols = {{codeNode_951.output.columns}};
const types = {{codeNode_183.output.column_types}};

let stats = {};
let outliers = {};
let relationships = [];
let numCols = cols.filter(c => types[c].type === "NUMBER");

// 1. Descriptive Stats & IQR Outliers
numCols.forEach(c => {
  let vals = data
    .map(r => r[c])
    .filter(v => v !== null && v !== undefined && v.toString().trim() !== '')
    .map(v => Number(v))
    .filter(v => !isNaN(v));
  if (vals.length === 0) return;
  vals.sort((a,b) => a-b);
  
  let min = vals[0], max = vals[vals.length-1];
  let q1 = vals[Math.floor(vals.length * 0.25)];
  let q3 = vals[Math.floor(vals.length * 0.75)];
  let iqr = q3 - q1;
  let lower = q1 - 1.5 * iqr;
  let upper = q3 + 1.5 * iqr;
  
  let outlierCnt = vals.filter(v => v < lower || v > upper).length;
  stats[c] = { min, max, q1, q3, iqr };
  if (outlierCnt > 0) outliers[c] = { lower, upper, count: outlierCnt, pct: (outlierCnt/vals.length)*100 };
});

// 2. Pearson Correlation Matrix
for (let i = 0; i < numCols.length; i++) {
  for (let j = i+1; j < numCols.length; j++) {
    let c1 = numCols[i], c2 = numCols[j];
    let sum1=0, sum2=0, sum1Sq=0, sum2Sq=0, pSum=0, n=0;
    data.forEach(r => {
      let val1 = r[c1], val2 = r[c2];
      if (
        val1 !== null && val1 !== undefined && val1.toString().trim() !== '' &&
        val2 !== null && val2 !== undefined && val2.toString().trim() !== ''
      ) {
        let x = Number(val1), y = Number(val2);
        if (!isNaN(x) && !isNaN(y)) {
          sum1 += x; sum2 += y;
          sum1Sq += x*x; sum2Sq += y*y;
          pSum += x*y;
          n++;
        }
      }
    });
    if (n > 0) {
      let num = pSum - (sum1*sum2/n);
      let den = Math.sqrt((sum1Sq - sum1*sum1/n) * (sum2Sq - sum2*sum2/n));
      if (den !== 0) {
        let r = num / den;
        if (Math.abs(r) > 0.85) {
          relationships.push({ col1: c1, col2: c2, type: "HIGH_CORRELATION", score: r.toFixed(2) });
        }
      }
    }
  }
}

output = { stats, outliers, relationships };
