import { Lamatic } from "lamatic";
import config from "../../lamatic.config";
import type { GateRequest, GateResult } from "./types";

const step = config.steps.find((s) => s.id === "send-gate");
export const sendGateFlowId = step?.envKey ? process.env[step.envKey] : undefined;

/** True when every variable needed to call the deployed flow is present. */
export function flowConfigured(): boolean {
  return Boolean(sendGateFlowId && process.env.LAMATIC_API_KEY && process.env.LAMATIC_PROJECT_ID && process.env.LAMATIC_API_URL);
}

function client() {
  return new Lamatic({
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    apiKey: process.env.LAMATIC_API_KEY ?? ""
  });
}

/** Output-mapping values sometimes arrive JSON-encoded; normalise so the UI sees objects. */
function parseMaybe<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;
  const t = value.trim();
  if (!t) return fallback;
  try {
    return JSON.parse(t) as T;
  } catch {
    return value as unknown as T;
  }
}

/**
 * Executes the deployed send-gate flow. The trigger schema declares every field as a string,
 * so booleans are sent as "true"/"" and JSON as text; the flow parses them itself.
 */
export async function runSendGateFlow(req: GateRequest): Promise<GateResult> {
  if (!sendGateFlowId) throw new Error("SEND_GATE_FLOW_ID is not set.");
  const res = await client().executeFlow(sendGateFlowId, {
    draft: req.draft,
    facts: req.facts,
    recipient: req.recipient,
    policy: req.policy,
    needs_fact_check: req.needsFactCheck ? "true" : "",
    truth_url: req.truthUrl
  });
  if (res.status !== "success" || !res.result) {
    throw new Error(res.message ? `Lamatic: ${res.message}` : `Lamatic returned status "${res.status}".`);
  }
  const r = res.result as Record<string, unknown>;
  return {
    verdict: parseMaybe(r.verdict, "block"),
    finalMessage: r.finalMessage == null || r.finalMessage === "null" ? null : String(r.finalMessage),
    claims: parseMaybe(r.claims, {} as GateResult["claims"]),
    verifications: parseMaybe(r.verifications, []),
    findings: parseMaybe(r.findings, []),
    counts: parseMaybe(r.counts, {}),
    rewriteCheck: parseMaybe(r.rewriteCheck, null),
    audit: parseMaybe(r.audit, {} as GateResult["audit"])
  };
}
