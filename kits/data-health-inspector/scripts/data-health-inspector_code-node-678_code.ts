const data = {{codeNode_951.output.raw_data}};
const cols = {{codeNode_951.output.columns}};
const types = {{codeNode_183.output.column_types}};
const rowCount = {{codeNode_951.output.row_count}};

let completeness = [];
let uniqueness = [];
let validity = [];

let exactDupes = 0;
let rowHashes = new Set();
data.forEach(r => {
  let h = JSON.stringify(r);
  if (rowHashes.has(h)) exactDupes++; else rowHashes.add(h);
});

const isValidDate = (str) => {
  const s = str.trim();
  if (!/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})$/.test(s)) return false;
  const parts = s.split(/[-/]/).map(Number);
  let y, m, d;
  if (parts[0] > 1000) { y = parts[0]; m = parts[1]; d = parts[2]; }
  else if (parts[0] > 12) { d = parts[0]; m = parts[1]; y = parts[2]; }
  else { m = parts[0]; d = parts[1]; y = parts[2]; }
  const dateObj = new Date(y, m - 1, d);
  return dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d;
};

cols.forEach(c => {
  let missing = 0, invalid = 0;
  let freqs = {};
  
  data.forEach(r => {
    let val = r[c];
    let isMissing = val === null || val === undefined || val.toString().trim() === '';
    if (!isMissing) {
      let lowerVal = val.toString().trim().toLowerCase();
      if (['null', 'n/a', 'na', 'nan', '-', '?'].includes(lowerVal)) isMissing = true;
    }
    
    if (isMissing) { missing++; }
    else {
      let s = val.toString().trim();
      freqs[s] = (freqs[s] || 0) + 1;
      let t = types[c].type;
      if (t === "NUMBER" && isNaN(Number(s))) invalid++;
      if (t === "BOOLEAN" && !['true','false'].includes(s.toLowerCase())) invalid++;
      if (t === "DATE" && !isValidDate(s)) invalid++;
    }
  });
  
  let validVals = rowCount - missing;
  let maxFreq = Math.max(0, ...Object.values(freqs));
  
  completeness.push({ column: c, missing_count: missing, missing_pct: rowCount > 0 ? (missing/rowCount)*100 : 0 });
  uniqueness.push({ column: c, unique_count: Object.keys(freqs).length, dominant_pct: validVals>0?(maxFreq/validVals)*100:0 });
  validity.push({ column: c, invalid_count: invalid, invalid_pct: validVals>0?(invalid/validVals)*100:0 });
});

output = { exact_duplicates: exactDupes, completeness, uniqueness, validity };
