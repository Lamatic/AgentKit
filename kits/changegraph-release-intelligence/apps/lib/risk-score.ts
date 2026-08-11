import type {
  BlastRadiusAnalysis,
  RiskAssessment,
  RiskContribution,
  RiskLevel,
  StructuralDiff,
  WorkflowChange,
} from "@/types/changegraph";

interface ContributionAccumulator {
  ruleId: string;
  label: string;
  points: number;
  relatedChangeIds: Set<string>;
}

interface SchemaFacts {
  properties: Map<string, Set<string>>;
  required: Map<string, Set<string>>;
  types: Map<string, string>;
  enums: Map<string, Set<string>>;
}

const SAFETY_TERMS = [
  "safety",
  "guardrail",
  "must not",
  "do not",
  "never",
  "refuse",
  "policy",
  "prohibited",
  "restricted",
];

const WRITE_CAPABILITIES = [
  "write",
  "create",
  "update",
  "delete",
  "remove",
  "send",
  "publish",
  "execute",
  "admin",
  "manage",
  "post",
  "put",
  "patch",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function serialize(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

function valuesDiffer(
  before: unknown,
  after: unknown,
): boolean {
  return serialize(before) !== serialize(after);
}

function isAdded(change: WorkflowChange): boolean {
  return change.before === null && change.after !== null;
}

function isRemoved(change: WorkflowChange): boolean {
  return change.before !== null && change.after === null;
}

function countTerms(
  value: unknown,
  terms: string[],
): number {
  const text = serialize(value);

  return terms.reduce((count, term) => {
    const normalizedTerm =
      term.toLowerCase();

    if (!normalizedTerm) {
      return count;
    }

    return (
      count +
      text.split(normalizedTerm).length -
      1
    );
  }, 0);
}

function capabilityExpanded(
  before: unknown,
  after: unknown,
): boolean {
  const beforeText = serialize(before);
  const afterText = serialize(after);

  return WRITE_CAPABILITIES.some(
    (capability) =>
      afterText.includes(capability) &&
      !beforeText.includes(capability),
  );
}

function safetyInstructionRemoved(
  change: WorkflowChange,
): boolean {
  if (change.category !== "prompt") {
    return false;
  }

  const beforeCount = countTerms(
    change.before,
    SAFETY_TERMS,
  );

  const afterCount = countTerms(
    change.after,
    SAFETY_TERMS,
  );

  return beforeCount > afterCount;
}

function fallbackRemoved(
  change: WorkflowChange,
): boolean {
  if (change.category !== "fallback") {
    return false;
  }

  if (isRemoved(change)) {
    return true;
  }

  const beforeText = serialize(change.before);
  const afterText = serialize(change.after);

  return (
    beforeText.includes("fallback") &&
    !afterText.includes("fallback")
  );
}

function retryRemoved(
  change: WorkflowChange,
): boolean {
  if (change.category !== "retry") {
    return false;
  }

  if (isRemoved(change)) {
    return true;
  }

  const beforeText = serialize(change.before);
  const afterText = serialize(change.after);

  return (
    beforeText.includes("retry") &&
    !afterText.includes("retry")
  );
}

function extractTemperatures(
 value: unknown,
): number[] {
  const temperatures = new Set<number>();

  function addTemperature(
    candidate: unknown,
  ): void {
    const parsed =
      typeof candidate === "number"
        ? candidate
        : typeof candidate === "string"
          ? Number(candidate.trim())
          : Number.NaN;

    if (Number.isFinite(parsed)) {
      temperatures.add(parsed);
    }
  }

  function visit(current: unknown): void {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (isRecord(current)) {
      for (const [key, child] of Object.entries(
        current,
      )) {
        if (
          key.toLowerCase() === "temperature"
        ) {
          addTemperature(child);
        }

        visit(child);
      }

      return;
    }

    if (typeof current !== "string") {
      return;
    }

    const pattern =
      /["']?temperature["']?\s*[:=]\s*["']?(-?\d+(?:\.\d+)?)/gi;

    let match: RegExpExecArray | null;

    while (
      (match = pattern.exec(current)) !== null
    ) {
      addTemperature(match[1]);
    }
  }

  visit(value);

  return [...temperatures];
}

function maximumValue(
  values: number[],
): number | null {
  return values.length > 0
    ? Math.max(...values)
    : null;
}

function temperatureIncreased(
  change: WorkflowChange,
): boolean {
  const beforeTemperature = maximumValue(
    extractTemperatures(change.before),
  );

  const afterTemperature = maximumValue(
    extractTemperatures(change.after),
  );

  return (
    beforeTemperature !== null &&
    afterTemperature !== null &&
    afterTemperature > beforeTemperature
  );
}

function createEmptySchemaFacts(): SchemaFacts {
  return {
    properties: new Map(),
    required: new Map(),
    types: new Map(),
    enums: new Map(),
  };
}

function stringSet(value: unknown): Set<string> {
  if (!Array.isArray(value)) {
    return new Set();
  }

  return new Set(
    value
      .filter(
        (item): item is string =>
          typeof item === "string",
      )
      .map((item) => item.toLowerCase()),
  );
}

function expandJsonStrings(
  value: unknown,
): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      trimmed.startsWith("{") ||
      trimmed.startsWith("[")
    ) {
      try {
        return expandJsonStrings(
          JSON.parse(trimmed),
        );
      } catch {
        return value;
      }
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(expandJsonStrings);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, child]) => [
          key,
          expandJsonStrings(child),
        ],
      ),
    );
  }

  return value;
}

