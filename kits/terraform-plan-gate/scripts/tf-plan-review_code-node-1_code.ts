const trigger = {{triggerNode_1.output}};
const assessed = {{InstructorLLMNode_1.output}};
const comment = {{LLMNode_1.output.generatedResponse}};
const policies = {{searchNode_1.output.searchResults}};

// Facts arrive JSON-encoded (Studio's trigger schema only offers [] or [string]).
const rawFacts = Array.isArray(trigger.changes) ? trigger.changes : [];
// A fact that does not parse, or parses to something other than an object with
// an address, becomes an explicit invalid fact: it is counted as unclassified
// (so it needs approval) instead of crashing the node.
const isFact = f => f && typeof f === "object" && !Array.isArray(f) && typeof f.address === "string" && f.address.length > 0;
const facts = rawFacts.map((f, i) => {
  let parsed = f;
  if (typeof f === "string") { try { parsed = JSON.parse(f); } catch (e) { parsed = null; } }
  return isFact(parsed) ? parsed : { address: `invalid-fact-${i + 1}`, invalidFact: true, actions: [], changedAttributes: [], flags: [] };
});

// Everything the model returned is validated against what it was given:
// known addresses only, known risk levels only, known policy ids only,
// confidence clamped. Anything else is dropped or downgraded to unclassified.
const RISKS = { critical: 4, high: 3, medium: 2, low: 1 };
// Closed list: "constructor" or "toString" must not read as a risk level.
const RISK_LEVELS = ["critical", "high", "medium", "low"];
const riskOf = v => (typeof v === "string" && RISK_LEVELS.includes(v)) ? v : null;
const CATEGORIES = new Set(["data-loss", "availability", "security-exposure", "privilege", "cost", "drift", "routine"]);
const knownPolicyIds = new Set((Array.isArray(policies) ? policies : []).map(p => p && p.policy_id).filter(Boolean));
// Severity floors come from the policy records, not from the model: a change
// that cites a policy is rated at least that policy's minimum_risk.
const floors = new Map();
for (const p of (Array.isArray(policies) ? policies : [])) {
  if (p && p.policy_id && riskOf(p.minimum_risk)) {
    const prev = floors.get(String(p.policy_id));
    if (!prev || RISKS[p.minimum_risk] > RISKS[prev]) floors.set(String(p.policy_id), p.minimum_risk);
  }
}
const knownAddresses = new Set(facts.map(f => String(f.address)));

const list = Array.isArray(assessed && assessed.assessments) ? assessed.assessments : [];
const byAddress = new Map();
let droppedAssessments = 0;
for (const a of list) {
  if (!a || typeof a !== "object" || !knownAddresses.has(String(a.address))) { droppedAssessments++; continue; }
  if (byAddress.has(String(a.address))) { droppedAssessments++; continue; }
  byAddress.set(String(a.address), a);
}

const changes = facts.map(f => {
  const a = byAddress.get(String(f.address));
  let risk = (a && !f.invalidFact && riskOf(a.risk)) || "unclassified";
  const policyIds = a && Array.isArray(a.policyIds) ? a.policyIds.filter(id => knownPolicyIds.has(id)) : [];
  let policyFloor = null;
  if (risk !== "unclassified") {
    for (const id of policyIds) {
      const floor = floors.get(id);
      if (floor && RISKS[floor] > RISKS[risk]) { risk = floor; policyFloor = id; }
    }
  }
  const confidence = a && typeof a.confidence === "number" && isFinite(a.confidence) ? Math.min(1, Math.max(0, a.confidence)) : null;
  return {
    address: f.address, type: f.type || null, actions: Array.isArray(f.actions) ? f.actions : [], actionReason: f.actionReason || null,
    changedAttributes: Array.isArray(f.changedAttributes) ? f.changedAttributes : [], flags: Array.isArray(f.flags) ? f.flags : [],
    risk,
    category: a && CATEGORIES.has(a.category) ? a.category : null,
    policyIds,
    policyFloor,
    reason: a && typeof a.reason === "string" ? a.reason : null,
    mitigation: a && typeof a.mitigation === "string" ? a.mitigation : null,
    confidence
  };
});

const counts = { critical: 0, high: 0, medium: 0, low: 0, unclassified: 0 };
for (const c of changes) counts[c.risk] += 1;

// Verdict is arithmetic, never asked of the model. Unclassified counts against
// the verdict: a gap in the assessment is unknown risk, not absent risk.
let verdict = "allow";
if (counts.critical > 0) verdict = "block";
else if (counts.high > 0 || counts.medium > 0 || counts.unclassified > 0) verdict = "needs-approval";

const highest = counts.unclassified > 0 && counts.critical === 0
  ? "unknown"
  : changes.reduce((m, c) => (RISKS[c.risk] || 0) > (RISKS[m] || 0) ? c.risk : m, "low");
const invalidFacts = facts.filter(f => f.invalidFact).length;
const summary = verdict === "allow"
  ? `${changes.length} change(s), nothing above low risk.`
  : `${changes.length} change(s): ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.unclassified} unclassified. Highest: ${highest}.`;

// One entry per policy id, highest certainty wins: the store can hold the
// same policy more than once after repeated loads, and a duplicate hit would
// crowd out a distinct policy in the top results.
const seenPolicies = new Map();
for (const p of (Array.isArray(policies) ? policies : [])) {
  const id = p && p.policy_id ? String(p.policy_id) : null;
  const certainty = p && typeof p.certainty === "number" ? p.certainty : null;
  const key = id || `unnamed-${seenPolicies.size}`;
  const prev = seenPolicies.get(key);
  if (!prev || (certainty !== null && (prev.certainty === null || certainty > prev.certainty))) {
    seenPolicies.set(key, { policyId: id, title: p && p.title ? String(p.title) : null, certainty, minimumRisk: (id && floors.get(id)) || null });
  }
}
const policiesConsulted = [...seenPolicies.values()];

// The comment is written before this node runs, so it cannot know which
// changes ended up unclassified. Append that list here, deterministically, so
// an approval-required change is never missing from what gets posted.
const unclassifiedAddresses = changes.filter(c => c.risk === "unclassified").map(c => c.address);
let reviewComment = typeof comment === "string" && comment.trim() ? comment.trim() : null;
if (unclassifiedAddresses.length > 0) {
  const section = "### Needs assessment\n" + unclassifiedAddresses.map(a => `* \`${a}\` - unclassified - no assessment; review by hand`).join("\n");
  reviewComment = reviewComment ? reviewComment + "\n\n" + section : section;
}

output = { verdict, summary, totalChanges: changes.length, counts, changes, reviewComment, policiesConsulted, droppedAssessments, invalidFacts };
