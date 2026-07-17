const comp = {{codeNode_678.output.completeness}};
const uniq = {{codeNode_678.output.uniqueness}};
const val = {{codeNode_678.output.validity}};
const cons = {{codeNode_183.output.consistency_issues}};
const outl = {{codeNode_568.output.outliers}};
const dupes = {{codeNode_678.output.exact_duplicates}};
const rowCount = {{codeNode_951.output.row_count}};
const colCount = {{codeNode_951.output.col_count}};


let issues = [];

comp.forEach(c => {
  if (c.missing_pct > 0) {
    let sev = c.missing_pct > 20 ? "HIGH" : (c.missing_pct > 5 ? "MEDIUM" : "LOW");
    issues.push({ code: "MISSING_VALUES", category: "COMPLETENESS", column: c.column, pct: c.missing_pct.toFixed(1), severity: sev });
  }
});

uniq.forEach(c => {
  if (c.dominant_pct > 95) issues.push({ code: "SKEWED_DATA", category: "UNIQUENESS", column: c.column, pct: c.dominant_pct.toFixed(1), severity: "MEDIUM" });
});

val.forEach(c => {
  if (c.invalid_pct > 0) issues.push({ code: "TYPE_MISMATCH", category: "VALIDITY", column: c.column, pct: c.invalid_pct.toFixed(1), severity: "HIGH" });
});

Object.keys(cons).forEach(c => {
  issues.push({ code: "FORMAT_INCONSISTENCY", category: "CONSISTENCY", column: c, severity: "LOW" });
});

Object.keys(outl).forEach(c => {
  issues.push({ code: "STATISTICAL_OUTLIERS", category: "ANOMALY", column: c, pct: outl[c].pct.toFixed(1), severity: "MEDIUM" });
});

if (dupes > 0) issues.push({ code: "EXACT_DUPLICATES", category: "UNIQUENESS", column: "Dataset", severity: "CRITICAL" });

// ----------------------------------------------------
// PRECISION MATHEMATICAL SCORING ENGINE
// ----------------------------------------------------
let totalCells = rowCount * colCount;
let defectPoints = 0;

// 1. Missing Data (1.0 weight - fully broken cell)
comp.forEach(c => { defectPoints += (c.missing_count * 1.0); });

// 2. Type Mismatches (1.0 weight - unusable data)
val.forEach(c => { defectPoints += (c.invalid_count * 1.0); });

// 3. Format Inconsistencies (0.2 weight - annoying but fixable)
Object.values(cons).forEach(c => { defectPoints += (c.count * 0.2); });

// 4. Statistical Outliers (0.5 weight - mathematically skewing, but real data)
Object.values(outl).forEach(c => { defectPoints += (c.count * 0.5); });

// 5. Exact Row Duplicates (1.0 weight per cell in the duplicated row)
defectPoints += (dupes * colCount * 1.0);

// Uniqueness Skew is a dataset-level warning, not a cell-level defect
let skewPenalty = 0;
uniq.forEach(c => { if (c.dominant_pct > 95) skewPenalty += 2; });

let rawScore = 100;
if (totalCells > 0) {
  let defectRatio = defectPoints / totalCells;
  rawScore = 100 - (defectRatio * 100) - skewPenalty;
}

let score = Math.max(0, Math.round(rawScore));

let statusl = "EXCELLENT";
if (score < 90) statusl = "GOOD";
if (score < 75) statusl = "FAIR";
if (score < 60) statusl = "POOR";
if (score < 40) statusl = "CRITICAL";

output = { issues, health_score: score, health_status: statusl };
