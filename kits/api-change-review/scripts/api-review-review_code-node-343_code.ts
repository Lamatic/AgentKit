// ============================================================
// Assemble node — last Code node before API Response.
// Bracket-wrapped variables so a skipped branch (Generate JSON /
// Generate Text never ran) degrades to undefined instead of a
// syntax error.
// Replace node IDs with yours via "Add Variable (x)".
//
// The trigger declares changes as [string], which is the only array
// shape Studio offers besides an untyped [], so the app sends each
// change fact as a JSON string. toObject parses those back. Both
// shapes are accepted, so this keeps working if the schema is ever
// widened to [].
// ============================================================
const facts = {{triggerNode_1.output}};

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return []; }
  }
  if (v && typeof v === "object") return Object.keys(v).map(function (k) { return v[k]; });
  return [];
}

function toObject(v) {
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  return v && typeof v === "object" ? v : null;
}

const changeFacts = toArray(facts.changes)
  .map(toObject)
  .filter(function (c) { return c && c.id; });
const endpoints = toArray(facts.endpointsTouched);
const assessments = toArray([{{InstructorLLMNode_713.output.assessments}}][0]).map(toObject).filter(Boolean);
const text = ["", {{LLMNode_804.output.generatedResponse}}].pop() || "";

if (!facts || !changeFacts.length) {
  output = {
    verdict: "no-api-change",
    summary: "No differences found in the API surface between the two specs.",
    oldVersion: facts ? facts.oldVersion : null,
    newVersion: facts ? facts.newVersion : null,
    totalChanges: 0,
    counts: { breaking: 0, potentiallyBreaking: 0, additive: 0 },
    changes: [],
    migrationNotes: null,
    changelog: null
  };
} else {
  const byId = {};
  assessments.forEach(function (a) { if (a && a.id) byId[a.id] = a; });

  const changes = changeFacts.map(function (c) {
    const a = byId[c.id] || {};
    return {
      id: c.id,
      kind: c.kind,
      location: c.location,
      before: c.before,
      after: c.after,
      severity: a.severity || "unclassified",
      reason: a.reason || null,
      consumerImpact: a.consumerImpact || null,
      confidence: typeof a.confidence === "number" ? a.confidence : null
    };
  });

  const counts = {
    breaking: changes.filter(function (c) { return c.severity === "breaking"; }).length,
    potentiallyBreaking: changes.filter(function (c) { return c.severity === "potentially-breaking"; }).length,
    additive: changes.filter(function (c) { return c.severity === "additive"; }).length
  };

  const parts = text.split(/^---CHANGELOG---\s*$/m);

  output = {
    verdict: counts.breaking > 0 ? "needs-major-version"
           : counts.potentiallyBreaking > 0 ? "review-required"
           : "safe-to-merge",
    summary: counts.breaking + " breaking, " + counts.potentiallyBreaking +
             " potentially breaking, " + counts.additive + " additive across " +
             endpoints.length + " endpoint(s).",
    oldVersion: facts.oldVersion,
    newVersion: facts.newVersion,
    totalChanges: changes.length,
    counts: counts,
    changes: changes,
    migrationNotes: (parts[0] || "").trim() || null,
    changelog: (parts[1] || "").trim() || null
  };
}
