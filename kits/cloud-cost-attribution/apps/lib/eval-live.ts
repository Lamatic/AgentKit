import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseBillingCsv } from "./parse-billing";
import { detectAnomalies, selectCandidateEvents } from "./detect-anomalies";
import { getLamaticClient, flowIdFor } from "./lamatic-client";
import type { AnomalyEpisode, ChangeEvent, Report } from "./types";

const FIXTURES_DIR = join(__dirname, "..", "..", "assets", "fixtures");

function loadCase(name: string) {
  const csv = readFileSync(join(FIXTURES_DIR, `case-${name}.csv`), "utf8");
  return parseBillingCsv(csv);
}
function loadChangeEvents(): ChangeEvent[] {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, "change-events.json"), "utf8"));
}
function loadExpected(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `expected-${name}.json`), "utf8"));
}

/** The naive baseline this kit claims to beat: nearest candidate event in time, always attributes (never abstains). */
function nearestInTimeBaseline(anomaly: AnomalyEpisode, changeEvents: ChangeEvent[]): string | null {
  const candidates = selectCandidateEvents(anomaly, changeEvents);
  if (candidates.length === 0) return null;
  const inflection = new Date(anomaly.firstInflectionAt).getTime();
  let best = candidates[0];
  let bestDist = Math.abs(inflection - new Date(best.timestamp).getTime());
  for (const c of candidates.slice(1)) {
    const d = Math.abs(inflection - new Date(c.timestamp).getTime());
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best.id;
}

type FlowAttribution = { valid: true; causeEventId: string | null } | { valid: false };

async function attributeViaFlow(anomaly: AnomalyEpisode, changeEvents: ChangeEvent[]): Promise<FlowAttribution> {
  const client = getLamaticClient();
  const raw = await client.executeFlow(flowIdFor("step1"), {
    anomalies: [JSON.stringify(anomaly)],
    changeEvents: changeEvents.map((e) => JSON.stringify(e)),
    periodLabel: "eval",
    currency: "USD",
  });
  const payload = (raw?.result ?? raw) as Report;
  const match = payload.anomalies?.find((a) => a.groupKey === anomaly.groupKey);
  if (!match || !match.attribution || match.attribution.causeEventId === undefined) {
    return { valid: false };
  }
  return { valid: true, causeEventId: match.attribution.causeEventId };
}

async function main(): Promise<void> {
  const changeEvents = loadChangeEvents();
  const cases = ["dataplane", "drift", "rate"] as const;

  let baselineCorrect = 0;
  let flowCorrect = 0;
  let casesRun = 0;
  const rows: any[] = [];
  const failures: string[] = [];

  for (const name of cases) {
    const rows_ = loadCase(name);
    const expected = loadExpected(name);
    const anomalies = detectAnomalies(rows_);
    const anomaly = anomalies.find((a) => a.groupKey === expected.groupKey);
    if (!anomaly) {
      rows.push({ case: name, error: "detector did not find the expected anomaly — see npm run eval" });
      failures.push(`case-${name}: detector missed the expected anomaly`);
      continue;
    }
    casesRun++;

    const baselineGuess = nearestInTimeBaseline(anomaly, changeEvents);
    const baselineOk = baselineGuess === expected.causeEventId;
    if (baselineOk) baselineCorrect++;

    const flowResult = await attributeViaFlow(anomaly, changeEvents);
    const flowGuess = flowResult.valid ? flowResult.causeEventId : undefined;
    const flowOk = flowResult.valid && flowGuess === expected.causeEventId;
    if (flowOk) flowCorrect++;
    if (!flowResult.valid) failures.push(`case-${name}: flow returned no valid attribution result`);

    rows.push({
      case: name,
      expectedCauseEventId: expected.causeEventId,
      baselineGuess,
      baselineCorrect: baselineOk,
      flowGuess: flowResult.valid ? flowGuess : "<invalid flow output>",
      flowCorrect: flowOk,
    });
  }

  const result = {
    generatedAt: new Date().toISOString(),
    models: {
      attribute: "claude-opus-5",
      remediate: "claude-sonnet-5",
    },
    suite: "S1",
    casesRun,
    baselineAccuracy: casesRun === 0 ? 0 : baselineCorrect / casesRun,
    flowAccuracy: casesRun === 0 ? 0 : flowCorrect / casesRun,
    beatsBaseline: flowCorrect > baselineCorrect,
    failures,
    rows,
  };

  writeFileSync(join(__dirname, "..", "eval-results.json"), JSON.stringify(result, null, 2) + "\n");

  console.log(`S1: baseline ${baselineCorrect}/${casesRun}, flow ${flowCorrect}/${casesRun}`);
  console.log(result.beatsBaseline ? "flow beats nearest-in-time baseline" : "flow did NOT beat baseline — report honestly in README");
  console.log("wrote apps/eval-results.json");

  if (failures.length > 0) {
    console.error(`\n${failures.length} case failure(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
