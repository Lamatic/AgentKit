export type SourceCitation = {
  id: string;
};

export type EvidenceItem = {
  statement: string;
  sourceIds: string[];
};

export type PossibleExplanation = {
  label: string;
  status: "unconfirmed";
  supportingSourceIds: string[];
  contradictorySourceIds: string[];
};

export type UnknownItem = {
  description: string;
  neededToResolve: string;
};

export type RecommendedCheck = {
  action: string;
  rationale: string;
  sourceIds: string[];
};

export type Assessment = {
  schemaVersion: string;
  eventId: string;
  asset: {
    assetId: string;
    name: string;
    component: string;
  };
  priority: {
    code: string;
    determinedBy?: string;
  };
  observations: {
    vibrationStatus: string;
    temperatureStatus: string;
  };
  supportingEvidence: EvidenceItem[];
  contradictoryEvidence: EvidenceItem[];
  possibleExplanations: PossibleExplanation[];
  unknowns: UnknownItem[];
  recommendedChecks: RecommendedCheck[];
  sources: SourceCitation[];
  rootCauseConfirmed: false;
  disclaimer: string;
};

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown, label: string): RecordValue {
  if (!isRecord(value)) {
    throw new Error(`Lamatic returned an invalid ${label}.`);
  }
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Lamatic returned an invalid ${label}.`);
  }
  return value;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseJsonIfNeeded(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Lamatic returned assessmentJson as invalid JSON.");
  }
}

function readEvidenceItems(value: unknown): EvidenceItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.statement !== "string") return [];
    return [{ statement: item.statement, sourceIds: asStringArray(item.sourceIds) }];
  });
}

function readExplanations(value: unknown): PossibleExplanation[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.label !== "string") return [];
    return [{
      label: item.label,
      status: "unconfirmed",
      supportingSourceIds: asStringArray(item.supportingSourceIds),
      contradictorySourceIds: asStringArray(item.contradictorySourceIds)
    }];
  });
}

function readUnknowns(value: unknown): UnknownItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.description !== "string" || typeof item.neededToResolve !== "string") {
      return [];
    }
    return [{ description: item.description, neededToResolve: item.neededToResolve }];
  });
}

function readChecks(value: unknown): RecommendedCheck[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.action !== "string" || typeof item.rationale !== "string") {
      return [];
    }
    return [{ action: item.action, rationale: item.rationale, sourceIds: asStringArray(item.sourceIds) }];
  });
}

function readSources(value: unknown): SourceCitation[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string") return [];
    return [{ id: item.id }];
  });
}

export function decodeAssessment(value: unknown): Assessment {
  const assessment = asRecord(parseJsonIfNeeded(value), "assessmentJson payload");
  const asset = asRecord(assessment.asset, "asset");
  const priority = asRecord(assessment.priority, "priority");
  const observations = asRecord(assessment.observations, "observations");

  return {
    schemaVersion: asString(assessment.schemaVersion, "schemaVersion"),
    eventId: asString(assessment.eventId, "eventId"),
    asset: {
      assetId: asString(asset.assetId, "asset.assetId"),
      name: asString(asset.name, "asset.name"),
      component: asString(asset.component, "asset.component")
    },
    priority: {
      code: asString(priority.code, "priority.code"),
      determinedBy: typeof priority.determinedBy === "string" ? priority.determinedBy : undefined
    },
    observations: {
      vibrationStatus: asString(observations.vibrationStatus, "observations.vibrationStatus"),
      temperatureStatus: asString(observations.temperatureStatus, "observations.temperatureStatus")
    },
    supportingEvidence: readEvidenceItems(assessment.supportingEvidence),
    contradictoryEvidence: readEvidenceItems(assessment.contradictoryEvidence),
    possibleExplanations: readExplanations(assessment.possibleExplanations),
    unknowns: readUnknowns(assessment.unknowns),
    recommendedChecks: readChecks(assessment.recommendedChecks),
    sources: readSources(assessment.sources),
    rootCauseConfirmed: false,
    disclaimer: asString(assessment.disclaimer, "disclaimer")
  };
}

export function decodeAssessmentResponse(response: unknown): Assessment {
  const envelope = asRecord(response, "flow response");
  const candidates = [
    envelope.assessmentJson,
    isRecord(envelope.result) ? envelope.result.assessmentJson : undefined,
    isRecord(envelope.data) ? envelope.data.assessmentJson : undefined
  ];

  const assessmentJson = candidates.find((candidate) => candidate !== undefined);
  if (assessmentJson === undefined) {
    throw new Error("Lamatic response did not include assessmentJson.");
  }

  return decodeAssessment(assessmentJson);
}
