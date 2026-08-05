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

// The model echoes the severity labels in the casing used by the prompt's rule
// list, which is upper case. Normalise rather than trust it — an unmatched
// severity silently zeroes the counts and downgrades the verdict to
// safe-to-merge, which is the one wrong answer this flow must never give.
function normSeverity(v) {
  const s = String(v == null ? "" : v).toLowerCase().trim().replace(/\s+/g, "-");
  if (s === "breaking" || s === "potentially-breaking" || s === "additive") return s;
  return "unclassified";
}

// The drafting node is asked for a line containing only ---CHANGELOG---, but
// markdown rendering turns that into a horizontal rule plus a heading, and the
// whole reply often arrives inside a code fence. Find the separator by content
// instead of by exact match.
function splitSections(raw) {
  let t = String(raw == null ? "" : raw).trim();
  t = t.replace(/^```[a-zA-Z]*[ \t]*\r?\n/, "").replace(/\r?\n```[ \t]*$/, "");
  const lines = t.split(/\r?\n/);
  let at = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^[ \t]*-*[ \t]*#*[ \t]*CHANGELOG[ \t]*-*[ \t]*$/i.test(lines[i])) { at = i; break; }
  }
  if (at === -1) return [t, ""];
  // Trim before stripping: the separator is usually preceded by a blank line,
  // which would otherwise keep the rule off the end of the string.
  let head = lines.slice(0, at).join("\n").trim();
  head = head.replace(/\r?\n[ \t]*-{3,}[ \t]*$/, "").trim();
  return [head, lines.slice(at + 1).join("\n").trim()];
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
    counts: { breaking: 0, potentiallyBreaking: 0, additive: 0, unclassified: 0 },
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
      severity: normSeverity(a.severity),
      reason: a.reason || null,
      consumerImpact: a.consumerImpact || null,
      confidence: typeof a.confidence === "number" ? a.confidence : null
    };
  });

  const counts = {
    breaking: changes.filter(function (c) { return c.severity === "breaking"; }).length,
    potentiallyBreaking: changes.filter(function (c) { return c.severity === "potentially-breaking"; }).length,
    additive: changes.filter(function (c) { return c.severity === "additive"; }).length,
    unclassified: changes.filter(function (c) { return c.severity === "unclassified"; }).length
  };

  const parts = splitSections(text);

  output = {
    // Unclassified means the classifier returned nothing usable for that change,
    // so its impact is unknown — not absent. Letting it fall through to
    // safe-to-merge would turn a gap in the assessment into a green light.
    verdict: counts.breaking > 0 ? "needs-major-version"
           : (counts.potentiallyBreaking > 0 || counts.unclassified > 0) ? "review-required"
           : "safe-to-merge",
    summary: counts.breaking + " breaking, " + counts.potentiallyBreaking +
             " potentially breaking, " + counts.additive + " additive" +
             (counts.unclassified ? ", " + counts.unclassified + " unclassified" : "") +
             " across " + endpoints.length + " endpoint(s).",
    oldVersion: facts.oldVersion,
    newVersion: facts.newVersion,
    totalChanges: changes.length,
    counts: counts,
    changes: changes,
    migrationNotes: (parts[0] || "").trim() || null,
    changelog: (parts[1] || "").trim() || null
  };
}
