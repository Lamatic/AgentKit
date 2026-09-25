#!/usr/bin/env tsx
/**
 * Model regression suite: every case in eval/cases/ is a small plan with the
 * verdict and per-change expectations a reviewer would insist on. Run it
 * against the deployed flow after changing a prompt, a policy, a model, or
 * the parser:
 *
 *   npm run eval                     # table, exit 1 if any case fails
 *   npm run eval -- --json           # machine-readable results
 *   npm run eval -- --only tags-only # one case
 *
 * Cases run one at a time with a short pause, and a model rate limit (HTTP
 * 429) is retried after the delay the provider asks for, so a free-tier key
 * can run the whole suite.
 *
 * Expectations are deliberately loose where the model has latitude (a range
 * of verdicts, "at least high") and strict where it does not (the policy id
 * that must be cited, the verdict of the bundled samples).
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnvLocal } from "../cli/env";
import { reviewFacts } from "../cli/review";
import { extractFacts, parsePlan, type TerraformPlan } from "../lib/plan-parse";
import type { ReviewResult, Risk } from "../lib/types";

const RANK: Record<Risk, number> = { low: 1, medium: 2, high: 3, critical: 4, unclassified: 0 };
const PAUSE_BETWEEN_CASES_MS = 4000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function rateLimitDelay(message: string): number | null {
  if (!/429|RateLimit|RESOURCE_EXHAUSTED|quota/i.test(message)) return null;
  const m = message.match(/retry in ([\d.]+)s|"retryDelay":\s*"(\d+)s"/i);
  const seconds = m ? Number(m[1] ?? m[2]) : 45;
  return Math.ceil(seconds + 2) * 1000;
}

async function reviewWithRetry(plan: TerraformPlan): Promise<ReviewResult> {
  const facts = extractFacts(plan);
  for (let attempt = 1; ; attempt++) {
    try {
      return await reviewFacts(facts);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const delay = rateLimitDelay(message);
      if (delay === null || attempt >= 4) throw new Error(message.split("\n")[0].slice(0, 200));
      await sleep(delay);
    }
  }
}

interface ChangeExpectation {
  riskAtLeast?: Risk;
  riskAtMost?: Risk;
  policyIds?: string[];
}
interface Case {
  why?: string;
  plan?: TerraformPlan;
  planFile?: string;
  expect: { verdict: string | string[]; changes?: Record<string, ChangeExpectation> };
}
interface Outcome {
  name: string;
  verdict: string;
  expected: string;
  failures: string[];
  policyFloorsApplied: number;
}

function check(name: string, c: Case, r: ReviewResult): Outcome {
  const failures: string[] = [];
  const wanted = Array.isArray(c.expect.verdict) ? c.expect.verdict : [c.expect.verdict];
  if (!wanted.includes(r.verdict)) failures.push(`verdict ${r.verdict}, expected ${wanted.join(" or ")}`);
  for (const [address, exp] of Object.entries(c.expect.changes ?? {})) {
    const change = r.changes.find((x) => x.address === address);
    if (!change) {
      failures.push(`${address}: missing from the response`);
      continue;
    }
    if (exp.riskAtLeast && RANK[change.risk] < RANK[exp.riskAtLeast]) failures.push(`${address}: risk ${change.risk}, expected at least ${exp.riskAtLeast}`);
    if (exp.riskAtMost && RANK[change.risk] > RANK[exp.riskAtMost]) failures.push(`${address}: risk ${change.risk}, expected at most ${exp.riskAtMost}`);
    for (const id of exp.policyIds ?? []) {
      if (!change.policyIds.includes(id)) failures.push(`${address}: policy ${id} not cited (got ${change.policyIds.join(", ") || "none"})`);
    }
  }
  return { name, verdict: r.verdict, expected: wanted.join("|"), failures, policyFloorsApplied: r.changes.filter((x) => x.policyFloor).length };
}

async function main() {
  const asJson = process.argv.includes("--json");
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
  loadDotEnvLocal();
  const dir = resolve(__dirname, "cases");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && (!only || f === `${only}.json`))
    .sort();
  if (files.length === 0) throw new Error(only ? `No case named ${only} in eval/cases/.` : "No cases in eval/cases/.");
  const outcomes: Outcome[] = [];

  for (const file of files) {
    const name = file.replace(/\.json$/, "");
    const c = JSON.parse(readFileSync(resolve(dir, file), "utf8")) as Case;
    try {
      const plan = c.plan ?? parsePlan(readFileSync(resolve(dir, c.planFile ?? ""), "utf8"));
      const result = await reviewWithRetry(plan);
      outcomes.push(check(name, c, result));
    } catch (e) {
      outcomes.push({ name, verdict: "error", expected: String(c.expect.verdict), failures: [e instanceof Error ? e.message : String(e)], policyFloorsApplied: 0 });
    }
    if (files.indexOf(file) < files.length - 1) await sleep(PAUSE_BETWEEN_CASES_MS);
    if (!asJson) {
      const o = outcomes[outcomes.length - 1];
      const mark = o.failures.length === 0 ? "pass" : "FAIL";
      console.log(`${mark.padEnd(5)} ${name.padEnd(26)} ${o.verdict.padEnd(15)} expected ${o.expected}${o.policyFloorsApplied ? `  (floor applied to ${o.policyFloorsApplied})` : ""}`);
      for (const f of o.failures) console.log(`      - ${f}`);
    }
  }

  const failed = outcomes.filter((o) => o.failures.length > 0).length;
  if (asJson) console.log(JSON.stringify({ passed: outcomes.length - failed, failed, outcomes }, null, 2));
  else console.log(`\n${outcomes.length - failed}/${outcomes.length} cases pass`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 3;
});
