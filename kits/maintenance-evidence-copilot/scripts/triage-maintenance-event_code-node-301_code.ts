
const prepared = {{codeNode_973.output}};
const raw = {{InstructorLLMNode_161.output}};

const ALLOWED = new Set([
  "ASSET-PROFILE-MTR-101-v1",
  "PROC-VIB-01",
  "PROC-TEMP-01",
  "DIAG-GUIDE-01",
  "HIST-WO-217",
  "HIST-WO-233",
  "SOP-LOTO-01"
]);

function parse(v) {
  if (typeof v === "string") return JSON.parse(v);

  if (v?.choices?.[0]?.message?.content) {
    return JSON.parse(v.choices[0].message.content);
  }

  return v || {};
}

function ids(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter(x => ALLOWED.has(x)))];
}

function text(v) {
  return typeof v === "string" ? v.trim() : "";
}

let s = parse(raw);

if (s?.evidenceSynthesis) {
  s = s.evidenceSynthesis;
}

const supportingEvidence = [];
const contradictoryEvidence = [];
const possibleExplanations = [];
const unknowns = [];
const recommendedChecks = [];

function addEvidence(target, item) {
  const statement = text(item?.statement || item?.evidence);
  const sourceIds = ids(item?.sourceIds);

  if (statement && sourceIds.length) {
    target.push({ statement, sourceIds });
  }
}

for (const item of s.supportingEvidence || []) {
  addEvidence(supportingEvidence, item);
}

for (const item of s.contradictoryEvidence || []) {
  addEvidence(contradictoryEvidence, item);
}

for (const item of s.possibleExplanations || []) {
  const label = text(item?.label || item?.explanation);
  let support = ids(item?.supportingSourceIds);
  let contradict = ids(item?.contradictorySourceIds);

  for (const e of item?.supportingEvidence || []) {
    addEvidence(supportingEvidence, e);
    support = [...new Set([...support, ...ids(e?.sourceIds)])];
  }

  for (const e of item?.contradictoryEvidence || []) {
    addEvidence(contradictoryEvidence, e);
    contradict = [...new Set([...contradict, ...ids(e?.sourceIds)])];
  }

  if (label && (support.length || contradict.length)) {
    possibleExplanations.push({
      label,
      status: "unconfirmed",
      supportingSourceIds: support,
      contradictorySourceIds: contradict
    });
  }
}

for (const item of s.unknowns || []) {
  const description =
    typeof item === "string" ? text(item) : text(item?.description);

  if (description) {
    unknowns.push({
      description,
      neededToResolve:
        text(item?.neededToResolve) ||
        "Obtain additional measurements or qualified inspection evidence."
    });
  }
}

for (const item of s.recommendedChecks || []) {
  const action = text(item?.action || item?.check);
  const sourceIds = ids(item?.sourceIds);

  const unsafe =
    /bypass|override|operate exposed|automatic shutdown|automatic repair/i.test(action);

  if (action && sourceIds.length && !unsafe) {
    recommendedChecks.push({
      action,
      rationale:
        text(item?.rationale) ||
        "Verification step grounded in the cited maintenance evidence.",
      sourceIds
    });
  }
}

/* deterministic evidence fallbacks */
if (prepared?.operatingEnvelope?.applicable === true) {
  if (
    prepared?.observations?.vibrationStatus === "warning" &&
    supportingEvidence.length === 0
  ) {
    supportingEvidence.push({
      statement:
        "Vibration is in the warning range and requires confirmation with a second measurement at the same speed and load.",
      sourceIds: ["PROC-VIB-01"]
    });
  }

  if (
    prepared?.observations?.temperatureStatus === "normal" &&
    contradictoryEvidence.length === 0
  ) {
    contradictoryEvidence.push({
      statement:
        "Normal temperature weakens explanations requiring sustained frictional heating but does not eliminate mechanical explanations.",
      sourceIds: ["DIAG-GUIDE-01"]
    });
  }
}

/* deterministic abstention */
if (prepared?.operatingEnvelope?.applicable === false) {
  supportingEvidence.length = 0;
  contradictoryEvidence.length = 0;
  possibleExplanations.length = 0;
  unknowns.length = 0;
  recommendedChecks.length = 0;

  unknowns.push({
    description:
      "The telemetry cannot be evaluated against the configured thresholds because the event is outside the defined operating envelope.",
    neededToResolve:
      "Collect steady-state measurements at 1700–1820 rpm and 60–100% motor load."
  });

  recommendedChecks.push({
    action:
      "Collect new steady-state vibration and bearing-temperature measurements within the defined operating envelope.",
    rationale:
      "The current speed and load are outside the conditions where the synthetic thresholds apply.",
    sourceIds: ["ASSET-PROFILE-MTR-101-v1"]
  });
}
// Deterministic inspection-plan fallback
if (
  prepared?.operatingEnvelope?.applicable === true &&
  recommendedChecks.length === 0
) {
  if (
    ["warning", "critical"].includes(
      prepared?.observations?.vibrationStatus
    )
  ) {
    recommendedChecks.push({
      action:
        "Confirm the vibration reading with a second measurement at the same speed and load.",
      rationale:
        "The vibration status is above the configured normal range and should be verified before drawing a maintenance conclusion.",
      sourceIds: ["PROC-VIB-01"]
    });
  }

  if (
    ["warning", "critical"].includes(
      prepared?.observations?.temperatureStatus
    )
  ) {
    recommendedChecks.push({
      action:
        "Verify the bearing-temperature reading and compare it with load, vibration, lubrication condition, and cooling airflow.",
      rationale:
        "The bearing-temperature status is above the configured normal range and requires verification.",
      sourceIds: ["PROC-TEMP-01"]
    });
  }

  recommendedChecks.push({
    action:
      "Have qualified personnel inspect accessible mounting, lubrication, coupling, and bearing condition; use approved isolation and lockout/tagout procedures wherever physical access requires it.",
    rationale:
      "The available evidence supports inspection, but does not confirm a root cause.",
    sourceIds: ["PROC-VIB-01", "SOP-LOTO-01"]
  });
}

const cited = new Set();

[
  ...supportingEvidence,
  ...contradictoryEvidence,
  ...recommendedChecks
].forEach(x => x.sourceIds.forEach(id => cited.add(id)));

possibleExplanations.forEach(x => {
  x.supportingSourceIds.forEach(id => cited.add(id));
  x.contradictorySourceIds.forEach(id => cited.add(id));
});

output = {
  schemaVersion: "mec.assessment.v1",
  eventId: prepared.eventId,
  asset: prepared.asset,
  priority: prepared.priority,
  observations: prepared.observations,
  supportingEvidence,
  contradictoryEvidence,
  possibleExplanations,
  unknowns,
  recommendedChecks,
  sources: [...cited].map(id => ({ id })),
  rootCauseConfirmed: false,
  disclaimer:
    "Synthetic decision-support demonstration only. This assessment does not confirm a root cause or authorize shutdown, repair, safety bypass, or work on exposed equipment."
};

output.responseJson = JSON.stringify(output);