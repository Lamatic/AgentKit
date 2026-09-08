"use server";

import { flowConfigured, runSendGateFlow } from "../lib/lamatic-client";
import { runSendGateLocally } from "../lib/local-runner";
import type { GateRequest, GateResponse } from "../lib/types";

const MAX_DRAFT = 4000;
const MAX_JSON = 20000;

function validate(req: GateRequest): string | null {
  if (typeof req.draft !== "string" || !req.draft.trim()) return "Draft is required.";
  if (req.draft.length > MAX_DRAFT) return `Draft exceeds ${MAX_DRAFT} characters.`;
  for (const [name, value] of [["facts", req.facts], ["recipient", req.recipient], ["policy", req.policy]] as const) {
    if (value.length > MAX_JSON) return `${name} exceeds ${MAX_JSON} characters.`;
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch {
        return `${name} must be valid JSON (or empty).`;
      }
    }
  }
  if (req.truthUrl.trim() && !/^https?:\/\//.test(req.truthUrl.trim())) return "truth_url must be an http(s) URL.";
  return null;
}

/** Runs one draft through send-gate: the deployed Lamatic flow when configured, else the local deterministic stages. */
export async function runSendGate(input: GateRequest): Promise<GateResponse> {
  const req: GateRequest = {
    draft: String(input.draft ?? ""),
    facts: String(input.facts ?? ""),
    recipient: String(input.recipient ?? ""),
    policy: String(input.policy ?? ""),
    needsFactCheck: Boolean(input.needsFactCheck),
    truthUrl: String(input.truthUrl ?? "")
  };
  const mode: GateResponse["mode"] = flowConfigured() ? "flow" : "local";
  const started = Date.now();
  const problem = validate(req);
  if (problem) return { ok: false, mode, elapsedMs: 0, error: problem };
  try {
    const result = mode === "flow" ? await runSendGateFlow(req) : await runSendGateLocally(req);
    return { ok: true, mode, elapsedMs: Date.now() - started, result };
  } catch (e) {
    return { ok: false, mode, elapsedMs: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Lets the UI show which mode it is in before the first run. */
export async function getMode(): Promise<GateResponse["mode"]> {
  return flowConfigured() ? "flow" : "local";
}
