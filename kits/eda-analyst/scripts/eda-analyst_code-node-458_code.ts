// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const before       = {{codeNode_941.output}};
const applied      = {{codeNode_781.output}};
const originalRows = {{codeNode_579.output.rows}};
const plan         = {{codeNode_629.output}};

function validateCleaning(before, after, cleanedRows, originalRows, plan) {
  before = before || {}; after = after || {}; plan = plan || {};
  const bCols = (before.columns || []), aCols = (after.columns || []);
  const bDs = before.dataset || {}, aDs = after.dataset || {};
  const byName = function (cols) { const m = {}; for (let i = 0; i < cols.length; i++) m[cols[i].name] = cols[i]; return m; };
  const bMap = byName(bCols), aMap = byName(aCols);
  const plannedDrop = {}, plannedImpute = {}; const cps = plan.columns || [];
  for (let i = 0; i < cps.length; i++) { if (cps[i].action === "drop") plannedDrop[cps[i].column] = true; else if (cps[i].action === "impute" && cps[i].impute) plannedImpute[cps[i].column] = true; }
  const dedupeIntended = String(plan.dedupe || "").toLowerCase() === "yes";
  const issues = [];
  if (!cleanedRows || cleanedRows.length === 0) issues.push("Cleaning produced 0 rows.");
  if ((aDs.columnCount || 0) === 0) issues.push("All columns were dropped.");
  if (!dedupeIntended && aDs.rowCount < bDs.rowCount) issues.push("Row count dropped " + bDs.rowCount + "→" + aDs.rowCount + " without dedupe.");
  for (let i = 0; i < bCols.length; i++) { const name = bCols[i].name; if (!aMap[name] && !plannedDrop[name]) issues.push("Column \"" + name + "\" disappeared but was not planned for drop."); }
  for (let i = 0; i < aCols.length; i++) {
    const a = aCols[i], b = bMap[a.name];
    if (!b) { issues.push("Unexpected new column \"" + a.name + "\"."); continue; }
    if (a.missingPct > b.missingPct + 0.01) issues.push("Missingness INCREASED for \"" + a.name + "\" (" + b.missingPct + "%→" + a.missingPct + "%).");
    if (b.type === "numeric" && a.type !== "numeric") issues.push("Column \"" + a.name + "\" type degraded numeric→" + a.type + ".");
    if (plannedImpute[a.name] && a.missingPct > 0.01) issues.push("Imputation of \"" + a.name + "\" left " + a.missingPct + "% missing.");
    if (a.cardinality <= 1 && b.cardinality > 1) issues.push("Column \"" + a.name + "\" collapsed to a single value.");
  }
  const passed = issues.length === 0;
  return { passed: passed, issues: issues, rows: passed ? cleanedRows : originalRows, profile: passed ? after : before,
    note: passed ? "Validation passed: cleaning preserved data integrity." : "Validation FAILED — reverted to original data. " + issues.join(" ") };
}

const app = applied || {};
const gate = validateCleaning(before, app.profile, app.cleanedRows, originalRows, plan);
const changelog = (app.changelog || []).concat([{ target: "(validation)", action: gate.passed ? "pass" : "revert", detail: gate.note, reason: "" }]);
output = { rows: gate.rows, profile: gate.profile, changelog: changelog, validation: { passed: gate.passed, issues: gate.issues } };