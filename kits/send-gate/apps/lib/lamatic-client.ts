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
 * The SDK JSON-parses whatever the endpoint returns, so a wrong LAMATIC_API_URL (the Studio page,
 * the docs page, a URL without the GraphQL path) surfaces as "Unexpected token '<' ... is not valid
 * JSON". Check once, up front, and say what is actually wrong.
 */
let endpointChecked = "";
async function assertGraphqlEndpoint(url: string): Promise<void> {
  if (endpointChecked === url) return;
  if (!/^https?:\/\//.test(url)) throw new Error("LAMATIC_API_URL must be the project's GraphQL endpoint from Studio → Settings → API Docs (an https URL).");
  if (/studio\.lamatic\.ai|lamatic\.ai\/docs/.test(url)) {
    throw new Error(`LAMATIC_API_URL is set to a web page (${url}). Use the GraphQL endpoint shown under Studio → Settings → API Docs, not the Studio or docs URL.`);
  }
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ query: "{ __typename }" }), signal: AbortSignal.timeout(10000) });
  } catch (e) {
    throw new Error(`LAMATIC_API_URL is not reachable (${url}): ${e instanceof Error ? e.message : String(e)}`);
  }
  const text = await res.text();
  if (/^\s*<!doctype|^\s*<html/i.test(text)) {
    throw new Error(`LAMATIC_API_URL (${url}) answers with an HTML page, not GraphQL JSON. Copy the endpoint from Studio → Settings → API Docs; it ends in the API host, not studio.lamatic.ai.`);
  }
  endpointChecked = url;
}

/**
 * Executes the deployed send-gate flow. The trigger schema declares every field as a string,
 * so booleans are sent as "true"/"" and JSON as text; the flow parses them itself.
 */
export async function runSendGateFlow(req: GateRequest): Promise<GateResult> {
  if (!sendGateFlowId) throw new Error("SEND_GATE_FLOW_ID is not set.");
  await assertGraphqlEndpoint(process.env.LAMATIC_API_URL ?? "");
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
