// Type surface of lib/gate.js. The library is plain JavaScript on purpose: the same file is
// minified into the two Lamatic Code nodes (see scripts/emit-code-node.mjs).

export type EvidenceStatus = "verified" | "contradicted" | "unsupported" | "unverifiable";
export type Severity = "block" | "rewrite" | "info";
export type Verdict = "allow" | "rewrite" | "block";
export type FigureKind = "link" | "phone" | "date" | "identifier" | "currency" | "percent" | "count";

export const STATUS: {
  VERIFIED: "verified";
  CONTRADICTED: "contradicted";
  UNSUPPORTED: "unsupported";
  UNVERIFIABLE: "unverifiable";
};

export interface StatementRule {
  id: string;
  kind?: string;
  pattern: string;
  factPath?: string;
  expect?: string[];
  never?: boolean;
  message?: string;
}
export const DEFAULT_STATEMENT_RULES: StatementRule[];

export interface Policy {
  formalAddress?: boolean;
  allowUngroundedSmallCounts?: boolean;
  disableRules?: string[];
  statementRules?: StatementRule[];
  allowedValues?: string[];
  alwaysCheck?: boolean;
}

export interface Figure {
  id: string;
  kind: FigureKind;
  token: string;
  value: string;
}

export interface Statement {
  id: string;
  rule: string;
  kind: string;
  text: string;
  factPath: string | null;
  expect: string[] | null;
  never: boolean;
  message: string;
}

/** Fixed shape for every draft: what gets logged, verified and asserted on. */
export interface Claims {
  schemaVersion: "1";
  figures: Figure[];
  statements: Statement[];
  register: { informalAddress: boolean; profanity: boolean };
  risk: "none" | "low" | "high";
  needsFactCheck: boolean;
  draft?: string;
}

export interface Verification {
  claimId: string;
  kind: string;
  token: string;
  status: EvidenceStatus;
  source: string;
  evidence: string;
  severity: Severity;
  message: string;
}

export interface VerifyResult {
  verifications: Verification[];
  preVerdict: Verdict;
  counts: Record<string, number>;
  factIndexSize: number;
}

export interface CheckResult extends VerifyResult {
  claims: Claims;
  findings: Verification[];
}

export interface JudgeOutput {
  unsupported_claims?: { claim: string; why: string; severity: string }[];
  rewrite?: string;
  notes?: string;
}

export interface Decision {
  verdict: Verdict;
  finalMessage: string | null;
  findings: Verification[];
  counts: { block: number; rewrite: number };
  rewriteCheck: { preVerdict: Verdict; findings: Verification[] } | null;
  judgeNotes: string;
}

type Json = unknown;

export function extractClaims(draft: string, policy?: Policy | string | null): Claims;
export function verifyClaims(claims: Claims, facts: Json, recipient: Json, policy?: Policy | string | null, provenance?: string): VerifyResult;
export function mergeFacts(provided: Json, fetched: Json): { facts: Record<string, unknown>; provenance: "facts" | "tool" };
export function checkDraft(input: { draft: string; facts?: Json; recipient?: Json; policy?: Policy | string | null; provenance?: string }): CheckResult;
export function decide(input: { draft: string; facts?: Json; recipient?: Json; policy?: Policy | string | null; provenance?: string }, pre: { preVerdict: Verdict; findings: Verification[] }, judge?: JudgeOutput | string | null): Decision;
