#!/usr/bin/env node
/**
 * Demo Question Restriction Tests
 *
 * Verifies the server-side allowlist that restricts demo sessions to the
 * approved example questions. These tests exercise the REAL production helper
 * (apps/lib/demo-questions.ts) rather than a local copy, so the allowlist,
 * normalization, and approval logic cannot drift from production.
 *
 * Also verifies the fail-closed demo restriction policy (Issue #1): a logged-in
 * session whose isDemo value is missing/undefined must never be treated as an
 * unrestricted non-demo session.
 *
 * 1. Approved questions are accepted.
 * 2. Normalized variants (case, whitespace, trailing punctuation) are accepted.
 * 3. Unsupported / near-but-different questions are rejected.
 * 4. Normalization is an exact match, not semantic matching.
 * 5. Missing/undefined isDemo resolves to demo-restricted (fail closed).
 */

const dq = require('../apps/lib/demo-questions.ts');

const { APPROVED_DEMO_QUESTIONS } = dq;
const isApprovedDemoQuestion = dq.isApprovedDemoQuestion;

let passed = 0;
let failed = 0;

function test(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    failed++;
    console.log(`❌ FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log("🧪 Running Demo Question Restriction Tests...\n");

// --- The allowlist/normalization come from production, not this file ---
test(
  'Allowlist and helpers are imported from production demo-questions.ts',
  Array.isArray(APPROVED_DEMO_QUESTIONS) &&
    APPROVED_DEMO_QUESTIONS.length > 0 &&
    typeof isApprovedDemoQuestion === 'function'
);

// --- Approved questions (exact) ---
test("Approved: 'How many customers are active?'", isApprovedDemoQuestion("How many customers are active?"));
test("Approved: 'Average data usage by plan'", isApprovedDemoQuestion("Average data usage by plan"));
test("Approved: 'Recent failed transactions'", isApprovedDemoQuestion("Recent failed transactions"));

// --- Normalization variants ---
test("Approved: lowercase 'how many customers are active?'", isApprovedDemoQuestion("how many customers are active?"));
test("Approved: leading/trailing whitespace", isApprovedDemoQuestion("   How many customers are active?   "));
test("Approved: repeated internal whitespace", isApprovedDemoQuestion("How  many   customers are  active?"));
test("Approved: missing terminal punctuation", isApprovedDemoQuestion("How many customers are active"));
test("Approved: mixed case + no punctuation", isApprovedDemoQuestion("  AVERAGE DATA USAGE BY PLAN"));
test("Approved: trailing newline/tab", isApprovedDemoQuestion("Recent failed transactions\t\n"));

// --- Rejected: unsupported ---
test("Rejected: 'Show me all users'", !isApprovedDemoQuestion("Show me all users"));
test("Rejected: 'What is the weather today?'", !isApprovedDemoQuestion("What is the weather today?"));
test("Rejected: 'How many customers are active today?'", !isApprovedDemoQuestion("How many customers are active today?"));
test("Rejected: 'Show me every active customer's personal information'", !isApprovedDemoQuestion("Show me every active customer's personal information"));

// --- Rejected: near-but-different (ensure exact match, not semantic) ---
test("Rejected: 'How many inactive customers are there?'", !isApprovedDemoQuestion("How many inactive customers are there?"));
test("Rejected: 'Average data usage' (missing 'by plan')", !isApprovedDemoQuestion("Average data usage"));
test("Rejected: 'data usage by plan' (missing 'average')", !isApprovedDemoQuestion("data usage by plan"));
test("Rejected: 'Recent successful transactions'", !isApprovedDemoQuestion("Recent successful transactions"));
test("Rejected: 'transactions failed recently'", !isApprovedDemoQuestion("transactions failed recently"));
test("Rejected: empty string", !isApprovedDemoQuestion(""));

// --- Issue #1: fail-closed demo restriction for missing/undefined isDemo ---
test(
  "Missing isDemo (undefined) resolves to demo-restricted (fail closed)",
  dq.resolveDemoRestriction(undefined) === true
);
test(
  "Explicit isDemo true resolves to demo-restricted",
  dq.resolveDemoRestriction(true) === true
);
test(
  "Explicit isDemo false resolves to non-demo",
  dq.resolveDemoRestriction(false) === false
);

// A legacy session missing isDemo must still be blocked from unapproved
// questions and must never reach the mock branch.
const resolveAndDecide = (rawIsDemo, isApproved, mockEnabled) =>
  dq.decideDemoRequest({
    isDemo: dq.resolveDemoRestriction(rawIsDemo),
    isApproved,
    mockEnabled,
  }).kind;

test(
  'Legacy session (missing isDemo) + unapproved question => blocked',
  resolveAndDecide(undefined, false, true) === 'blocked' &&
    resolveAndDecide(undefined, false, false) === 'blocked'
);
test(
  'Legacy session (missing isDemo) + approved question => real flow (mock never runs)',
  resolveAndDecide(undefined, true, true) === 'real'
);

console.log("\n============================================================");
console.log(`📊 Test Summary:`);
console.log(`   ✅ Passed: ${passed}/${passed + failed}`);
console.log(`   ❌ Failed: ${failed}/${passed + failed}`);
console.log("============================================================\n");

if (failed > 0) {
  // Let node --test report this file as a failed subtest. A forced process
  // exit can race tsx cleanup on Windows and hide the actual assertion error.
  throw new Error(`Some tests failed: ${failed}/${passed + failed}`);
}
console.log("🎉 All tests passed!");
