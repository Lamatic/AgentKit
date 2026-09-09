// Runs the two deterministic stages exactly as the Lamatic Code nodes do, in-process.
// Used when the flow is not configured, so `npm run dev` works with zero credentials.
// The LLM judge stage is the only thing missing: blocked drafts get no rewrite here.
import { decide, extractClaims, mergeFacts, truthUrlProblem, verifyClaims } from "./gate";
import type { GateRequest, GateResult } from "./types";

/** Hosts `truth_url` may point at (TRUTH_URL_HOSTS, comma-separated). Same rule the Code node applies. */
export function truthHosts(): string[] {
  return (process.env.TRUTH_URL_HOSTS ?? "raw.githubusercontent.com").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function runSendGateLocally(req: GateRequest): Promise<GateResult> {
  const draft = String(req.draft || "");
  const claims = extractClaims(draft, req.policy);
  claims.draft = draft;
  const needsFactCheck = claims.needsFactCheck || req.needsFactCheck;

  let fetched: unknown = null;
  let fetchError = "";
  const truthUrl = req.truthUrl.trim();
  if (needsFactCheck && truthUrl) {
    // Validated once here and again right before the fetch: https only, no credentials, allow-listed public host.
    fetchError = truthUrlProblem(truthUrl, truthHosts()) ?? "";
    if (!fetchError) {
      try {
        const ids = claims.figures.filter((f) => f.kind === "identifier").map((f) => f.token);
        const url = `${truthUrl}${truthUrl.includes("?") ? "&" : "?"}ids=${encodeURIComponent(ids.join(","))}`;
        const headers: Record<string, string> = { accept: "application/json" };
        if (process.env.TRUTH_URL_TOKEN) headers.authorization = `Bearer ${process.env.TRUTH_URL_TOKEN}`;
        const res = await fetch(url, { headers, redirect: "error", signal: AbortSignal.timeout(8000) });
        const body = res.ok ? await res.text() : "";
        if (!res.ok) fetchError = `truth_url responded ${res.status}`;
        else if (body.length > 200_000) fetchError = "truth_url: body too large";
        else fetched = JSON.parse(body); // non-JSON (an HTML error page) throws and is reported below
      } catch (e) {
        fetchError = `truth_url fetch failed: ${e instanceof Error ? e.message : String(e)}`;
      }
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
