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
function parseMaybe(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const t = value.trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asObject = <T extends object>(v: unknown, fallback: T): T => (isObj(v) ? (v as T) : fallback);
const VERDICTS: GateResult["verdict"][] = ["allow", "rewrite", "block"];


/**
 * The SDK JSON-parses whatever the endpoint returns, so a wrong LAMATIC_API_URL (the Studio page,
 * the docs page, a URL without the GraphQL path) surfaces as "Unexpected token '<' ... is not valid
 * JSON". Check once, up front, and say what is actually wrong.
 */
let endpointChecked = "";
async function assertGraphqlEndpoint(url: string): Promise<void> {
  if (endpointChecked === url) return;
  if (!/^https:\/\//.test(url)) throw new Error("LAMATIC_API_URL must be the project's GraphQL endpoint from Studio → Settings → API Docs (an https:// URL; the API key travels with every call).");
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
export async function runSendGateFlow(req: GateRequest, flowId: string | undefined = sendGateFlowId): Promise<GateResult> {
  if (!flowId) throw new Error(`${step?.envKey ?? "SEND_GATE_FLOW_ID"} is not set.`);
  await assertGraphqlEndpoint(process.env.LAMATIC_API_URL ?? "");
  const res = await client().executeFlow(flowId, {
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
  const r = asObject<Record<string, unknown>>(res.result, {});
  // Output-mapping values sometimes arrive JSON-encoded; anything malformed falls back to a safe shape
  // (a block verdict, empty lists) rather than a string the UI would try to iterate.
  const verdictRaw = parseMaybe(r.verdict);
  const verdict = VERDICTS.includes(verdictRaw as GateResult["verdict"]) ? (verdictRaw as GateResult["verdict"]) : "block";
  const rc = parseMaybe(r.rewriteCheck);
  const rewriteCheck = isObj(rc) ? (rc as { preVerdict?: unknown; findings?: unknown }) : null;
  const audit = asObject<Partial<GateResult["audit"]>>(parseMaybe(r.audit), {});
  return {
    verdict,
    finalMessage: verdict === "block" || r.finalMessage == null || r.finalMessage === "null" ? null : String(r.finalMessage),
    claims: asObject<GateResult["claims"]>(parseMaybe(r.claims), { schemaVersion: "1", figures: [], statements: [], register: { informalAddress: false, profanity: false }, risk: "high", needsFactCheck: true } as GateResult["claims"]),
    verifications: asArray(parseMaybe(r.verifications)),
    findings: asArray(parseMaybe(r.findings)),
    counts: asObject<Record<string, number>>(parseMaybe(r.counts), {}),
    rewriteCheck: rewriteCheck && VERDICTS.includes(rewriteCheck.preVerdict as GateResult["verdict"]) ? { preVerdict: rewriteCheck.preVerdict as GateResult["verdict"], findings: asArray(rewriteCheck.findings) } : null,
    audit: {
      needsFactCheck: Boolean(audit.needsFactCheck),
      provenance: audit.provenance === "tool" ? "tool" : "facts",
      fetchError: typeof audit.fetchError === "string" ? audit.fetchError : "",
      judgeUsed: Boolean(audit.judgeUsed),
      judgeNotes: typeof audit.judgeNotes === "string" ? audit.judgeNotes : "",
      schemaVersion: typeof audit.schemaVersion === "string" ? audit.schemaVersion : ""
    }
  };
}
