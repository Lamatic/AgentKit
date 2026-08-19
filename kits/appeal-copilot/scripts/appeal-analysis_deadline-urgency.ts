// Code: Compute Deadline Urgency
// Flow: appeal-analysis
// Mirrors the pure function in apps/lib/deadline-urgency.ts (kept in sync manually —
// this file runs inside Lamatic's codeNode sandbox and cannot import from apps/).

const deadline = {{InstructorLLMNode_481.output.appealDeadline}};

let daysRemaining = null;
let urgencyLevel = "unknown";

if (deadline) {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / msPerDay);

  if (daysRemaining < 0) urgencyLevel = "expired";
  else if (daysRemaining <= 7) urgencyLevel = "critical";
  else if (daysRemaining <= 30) urgencyLevel = "moderate";
  else urgencyLevel = "low";
}

output = { daysRemaining, urgencyLevel };
