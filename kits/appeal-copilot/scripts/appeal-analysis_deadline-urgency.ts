// Code: Compute Deadline Urgency
// Flow: appeal-analysis
// Mirrors the pure function in apps/lib/deadline-urgency.ts (kept in sync manually —
// this file runs inside Lamatic's codeNode sandbox and cannot import from apps/).

const deadline = {{InstructorLLMNode_481.output.appealDeadline}};

let daysRemaining = null;
let urgencyLevel = "unknown";

if (deadline) {
  const deadlineDate = new Date(deadline);
  // An unparseable date yields NaN, and every comparison below would be false —
  // falling through to "low" and reporting false reassurance on a real deadline.
  // Leave daysRemaining null / urgencyLevel "unknown" instead.
  if (!Number.isNaN(deadlineDate.getTime())) {
    const today = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / msPerDay);

    if (daysRemaining < 0) urgencyLevel = "expired";
    else if (daysRemaining <= 7) urgencyLevel = "critical";
    else if (daysRemaining <= 30) urgencyLevel = "moderate";
    else urgencyLevel = "low";
  }
}

output = { daysRemaining, urgencyLevel };
