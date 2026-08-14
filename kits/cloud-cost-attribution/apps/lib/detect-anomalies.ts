import type { AnomalyEpisode, ChangeEvent, FocusRow, HourlyPoint } from "./types";

// Detection algorithm — contract shared by generator, detector, eval.
const ANALYSIS_WINDOW_DAYS = 7;
const BASELINE_WINDOW_DAYS = 21;
const SPIKE_Z_THRESHOLD = 3.5;
const MIN_EPISODE_HOURS = 3;
const DRIFT_MIN_PCT = 25;
const FLOOR_DOLLARS_PER_DAY = 50;
const FLOOR_SHARE_OF_TOTAL = 0.01;
const DRIVER_USAGE_RATIO = 0.8;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

type GroupKey = string;

function groupKeyOf(row: FocusRow): GroupKey {
  return `${row.ServiceName}|${row.RegionId}|${row.ChargeDescription}`;
}

function hourBucketStart(iso: string): number {
  const t = new Date(iso).getTime();
  return t - (t % HOUR_MS);
}

function isWeekendUtc(ms: number): boolean {
  const day = new Date(ms).getUTCDay();
  return day === 0 || day === 6;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mad(nums: number[], med: number): number {
  const deviations = nums.map((n) => Math.abs(n - med));
  return median(deviations);
}

/** Robust z-score */
function robustZ(x: number, med: number, madValue: number): number {
  if (madValue === 0) return x === med ? 0 : Math.sign(x - med) * SPIKE_Z_THRESHOLD;
  return (0.6745 * (x - med)) / madValue;
}

type HourAgg = { hourStart: number; cost: number; qty: number };

function aggregateHourly(rows: FocusRow[]): Map<GroupKey, HourAgg[]> {
  const byGroup = new Map<GroupKey, Map<number, HourAgg>>();
  for (const row of rows) {
    if (row.ChargeCategory !== "Usage") continue;
    const key = groupKeyOf(row);
    const hourStart = hourBucketStart(row.ChargePeriodStart);
    let hours = byGroup.get(key);
    if (!hours) {
      hours = new Map();
      byGroup.set(key, hours);
    }
    const existing = hours.get(hourStart);
    if (existing) {
      existing.cost += row.EffectiveCost;
      existing.qty += row.PricingQuantity;
    } else {
      hours.set(hourStart, { hourStart, cost: row.EffectiveCost, qty: row.PricingQuantity });
    }
  }
  const out = new Map<GroupKey, HourAgg[]>();
  for (const [key, hours] of byGroup) {
    out.set(
      key,
      [...hours.values()].sort((a, b) => a.hourStart - b.hourStart),
    );
  }
  return out;
}

function bucketOf(hourStart: number): string {
  const hourOfDay = new Date(hourStart).getUTCHours();
  return `${hourOfDay}|${isWeekendUtc(hourStart) ? "we" : "wd"}`;
}

function buildBaseline(baselineHours: HourAgg[]): Map<string, { median: number; mad: number }> {
  const byBucket = new Map<string, number[]>();
  for (const h of baselineHours) {
    const b = bucketOf(h.hourStart);
    const arr = byBucket.get(b) ?? [];
    arr.push(h.cost);
    byBucket.set(b, arr);
  }
  const out = new Map<string, { median: number; mad: number }>();
  for (const [b, costs] of byBucket) {
    const med = median(costs);
    out.set(b, { median: med, mad: mad(costs, med) });
  }
  return out;
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

let episodeCounter = 0;

/** Pure, deterministic anomaly detector. Same input rows → identical output. */
export function detectAnomalies(rows: FocusRow[]): AnomalyEpisode[] {
  episodeCounter = 0;
  if (rows.length === 0) return [];

  const maxTs = Math.max(...rows.map((r) => new Date(r.ChargePeriodStart).getTime()));
  const analysisStart = maxTs - ANALYSIS_WINDOW_DAYS * DAY_MS;
  const baselineStart = analysisStart - BASELINE_WINDOW_DAYS * DAY_MS;

  const byGroup = aggregateHourly(rows);
  const candidates: Omit<AnomalyEpisode, "shareOfTotalDelta">[] = [];

  for (const [key, hours] of byGroup) {
    const baselineHours = hours.filter((h) => h.hourStart >= baselineStart && h.hourStart < analysisStart);
    const analysisHours = hours.filter((h) => h.hourStart >= analysisStart && h.hourStart <= maxTs);
    if (analysisHours.length === 0 || baselineHours.length === 0) continue;

    const baseline = buildBaseline(baselineHours);
    const sampleRow = rows.find((r) => groupKeyOf(r) === key)!;

    // --- spike / episode pass ---
    const flags = analysisHours.map((h) => {
      const b = baseline.get(bucketOf(h.hourStart));
      if (!b) return { h, z: 0, flagged: false };
      const z = robustZ(h.cost, b.median, b.mad);
      return { h, z, flagged: Math.abs(z) >= SPIKE_Z_THRESHOLD };
    });

    let episode = findEpisode(flags);

    // --- whole-window totals (used for both spike and drift reporting) ---
    const currentCost = sum(analysisHours.map((h) => h.cost));
    const currentQty = sum(analysisHours.map((h) => h.qty));
    const baselineCostExpected = sum(
      analysisHours.map((h) => baseline.get(bucketOf(h.hourStart))?.median ?? 0),
    );

    let method: "spike" | "drift" | null = null;
    let firstInflectionAt: number | null = null;
    let robustZValue = 0;

    if (episode) {
      method = "spike";
      firstInflectionAt = episode.firstFlaggedHour;
      robustZValue = episode.maxAbsZ;
    } else {
      // --- drift pass: last 7d mean vs prior 14d mean, sustained, no sharp inflection ---
      const priorStart = analysisStart - 14 * DAY_MS;
      const priorHours = hours.filter((h) => h.hourStart >= priorStart && h.hourStart < analysisStart);
      if (priorHours.length > 0) {
        const last7Mean = currentCost / analysisHours.length;
        const prior14Mean = sum(priorHours.map((h) => h.cost)) / priorHours.length;
        const driftPct = prior14Mean === 0 ? 0 : ((last7Mean - prior14Mean) / prior14Mean) * 100;
        if (driftPct >= DRIFT_MIN_PCT) {
          method = "drift";
          firstInflectionAt = analysisHours[0].hourStart;
        }
      }
    }

    if (!method || firstInflectionAt === null) continue;

    const deltaAbs = currentCost - baselineCostExpected;
    const deltaPct = baselineCostExpected === 0 ? 100 : (deltaAbs / baselineCostExpected) * 100;

    // floor (applied after shareOfTotalDelta is known, see below) — pre-check the $/day leg now
    const dollarsPerDay = deltaAbs / ANALYSIS_WINDOW_DAYS;
    if (dollarsPerDay < FLOOR_DOLLARS_PER_DAY) continue;

    const baselineQtyExpected =
      baselineHours.length === 0 ? 0 : (sum(baselineHours.map((h) => h.qty)) / baselineHours.length) * analysisHours.length;
    const quantityDeltaPct =
      baselineQtyExpected === 0 ? 0 : ((currentQty - baselineQtyExpected) / baselineQtyExpected) * 100;
    const driver: "usage" | "rate" =
      Math.abs(quantityDeltaPct) >= DRIVER_USAGE_RATIO * Math.abs(deltaPct) ? "usage" : "rate";

    const hourlySeries: HourlyPoint[] = analysisHours.map((h) => ({
      ts: new Date(h.hourStart).toISOString(),
      cost: h.cost,
      qty: h.qty,
    }));

    episodeCounter += 1;
    candidates.push({
      id: `anom-${episodeCounter}`,
      groupKey: key,
      service: sampleRow.ServiceName,
      region: sampleRow.RegionId,
      subAccount: sampleRow.SubAccountId,
      skuId: sampleRow.SkuId,
      resourceType: sampleRow.ResourceType,
      method,
      currentCost,
      baselineCost: baselineCostExpected,
      deltaAbs,
      deltaPct,
      robustZ: robustZValue,
      firstInflectionAt: new Date(firstInflectionAt).toISOString(),
      quantityDeltaPct,
      driver,
      hourlySeries,
    });
  }

  const totalAbsDelta = sum(candidates.map((c) => Math.abs(c.deltaAbs))) || 1;

  const episodes: AnomalyEpisode[] = candidates
    .map((c) => ({ ...c, shareOfTotalDelta: Math.abs(c.deltaAbs) / totalAbsDelta }))
    .filter((c) => c.shareOfTotalDelta >= FLOOR_SHARE_OF_TOTAL); // floor, second leg

  // Sorted deltaAbs desc, stable
  return stableSortByDeltaAbsDesc(episodes);
}

function stableSortByDeltaAbsDesc(episodes: AnomalyEpisode[]): AnomalyEpisode[] {
  return episodes
    .map((e, idx) => ({ e, idx }))
    .sort((a, b) => Math.abs(b.e.deltaAbs) - Math.abs(a.e.deltaAbs) || a.idx - b.idx)
    .map(({ e }) => e);
}

function findEpisode(
  flags: { h: HourAgg; z: number; flagged: boolean }[],
): { firstFlaggedHour: number; maxAbsZ: number } | null {
  let runStart = -1;
  for (let i = 0; i < flags.length; i++) {
    if (flags[i].flagged) {
      if (runStart === -1) runStart = i;
      const runLen = i - runStart + 1;
      if (runLen >= MIN_EPISODE_HOURS) {
        const run = flags.slice(runStart, i + 1);
        const maxAbsZ = Math.max(...run.map((f) => Math.abs(f.z)));
        return { firstFlaggedHour: flags[runStart].h.hourStart, maxAbsZ };
      }
    } else {
      runStart = -1;
    }
  }
  return null;
}

/**
 * Candidate change events for an anomaly: window [inflection - 7d, inflection + 2h],
 * capped at 25, nearest-to-inflection first (deterministic tie-break by id).
 */
export function selectCandidateEvents(anomaly: AnomalyEpisode, changeEvents: ChangeEvent[]): ChangeEvent[] {
  const inflection = new Date(anomaly.firstInflectionAt).getTime();
  const windowStart = inflection - 7 * DAY_MS;
  const windowEnd = inflection + 2 * HOUR_MS;

  return changeEvents
    .filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= windowStart && t <= windowEnd;
    })
    .map((e) => ({ e, dist: Math.abs(inflection - new Date(e.timestamp).getTime()) }))
    .sort((a, b) => a.dist - b.dist || a.e.id.localeCompare(b.e.id))
    .slice(0, 25)
    .map(({ e }) => e);
}
