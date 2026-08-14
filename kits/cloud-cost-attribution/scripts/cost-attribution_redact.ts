const rawTrigger = {{triggerNode_1.output}};

const trigger = {
  anomalies: (rawTrigger.anomalies || []).map((s) => (typeof s === "string" ? JSON.parse(s) : s)),
  changeEvents: (rawTrigger.changeEvents || []).map((s) => (typeof s === "string" ? JSON.parse(s) : s)),
  periodLabel: rawTrigger.periodLabel,
  currency: rawTrigger.currency,
};

const MAX_ANOMALIES = 10;
const MAX_CANDIDATES = 25;
const HOUR_MS = 3600000;
const DAY_MS = 24 * HOUR_MS;

function placeholderFor(map, kind, value) {
  if (value === undefined || value === null || value === "") return value;
  const existingKey = Object.keys(map).find((k) => map[k] === value);
  if (existingKey) return existingKey;
  const token = "<" + kind + "-" + (Object.keys(map).length + 1) + ">";
  map[token] = value;
  return token;
}

function selectCandidates(anomaly, changeEvents) {
  const inflection = new Date(anomaly.firstInflectionAt).getTime();
  const windowStart = inflection - 7 * DAY_MS;
  const windowEnd = inflection + 2 * HOUR_MS;
  return changeEvents
    .filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= windowStart && t <= windowEnd;
    })
    .map((e) => ({ e: e, dist: Math.abs(inflection - new Date(e.timestamp).getTime()) }))
    .sort((a, b) => a.dist - b.dist || a.e.id.localeCompare(b.e.id))
    .slice(0, MAX_CANDIDATES)
    .map((x) => x.e);
}

const placeholderMap = {};

const anomalies = (trigger.anomalies || [])
  .slice()
  .sort((a, b) => Math.abs(b.deltaAbs) - Math.abs(a.deltaAbs))
  .slice(0, MAX_ANOMALIES);

const redactedAnomalies = anomalies.map((a) => {
  const candidates = selectCandidates(a, trigger.changeEvents || []).map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    type: e.type,
    title: e.title,
    diffSummary: e.diffSummary,
    filesTouched: e.filesTouched,
  }));

  return {
    id: a.id,
    groupKey: a.groupKey,
    service: a.service,
    region: a.region,
    subAccount: placeholderFor(placeholderMap, "account", a.subAccount),
    skuId: a.skuId,
    resourceType: a.resourceType,
    method: a.method,
    currentCost: a.currentCost,
    baselineCost: a.baselineCost,
    deltaAbs: a.deltaAbs,
    deltaPct: a.deltaPct,
    shareOfTotalDelta: a.shareOfTotalDelta,
    robustZ: a.robustZ,
    firstInflectionAt: a.firstInflectionAt,
    quantityDeltaPct: a.quantityDeltaPct,
    driver: a.driver,
    candidateEvents: candidates,
  };
});

output = {
  redactedAnomalies: redactedAnomalies,
  placeholderMap: placeholderMap,
  periodLabel: trigger.periodLabel,
  currency: trigger.currency,
};
