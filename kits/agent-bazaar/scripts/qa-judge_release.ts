const score = {{InstructorLLMNode_577.output.score}};
const verdict = {{InstructorLLMNode_577.output.verdict}};
const rationale = {{InstructorLLMNode_577.output.rationale}};
const attempt = {{triggerNode_1.output.attempt}};
const escrow = {{triggerNode_1.output.escrow}};
const bounty = {{triggerNode_1.output.bounty}};
const rubric = {{triggerNode_1.output.rubric}};

const scoreNum = typeof score === 'string' ? parseFloat(score) : Number(score);

// Deterministic rubric hash: never trust model output for the audit trail.
// Canonical serialization (sorted keys) of the trigger rubric, falling back
// to the bounty-embedded rubric, then FNV-1a hashed to hex.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}
function fnv1aHex(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
}
const rubricSource = (typeof rubric !== 'undefined' && rubric !== null) ? rubric : bounty.rubric;
const rubricHash = 'rubric-' + fnv1aHex(stableStringify(rubricSource ?? null));

let action = "";
let receiptId = "";
let newAttempt = 0;
let reason = "";
let feeAmount = 0;
let netAmount = 0;

if (scoreNum >= 0.7 && verdict === "pass") {
  // SETTLE
  action = "settle";
  receiptId = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  feeAmount = Math.round(escrow.amount * 0.1);
  netAmount = escrow.amount - feeAmount;
} else if (attempt < 3) {
  // REVISE — fail closed: any non-pass combination still gets revision attempts
  action = "revise";
  newAttempt = attempt + 1;
  reason = verdict === "pass"
    ? "Score below threshold. Revision required."
    : "Verdict failed. Revision required.";
} else {
  // REFUND — attempts exhausted
  action = "refund";
  reason = "max_attempts_exceeded";
}

output = {
  score: scoreNum,
  // Derive verdict from the routed action so a sub-threshold score can never
  // emit a passing verdict: only settle passes, revise/refund fail. Action
  // routing above is unchanged.
  verdict: action === "settle" ? "pass" : "fail",
  rationale: rationale,
  rubric_hash: rubricHash,
  action: action,
  receiptId: receiptId,
  newAttempt: newAttempt,
  reason: reason,
  escrowId: escrow.escrowId,
  grossAmount: escrow.amount,
  feeAmount: feeAmount,
  netAmount: netAmount,
  fromAgent: bounty.posted_by,
  toAgent: escrow.agent_id,
  refundAmount: action === "refund" ? escrow.amount : 0
};