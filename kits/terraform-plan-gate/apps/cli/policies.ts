#!/usr/bin/env tsx
/**
 * Load a policy set into the `tfpolicies` Vector Store through the
 * tf-policy-ingest flow. Run once with no file to load the ten defaults
 * shipped in the flow, or point it at your own JSON:
 *
 *   npm run policies                          # defaults built into the flow
 *   npm run policies -- ../assets/policies.json   # your own set, same shape
 *
 * A policy is { policy_id, title, text, minimum_risk? }. minimum_risk is a
 * floor: a change that cites the policy is rated at least that level, whatever
 * the model said. Loading appends to the store: to
 * change the set, delete the tfpolicies store in Studio first, then run this
 * once. The Index node recreates the store.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Lamatic } from "lamatic";
import kit from "../../lamatic.config";
import { endpoint, env, loadDotEnvLocal } from "./env";

const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
type RiskLevel = (typeof RISK_LEVELS)[number];

interface Policy {
  policy_id: string;
  title: string;
  text: string;
  /** Floor for any change that cites this policy. Defaults to "low" (no floor). */
  minimum_risk?: RiskLevel;
}

function readPolicies(file: string): Policy[] {
  const doc = JSON.parse(readFileSync(resolve(file), "utf8")) as unknown;
  if (!Array.isArray(doc) || doc.length === 0) throw new Error(`${file} must be a non-empty JSON array of { policy_id, title, text }.`);
  const seen = new Set<string>();
  return doc.map((p, i) => {
    if (!p || typeof p !== "object") throw new Error(`policies[${i}] is not an object`);
    const { policy_id, title, text, minimum_risk } = p as Record<string, unknown>;
    if (typeof policy_id !== "string" || typeof title !== "string" || typeof text !== "string") {
      throw new Error(`policies[${i}] needs string policy_id, title and text`);
    }
    const id = policy_id.trim();
    if (!id || !title.trim() || !text.trim()) throw new Error(`policies[${i}] has an empty policy_id, title or text`);
    if (seen.has(id)) throw new Error(`policies[${i}] repeats policy_id ${id}; ids must be unique`);
    seen.add(id);
    if (minimum_risk !== undefined && !(RISK_LEVELS as readonly unknown[]).includes(minimum_risk)) {
      throw new Error(`policies[${i}] minimum_risk must be one of ${RISK_LEVELS.join(", ")}`);
    }
    return { policy_id: id, title: title.trim(), text: text.trim(), ...(minimum_risk !== undefined ? { minimum_risk: minimum_risk as RiskLevel } : {}) };
  });
}

async function main() {
  const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
  loadDotEnvLocal();
  if (file && !existsSync(resolve(file))) throw new Error(`Policy file not found: ${resolve(file)}`);

  const step = kit.steps.find((s) => s.id === "tf-policy-ingest");
  if (!step || !("envKey" in step) || !step.envKey) throw new Error("lamatic.config.ts has no tf-policy-ingest step with an envKey.");

  const policies = file ? readPolicies(file) : [];
  const client = new Lamatic({
    endpoint: endpoint(),
    projectId: env("LAMATIC_PROJECT_ID"),
    apiKey: env("LAMATIC_API_KEY"),
  });
  const raw = (await client.executeFlow(env(step.envKey), {
    run: file ? `policies from ${file}` : "defaults",
    // Same [string] trigger convention as the review flow.
    policies: policies.map((p) => JSON.stringify(p)),
  })) as { status?: string; message?: string; result?: unknown };
  if (raw?.status === "error" || raw?.message) throw new Error(`Lamatic rejected the request: ${raw.message ?? "unknown error"}`);

  const r = (raw.result ?? raw) as { indexed?: unknown; source?: unknown; result?: { recordsIndexed?: unknown; message?: unknown } };
  const indexed = r.result?.recordsIndexed ?? r.indexed;
  if (typeof indexed !== "number" || !Number.isInteger(indexed) || indexed < 1) {
    throw new Error(`The ingest flow did not report an indexed count (got ${JSON.stringify(indexed)}). Check the Index node and the tfpolicies store in Studio.`);
  }
  if (file && indexed !== policies.length) {
    throw new Error(`Sent ${policies.length} policies but the flow indexed ${indexed}. Check the Index node logs in Studio.`);
  }
  if (file && r.source !== "request") {
    throw new Error(`The flow used ${JSON.stringify(r.source)} instead of the supplied policies. Redeploy tf-policy-ingest from flows/tf-policy-ingest.ts.`);
  }
  console.log(
    JSON.stringify({
      source: r.source ?? (file ? "request" : "defaults"),
      indexed,
      message: typeof r.result?.message === "string" ? r.result.message : null,
    })
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 3;
});