function collectSchemaFacts(
  value: unknown,
): SchemaFacts {
  const facts = createEmptySchemaFacts();

  function visit(
    current: unknown,
    path: string,
  ): void {
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        visit(item, `${path}[${index}]`);
      });

      return;
    }

    if (!isRecord(current)) {
      return;
    }

    if (isRecord(current.properties)) {
      facts.properties.set(
        path,
        new Set(
          Object.keys(current.properties).map((key) =>
            key.toLowerCase(),
          ),
        ),
      );
    }

    if (Array.isArray(current.required)) {
      facts.required.set(
        path,
        stringSet(current.required),
      );
    }

    if (typeof current.type === "string") {
      facts.types.set(
        path,
        current.type.toLowerCase(),
      );
    }

    if (Array.isArray(current.enum)) {
      facts.enums.set(
        path,
        new Set(
          current.enum.map((item) =>
            serialize(item),
          ),
        ),
      );
    }

    for (const [key, child] of Object.entries(current)) {
      const childPath = path
        ? `${path}.${key}`
        : key;

      visit(child, childPath);
    }
  }

  visit(expandJsonStrings(value), "$");

  return facts;
}

function setContainsRemovedValue(
  before: Set<string>,
  after: Set<string>,
): boolean {
  return [...before].some(
    (value) => !after.has(value),
  );
}

function setContainsAddedValue(
  before: Set<string>,
  after: Set<string>,
): boolean {
  return [...after].some(
    (value) => !before.has(value),
  );
}

function schemaLooksBreaking(
  change: WorkflowChange,
): boolean {
  if (change.category !== "schema") {
    return false;
  }

  if (isRemoved(change)) {
    return true;
  }

  if (isAdded(change)) {
    // Adding an entirely new schema is not automatically breaking.
    return false;
  }

  const beforeFacts = collectSchemaFacts(
    change.before,
  );

  const afterFacts = collectSchemaFacts(
    change.after,
  );

  for (
    const [path, beforeProperties]
    of beforeFacts.properties
  ) {
    const afterProperties =
      afterFacts.properties.get(path);

    if (
      !afterProperties ||
      setContainsRemovedValue(
        beforeProperties,
        afterProperties,
      )
    ) {
      return true;
    }
  }

  for (
    const [path, beforeType]
    of beforeFacts.types
  ) {
    const afterType = afterFacts.types.get(path);

    if (afterType && beforeType !== afterType) {
      return true;
    }
  }

  for (
    const [path, beforeRequired]
    of beforeFacts.required
  ) {
    const afterRequired =
      afterFacts.required.get(path);

    if (
      afterRequired &&
      setContainsAddedValue(
        beforeRequired,
        afterRequired,
      )
    ) {
      return true;
    }
  }

  for (
    const [path, beforeEnum]
    of beforeFacts.enums
  ) {
    const afterEnum = afterFacts.enums.get(path);

    if (
      afterEnum &&
      setContainsRemovedValue(
        beforeEnum,
        afterEnum,
      )
    ) {
      return true;
    }
  }

  const extractedFactCount =
    beforeFacts.properties.size +
    beforeFacts.required.size +
    beforeFacts.types.size +
    beforeFacts.enums.size;

  // When a schema is represented as text or a truncated snapshot,
  // the comparison cannot safely prove that it is additive.
  return (
    extractedFactCount === 0 &&
    valuesDiffer(change.before, change.after)
  );
}

function externalWriteToolAdded(
  change: WorkflowChange,
): boolean {
  if (change.category !== "tool") {
    return false;
  }

  return (
    isAdded(change) &&
    capabilityExpanded(null, change.after)
  );
}

function permissionExpanded(
  change: WorkflowChange,
): boolean {
  return (
    change.category === "permission" &&
    capabilityExpanded(
      change.before,
      change.after,
    )
  );
}

function edgeRemoved(
  change: WorkflowChange,
): boolean {
  return (
    change.category === "edge" &&
    isRemoved(change)
  );
}

function modelChanged(
  change: WorkflowChange,
): boolean {
  return (
    change.category === "model" &&
    valuesDiffer(change.before, change.after)
  );
}

