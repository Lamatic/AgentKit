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

async function attributeViaFlow(anomaly: AnomalyEpisode, changeEvents: ChangeEvent[]): Promise<string | null> {
  const client = getLamaticClient();
  const raw = await client.executeFlow(flowIdFor("step1"), {
    anomalies: [JSON.stringify(anomaly)],
    changeEvents: changeEvents.map((e) => JSON.stringify(e)),
    periodLabel: "eval",
    currency: "USD",
  });
  const payload = (raw?.result ?? raw) as Report;
  const match = payload.anomalies?.find((a) => a.groupKey === anomaly.groupKey);
  return match?.attribution.causeEventId ?? null;
}

async function main(): Promise<void> {
  const changeEvents = loadChangeEvents();
  const cases = ["dataplane", "drift", "rate"] as const;

  let baselineCorrect = 0;
  let flowCorrect = 0;
  const rows: any[] = [];

  for (const name of cases) {
    const rows_ = loadCase(name);
    const expected = loadExpected(name);
    const anomalies = detectAnomalies(rows_);
    const anomaly = anomalies.find((a) => a.groupKey === expected.groupKey);
    if (!anomaly) {
      rows.push({ case: name, error: "detector did not find the expected anomaly — see npm run eval" });
      continue;
    }

    const baselineGuess = nearestInTimeBaseline(anomaly, changeEvents);
    const baselineOk = baselineGuess === expected.causeEventId;
    if (baselineOk) baselineCorrect++;

    const flowGuess = await attributeViaFlow(anomaly, changeEvents);
    const flowOk = flowGuess === expected.causeEventId;
    if (flowOk) flowCorrect++;

    rows.push({
      case: name,
      expectedCauseEventId: expected.causeEventId,
      baselineGuess,
      baselineCorrect: baselineOk,
      flowGuess,
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
    casesRun: cases.length,
    baselineAccuracy: baselineCorrect / cases.length,
    flowAccuracy: flowCorrect / cases.length,
    beatsBaseline: flowCorrect > baselineCorrect,
    rows,
  };

  writeFileSync(join(__dirname, "..", "eval-results.json"), JSON.stringify(result, null, 2) + "\n");

  console.log(`S1: baseline ${baselineCorrect}/${cases.length}, flow ${flowCorrect}/${cases.length}`);
  console.log(result.beatsBaseline ? "flow beats nearest-in-time baseline" : "flow did NOT beat baseline — report honestly in README");
  console.log("wrote apps/eval-results.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
