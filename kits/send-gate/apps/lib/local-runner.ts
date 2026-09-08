// Runs the two deterministic stages exactly as the Lamatic Code nodes do, in-process.
// Used when the flow is not configured, so `npm run dev` works with zero credentials.
// The LLM judge stage is the only thing missing: blocked drafts get no rewrite here.
import { decide, extractClaims, mergeFacts, verifyClaims } from "./gate";
import type { GateRequest, GateResult } from "./types";

export async function runSendGateLocally(req: GateRequest): Promise<GateResult> {
  const draft = String(req.draft || "");
  const claims = extractClaims(draft, req.policy);
  claims.draft = draft;
  const needsFactCheck = claims.needsFactCheck || req.needsFactCheck;

  let fetched: unknown = null;
  let fetchError = "";
  const truthUrl = req.truthUrl.trim();
  if (needsFactCheck && /^https?:\/\//.test(truthUrl)) {
    try {
      const ids = claims.figures.filter((f) => f.kind === "identifier").map((f) => f.token);
      const url = `${truthUrl}${truthUrl.includes("?") ? "&" : "?"}ids=${encodeURIComponent(ids.join(","))}&recipient=${encodeURIComponent(req.recipient)}`;
      const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      if (res.ok) fetched = await res.json();
      else fetchError = `truth_url responded ${res.status}`;
    } catch (e) {
      fetchError = `truth_url fetch failed: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  const merged = mergeFacts(req.facts, fetched);

  const verification = needsFactCheck
    ? verifyClaims(claims, merged.facts, req.recipient, req.policy, merged.provenance)
    : { verifications: [], preVerdict: "allow" as const, counts: {}, factIndexSize: 0 };
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
