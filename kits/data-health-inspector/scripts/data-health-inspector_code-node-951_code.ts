const raw = {{extractFromFileNode_417.output}};
let data = [];
if (raw && raw.files && raw.files[0] && raw.files[0].data) data = raw.files[0].data;

let rowCount = data.length;
let cols = new Set();
data.forEach(r => Object.keys(r).forEach(k => cols.add(k)));
let colArray = Array.from(cols);

let validation = { valid: true, issues: [] };
if (rowCount === 0) { validation.valid = false; validation.issues.push({code: "EMPTY_DATASET", message: "Dataset has 0 rows."}); }
if (colArray.length === 0) { validation.valid = false; validation.issues.push({code: "NO_COLUMNS", message: "Dataset has 0 columns."}); }

let colProfiles = colArray.map(c => {
  let vals = data.map(r => r[c]);
  let non_empty = vals.filter(v => v !== null && v !== undefined && v.toString().trim() !== '');
  let unique = new Set(vals).size;
  return { name: c, total: rowCount, non_empty: non_empty.length, unique: unique, sample: non_empty.slice(0, 10) };
});

output = { 
  raw_data: data, 
  valid: validation.valid, 
  row_count: rowCount, 
  col_count: colArray.length, 
  columns: colArray, 
  column_profiles: colProfiles 
};
