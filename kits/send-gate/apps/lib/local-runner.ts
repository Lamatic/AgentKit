// Runs the two deterministic stages exactly as the Lamatic Code nodes do, in-process.
// Used when the flow is not configured, so `npm run dev` works with zero credentials.
// The LLM judge stage is the only thing missing: blocked drafts get no rewrite here.
import { decide, extractClaims, failClosed, mergeFacts, verifyClaims } from "./gate";
import type { VerifyResult } from "./gate";
import { fetchTruth } from "./truth-fetch";
import type { GateRequest, GateResult } from "./types";

/** Hosts `truth_url` may point at (TRUTH_URL_HOSTS, comma-separated). Same rule the Code node applies. */
export function truthHosts(): string[] {
  return (process.env.TRUTH_URL_HOSTS ?? "cdn.jsdelivr.net").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function runSendGateLocally(req: GateRequest): Promise<GateResult> {
  const draft = String(req.draft || "");
  const claims = extractClaims(draft, req.policy);
  claims.draft = draft;
  const needsFactCheck = claims.needsFactCheck || req.needsFactCheck;

  // Same fetcher as codeNode_211: validated URL, ids only in the query, no redirects, timeout, bounded body.
  let fetched: unknown = null, fetchError = "";
  const truthUrl = req.truthUrl.trim();
  if (needsFactCheck && truthUrl) {
    const ids = claims.figures.filter((f) => f.kind === "identifier").map((f) => f.token);
    const t = await fetchTruth(truthUrl, ids, truthHosts(), process.env.TRUTH_URL_TOKEN);
    fetched = t.fetched; fetchError = t.error;
  }
  const merged = mergeFacts(req.facts, fetched);

  let verification: VerifyResult = needsFactCheck
    ? verifyClaims(claims, merged.facts, req.recipient, req.policy, merged.provenance)
    : { verifications: [], preVerdict: "allow" };
  // A truth_url that could not be used means nothing was verified: block, whatever the caller's facts say.
  if (fetchError) verification = failClosed(verification, fetchError);
  const findings = verification.verifications.filter((v) => v.severity !== "info");

  const result = needsFactCheck
    ? decide({ draft, facts: merged.facts, recipient: req.recipient, provenance: merged.provenance }, { preVerdict: verification.preVerdict, findings }, null)
    : { verdict: "allow" as const, finalMessage: draft, findings: [], counts: { block: 0, rewrite: 0 }, rewriteCheck: null, judgeNotes: "fast path: no verifiable claims" };

  return {
    verdict: result.verdict,
    finalMessage: result.finalMessage,
    claims,
    verifications: verification.verifications,
    findings: result.findings,
    counts: result.counts,
    rewriteCheck: result.rewriteCheck,
    audit: {
      needsFactCheck,
      provenance: merged.provenance,
      fetchError,
      judgeUsed: false,
      judgeNotes: needsFactCheck ? "local mode: LLM judge skipped, so no rewrite is produced. Set SEND_GATE_FLOW_ID to run the deployed flow." : result.judgeNotes,
      schemaVersion: claims.schemaVersion
    }
  };
}
