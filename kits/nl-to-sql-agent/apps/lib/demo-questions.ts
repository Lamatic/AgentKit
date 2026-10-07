/**
 * Approved demo questions and their normalization.
 *
 * The public demo restricts demo sessions to a small set of predefined
 * questions so that every answer demonstrates the real NL-to-SQL flow.
 * Anything outside this allowlist is blocked before the Lamatic flow is
 * invoked, so unsupported questions never receive fake or unrelated results.
 */

export const APPROVED_DEMO_QUESTIONS = [
  "How many customers are active?",
  "Average data usage by plan",
  "Recent failed transactions",
] as const;

/**
 * Conservative, exact-match normalization.
 *
 * Only cosmetic differences are reconciled: leading/trailing whitespace,
 * repeated internal whitespace, case, and optional terminal punctuation.
 * This is not semantic matching, so unrelated or expanded requests still
 * fail the allowlist check and are blocked.
 */
export function normalizeDemoQuestion(question: string): string {
  return question
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?.!\s]+$/, "")
    .toLowerCase();
}

/**
 * Whether a question is one of the approved demo questions.
 * Comparison is a normalized exact match against the allowlist.
 */
export function isApprovedDemoQuestion(question: string): boolean {
  const normalized = normalizeDemoQuestion(question);
  return APPROVED_DEMO_QUESTIONS.some(
    (approved) => normalizeDemoQuestion(approved) === normalized
  );
}

/**
 * Resolve the effective demo-restriction flag from a raw stored isDemo value.
 *
 * Fail-closed policy: a missing, undefined, null, or otherwise untrusted `isDemo`
 * value must never silently become an unrestricted non-demo session. This kit's
 * only supported login is the restricted demo session, so a stored session that
 * does not carry an explicit `isDemo === true` is treated as demo-restricted.
 * Only an explicit `false` (which nothing in this kit writes today) is honored
 * as a non-demo session.
 */
export function resolveDemoRestriction(rawIsDemo: boolean | undefined | null): boolean {
  return rawIsDemo === false ? false : true;
}

/**
 * The kind of processing a request should receive.
 *  - blocked: a restricted demo user asked an unapproved question.
 *  - mock:    non-demo development request with mock mode enabled.
 *  - real:    approved demo question (always the real flow) or a non-demo
 *             request without mock mode.
 *
 * Mock mode must never masquerade as a real answer for a restricted demo
 * session, so the mock branch is excluded whenever isDemo is true.
 */
export type DemoRequestDecision =
  | { kind: "blocked" }
  | { kind: "mock" }
  | { kind: "real" };

export function decideDemoRequest(options: {
  isDemo: boolean;
  isApproved: boolean;
  mockEnabled: boolean;
}): DemoRequestDecision {
  if (options.isDemo && !options.isApproved) {
    return { kind: "blocked" };
  }
  if (options.mockEnabled && !options.isDemo) {
    return { kind: "mock" };
  }
  return { kind: "real" };
}