function promptWordingChanged(
  change: WorkflowChange,
): boolean {
  return (
    change.category === "prompt" &&
    change.before !== null &&
    change.after !== null &&
    valuesDiffer(change.before, change.after) &&
    !safetyInstructionRemoved(change)
  );
}

function addContribution(
  accumulator: Map<
    string,
    ContributionAccumulator
  >,
  rule: {
    ruleId: string;
    label: string;
    points: number;
  },
  changeId: string,
): void {
  const existing = accumulator.get(rule.ruleId);

  if (existing) {
    existing.relatedChangeIds.add(changeId);
    return;
  }

  accumulator.set(rule.ruleId, {
    ...rule,
    relatedChangeIds: new Set([changeId]),
  });
}

function addBlastRadiusContribution(
  accumulator: Map<
    string,
    ContributionAccumulator
  >,
  blastRadius: BlastRadiusAnalysis,
): void {
  const downstreamCount =
    blastRadius.indirectlyAffectedNodeIds.length;

  if (downstreamCount === 0) {
    return;
  }

  let points: number;

  if (downstreamCount >= 6) {
    points = 12;
  } else if (downstreamCount >= 3) {
    points = 7;
  } else {
    points = 3;
  }

  const relatedChangeIds = new Set(
    blastRadius.nodes.flatMap(
      (node) => node.relatedChangeIds,
    ),
  );

  accumulator.set("wide-blast-radius", {
    ruleId: "wide-blast-radius",
    label: `${downstreamCount} downstream node${
      downstreamCount === 1 ? "" : "s"
    } may be affected`,
    points,
    relatedChangeIds,
  });
}

function riskLevelFromScore(
  score: number,
): RiskLevel {
  if (score >= 70) {
    return "critical";
  }

  if (score >= 30) {
    return "high";
  }

  if (score >= 15) {
    return "medium";
  }

  return "low";
}

function decisionFromScore(
  score: number,
): RiskAssessment["decision"] {
  if (score >= 70) {
    return "block_release";
  }

  if (score >= 30) {
    return "manual_review_required";
  }

  return "safe_to_promote";
}

export function calculateRiskAssessment(
  structuralDiff: StructuralDiff,
  blastRadius: BlastRadiusAnalysis,
): RiskAssessment {
  const accumulator = new Map<
    string,
    ContributionAccumulator
  >();

  for (const change of structuralDiff.changes) {
    if (schemaLooksBreaking(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "breaking-schema-change",
          label:
            "Potentially breaking output or response schema change",
          points: 30,
        },
        change.changeId,
      );
    }

    if (fallbackRemoved(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "fallback-removed",
          label: "Fallback behavior removed",
          points: 25,
        },
        change.changeId,
      );
    }

    if (permissionExpanded(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "permission-expanded",
          label:
            "Tool or workflow permissions expanded",
          points: 25,
        },
        change.changeId,
      );
    }

    if (safetyInstructionRemoved(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "safety-instruction-removed",
          label:
            "Safety or restriction instruction removed",
          points: 25,
        },
        change.changeId,
      );
    }

    if (externalWriteToolAdded(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "external-write-tool-added",
          label:
            "External tool with write capability added",
          points: 20,
        },
        change.changeId,
      );
    }

    if (edgeRemoved(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "edge-removed",
          label: "Workflow connection removed",
          points: 15,
        },
        change.changeId,
      );
    }

    if (retryRemoved(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "retry-removed",
          label: "Retry behavior removed",
          points: 15,
        },
        change.changeId,
      );
    }

    if (modelChanged(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "model-changed",
          label: "Model configuration changed",
          points: 10,
        },
        change.changeId,
      );
    }

    if (temperatureIncreased(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "temperature-increased",
          label:
            "Model temperature increased",
          points: 10,
        },
        change.changeId,
      );
    }

    if (promptWordingChanged(change)) {
      addContribution(
        accumulator,
        {
          ruleId: "prompt-wording-changed",
          label: "Prompt wording changed",
          points: 5,
        },
        change.changeId,
      );
    }
  }

  addBlastRadiusContribution(
    accumulator,
    blastRadius,
  );

  const contributions: RiskContribution[] = [
    ...accumulator.values(),
  ]
    .map((contribution) => ({
      ruleId: contribution.ruleId,
      label: contribution.label,
      points: contribution.points,
      relatedChangeIds: [
        ...contribution.relatedChangeIds,
      ].sort(),
    }))
    .sort((left, right) => {
      if (left.points !== right.points) {
        return right.points - left.points;
      }

      return left.ruleId.localeCompare(right.ruleId);
    });

  const rawScore = contributions.reduce(
    (total, contribution) =>
      total + contribution.points,
    0,
  );

  const score = Math.min(100, rawScore);

  return {
    score,
    level: riskLevelFromScore(score),
    decision: decisionFromScore(score),
    contributions,
  };
}
