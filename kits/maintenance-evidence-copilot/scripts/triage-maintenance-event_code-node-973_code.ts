const eventId = {{triggerNode_1.output.eventId}};
const occurredAt = {{triggerNode_1.output.occurredAt}};
const vibration = {{triggerNode_1.output.vibrationRmsMmS}};
const temperature = {{triggerNode_1.output.bearingTemperatureC}};
const speed = {{triggerNode_1.output.shaftSpeedRpm}};
const load = {{triggerNode_1.output.motorLoadPct}};
const operatorNote = {{triggerNode_1.output.operatorNote}};

const isNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const isMissing = (value) =>
  value === null || value === undefined || value === "";

const speedInRange =
  isNumber(speed) && speed >= 1700 && speed <= 1820;

const loadInRange =
  isNumber(load) && load >= 60 && load <= 100;

const envelopeApplicable =
  !isMissing(speed) &&
  !isMissing(load) &&
  speedInRange &&
  loadInRange;

function metricStatus(value, warning, critical) {
  if (isMissing(value)) return "missing";
  if (!envelopeApplicable) return "not_evaluable";
  if (value >= critical) return "critical";
  if (value >= warning) return "warning";
  return "normal";
}

const vibrationStatus = metricStatus(vibration, 4.5, 7.1);
const temperatureStatus = metricStatus(temperature, 80, 90);

let priority = "UNKNOWN";

if (envelopeApplicable) {
  if (
    vibrationStatus === "critical" ||
    temperatureStatus === "critical"
  ) {
    priority = "P1";
  } else if (
    vibrationStatus === "warning" ||
    temperatureStatus === "warning"
  ) {
    priority = "P2";
  } else if (
    vibrationStatus === "normal" &&
    temperatureStatus === "normal"
  ) {
    priority = "P3";
  }
}

output = {
  schemaVersion: "mec.prepare.v1",
  eventId,
  occurredAt,
  asset: {
    assetId: "MTR-101",
    name: "Cooling Fan Drive Motor 101",
    component: "drive-end rolling-element bearing"
  },
  telemetry: {
    vibrationRmsMmS: vibration,
    bearingTemperatureC: temperature,
    shaftSpeedRpm: speed,
    motorLoadPct: load
  },
  operatorNote,
  operatingEnvelope: {
    applicable: envelopeApplicable,
    speedInRange,
    loadInRange
  },
  observations: {
    vibrationStatus,
    temperatureStatus
  },
  priority: {
    code: priority,
    determinedBy: "deterministic_rules"
  },
  rootCauseConfirmed: false
};