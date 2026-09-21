const score = {{InstructorLLMNode_577.output.score}};
const verdict = {{InstructorLLMNode_577.output.verdict}};
const rationale = {{InstructorLLMNode_577.output.rationale}};
const rubricHash = {{InstructorLLMNode_577.output.rubric_hash}};
const attempt = {{triggerNode_1.output.attempt}};
const escrow = {{triggerNode_1.output.escrow}};
const bounty = {{triggerNode_1.output.bounty}};

const scoreNum = typeof score === 'string' ? parseFloat(score) : Number(score);

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
  verdict: verdict,
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