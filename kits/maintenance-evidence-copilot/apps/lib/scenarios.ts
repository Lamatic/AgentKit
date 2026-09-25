export const scenarioIds = ["A", "B", "C"] as const;

export type ScenarioId = (typeof scenarioIds)[number];

export type MaintenanceEventInput = {
  eventId: string;
  occurredAt: string;
  vibrationRmsMmS: number;
  bearingTemperatureC: number;
  shaftSpeedRpm: number;
  motorLoadPct: number;
  operatorNote: string;
};

export type Scenario = {
  id: ScenarioId;
  label: string;
  summary: string;
  input: MaintenanceEventInput;
};

export const scenarios: Record<ScenarioId, Scenario> = {
  A: {
    id: "A",
    label: "Scenario A — Supported concern",
    summary: "Vibration and bearing temperature are both in the warning range within the operating envelope.",
    input: {
    eventId: "EVT-MTR-101-A",
      occurredAt: "2026-08-29T09:00:00Z",
      vibrationRmsMmS: 5.2,
      bearingTemperatureC: 84,
      shaftSpeedRpm: 1760,
      motorLoadPct: 75,
      operatorNote: "Synthetic demonstration event."
    }
  },
  B: {
    id: "B",
    label: "Scenario B — Contradictory evidence",
    summary: "Vibration is in the warning range, while bearing temperature remains normal within the operating envelope.",
    input: {
    eventId: "EVT-MTR-101-B",
      occurredAt: "2026-08-29T09:15:00Z",
      vibrationRmsMmS: 5.2,
      bearingTemperatureC: 72,
      shaftSpeedRpm: 1760,
      motorLoadPct: 75,
      operatorNote: "Synthetic demonstration event."
    }
  },
  C: {
    id: "C",
    label: "Scenario C — Outside operating envelope",
    summary: "The readings are supplied outside the operating envelope and must not be evaluated against the configured thresholds.",
    input: {
    eventId: "EVT-MTR-101-C",
      occurredAt: "2026-08-29T09:30:00Z",
      vibrationRmsMmS: 5.2,
      bearingTemperatureC: 84,
      shaftSpeedRpm: 1600,
      motorLoadPct: 75,
      operatorNote: "Synthetic demonstration event."
    }
  }
};

export function isScenarioId(value: string): value is ScenarioId {
  return scenarioIds.includes(value as ScenarioId);
}
