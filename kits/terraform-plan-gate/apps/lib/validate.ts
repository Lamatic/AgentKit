import type { AssessedChange, PolicyHit, ReviewResult, Risk, Verdict } from "./types";

const VERDICTS: Verdict[] = ["allow", "needs-approval", "block", "no-changes"];
const RISKS: Risk[] = ["low", "medium", "high", "critical", "unclassified"];

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
const nullableString = (v: unknown): string | null => (typeof v === "string" ? v : null);
const nullableNumber = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Optional counters default to 0 when absent; anything present must be a non-negative integer. */
function nonNegativeCount(v: unknown, name: string): number {
  const n = v === undefined ? 0 : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0) {
    throw new Error(`The flow returned a malformed ${name}: ${JSON.stringify(v)}.`);
  }
  return n;
}

function countsOf(v: unknown): ReviewResult["counts"] | null {
  if (!isRecord(v)) return null;
  const out = { critical: 0, high: 0, medium: 0, low: 0, unclassified: 0 };
  for (const k of Object.keys(out) as (keyof typeof out)[]) {
    const n = v[k];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0) return null;
    out[k] = n;
  }
  return out;
}

function changeOf(v: unknown, i: number): AssessedChange {
  if (!isRecord(v) || typeof v.address !== "string") throw new Error(`changes[${i}] has no address`);
  if (!isStringArray(v.actions)) throw new Error(`changes[${i}] (${v.address}) has no actions array`);
  const risk = typeof v.risk === "string" && (RISKS as string[]).includes(v.risk) ? (v.risk as Risk) : "unclassified";
  return {
    address: v.address,
    type: typeof v.type === "string" ? v.type : "unknown",
    actions: v.actions as AssessedChange["actions"],
    actionReason: nullableString(v.actionReason),
    changedAttributes: isStringArray(v.changedAttributes) ? v.changedAttributes : [],
    flags: isStringArray(v.flags) ? v.flags : [],
    risk,
    category: nullableString(v.category),
    policyIds: isStringArray(v.policyIds) ? v.policyIds : [],
    policyFloor: nullableString(v.policyFloor),
    reason: nullableString(v.reason),
    mitigation: nullableString(v.mitigation),
    confidence: nullableNumber(v.confidence),
  };
}

function policyOf(v: unknown): PolicyHit {
  const r = isRecord(v) ? v : {};
  const floor = typeof r.minimumRisk === "string" && (RISKS as string[]).includes(r.minimumRisk) ? (r.minimumRisk as Risk) : null;
  return { policyId: nullableString(r.policyId), title: nullableString(r.title), certainty: nullableNumber(r.certainty), minimumRisk: floor };
}

/**
 * The flow's API Response is the contract the UI renders. Anything that does
 * not match it is rejected here with a readable error instead of reaching the
 * table as a half-shaped object. Optional fields are normalised, never guessed.
 */
export function validateReviewResult(raw: unknown): ReviewResult {
  if (!isRecord(raw)) throw new Error("The flow returned no object.");
  const verdict = raw.verdict;
  if (typeof verdict !== "string" || !(VERDICTS as string[]).includes(verdict)) {
    throw new Error(`The flow returned an unknown verdict: ${JSON.stringify(verdict)}.`);
  }
  const counts = countsOf(raw.counts);
  if (!counts) throw new Error("The flow returned malformed counts.");
  if (!Array.isArray(raw.changes)) throw new Error("The flow returned no changes array.");
  const changes = raw.changes.map(changeOf);
  const totalChanges = typeof raw.totalChanges === "number" ? raw.totalChanges : changes.length;
  if (totalChanges !== changes.length) throw new Error(`The flow reported ${totalChanges} changes but returned ${changes.length}.`);

  // The counts and the verdict are derived from the changes in the flow's
  // assemble node. Re-derive them here so a result that contradicts its own
  // changes (an "allow" carrying a critical change) is rejected, not rendered.
  const derived = { critical: 0, high: 0, medium: 0, low: 0, unclassified: 0 };
  for (const c of changes) derived[c.risk] += 1;
  for (const k of Object.keys(derived) as (keyof typeof derived)[]) {
    if (derived[k] !== counts[k]) {
      throw new Error(`The flow reported ${counts[k]} ${k} change(s) but its changes contain ${derived[k]}.`);
    }
  }
  const expected: Verdict =
    changes.length === 0 ? "no-changes"
    : derived.critical > 0 ? "block"
    : derived.high + derived.medium + derived.unclassified > 0 ? "needs-approval"
    : "allow";
  if (verdict !== expected) {
    throw new Error(`The flow returned verdict "${verdict}" but its changes require "${expected}".`);
  }
  const dropped = nonNegativeCount(raw.droppedAssessments, "droppedAssessments");
  const invalid = nonNegativeCount(raw.invalidFacts, "invalidFacts");
  // The flow materialises every invalid fact as an unclassified change, so a
  // response that reports invalid facts without the matching changes would
  // hide unknown risk behind a safe-looking verdict.
  if (invalid > derived.unclassified) {
    throw new Error(`The flow reported ${invalid} invalid fact(s) but only ${derived.unclassified} unclassified change(s).`);
  }
  return {
    verdict: verdict as Verdict,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    totalChanges,
    counts,
    changes,
    reviewComment: nullableString(raw.reviewComment),
    policiesConsulted: Array.isArray(raw.policiesConsulted) ? raw.policiesConsulted.map(policyOf) : [],
    droppedAssessments: dropped,
    invalidFacts: invalid,
  };
}
