import type { Claims, Verdict, Verification } from "./gate";

/** What the UI sends. Mirrors the flow's trigger schema (all strings there; booleans here). */
export interface GateRequest {
  draft: string;
  facts: string;
  recipient: string;
  policy: string;
  needsFactCheck: boolean;
  truthUrl: string;
}

/** The flow's API Response mapping, plus how the app obtained it. */
export interface GateResult {
  verdict: Verdict;
  finalMessage: string | null;
  claims: Claims;
  verifications: Verification[];
  findings: Verification[];
  counts: Record<string, number>;
  rewriteCheck: { preVerdict: Verdict; findings: Verification[] } | null;
  audit: {
    needsFactCheck: boolean;
    provenance: "facts" | "tool";
    fetchError: string;
    judgeUsed: boolean;
    judgeNotes: string;
    schemaVersion: string;
  };
}

export interface GateResponse {
  ok: boolean;
  mode: "flow" | "local";
  elapsedMs: number;
  result?: GateResult;
  error?: string;
}
