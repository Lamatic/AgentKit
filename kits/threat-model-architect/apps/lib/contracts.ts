import { z } from "zod";

const text = z.string().trim().min(1);
const stringList = z.array(text);
const idList = z.array(text);

const intakeInputSchema = z.object({
  systemDescription: z
    .string()
    .trim()
    .min(1, "Describe the system to begin analysis.")
    .max(6_000, "System descriptions cannot exceed 6,000 characters."),
  sessionState: z.record(z.string(), z.unknown()).optional(),
  accessToken: z.string().max(512).optional(),
});

const intakeStateSchema = z.object({
  system_name: z.string(),
  purpose: z.string(),
  components: z.array(z.record(z.string(), z.unknown())),
  data_assets: z.array(z.record(z.string(), z.unknown())),
  trust_boundaries: z.array(z.record(z.string(), z.unknown())),
  user_roles: z.array(z.string()),
  compliance_notes: z.array(z.string()),
  tech_stack: z.array(z.string()),
});

const intakeResultSchema = z.object({
  language: text,
  assistant_message: text,
  is_complete: z.boolean(),
  session_state: intakeStateSchema,
  missing_info: stringList,
});

const componentSchema = z.object({
  id: text,
  name: text,
  type: text,
  technologies: stringList,
  description: text,
  trust_zone: text,
  confidence: text,
});

const externalActorSchema = z.object({
  id: text,
  name: text,
  type: text,
  description: text,
  trust_zone: text,
});

const dataAssetSchema = z.object({
  id: text,
  name: text,
  sensitivity: text,
  description: text,
});

const trustBoundarySchema = z.object({
  id: text,
  name: text,
  from_zone: text,
  to_zone: text,
  components_crossed: idList,
  description: text,
});

const dataFlowSchema = z.object({
  id: text,
  from_component_id: text,
  to_component_id: text,
  protocol: text,
  data_assets: idList,
  authentication: text,
  confidence: text,
});

const entryPointSchema = z.object({
  id: text,
  name: text,
  component_id: text,
  exposed_to: text,
  description: text,
});

const architectureSchema = z.object({
  system_name: text,
  purpose: text,
  components: z.array(componentSchema).min(1),
  external_actors: z.array(externalActorSchema).min(1),
  data_assets: z.array(dataAssetSchema),
  trust_boundaries: z.array(trustBoundarySchema).min(1),
  data_flows: z.array(dataFlowSchema).min(1),
  entry_points: z.array(entryPointSchema).min(1),
  security_assumptions: stringList,
  missing_info: stringList,
});

const strideCategorySchema = z.enum([
  "spoofing",
  "tampering",
  "repudiation",
  "information_disclosure",
  "denial_of_service",
  "elevation_of_privilege",
]);

const threatSchema = z.object({
  id: text,
  title: text,
  stride_category: strideCategorySchema,
  component_ids: idList,
  data_flow_ids: idList,
  description: text,
  impact: text,
  preconditions: stringList,
  evidence: z.enum(["stated", "inferred"]),
  confidence: z.enum(["low", "medium", "high"]),
  mitigations: z.array(text).min(1),
  open_questions: stringList,
});

const strideSchema = z.object({
  system_name: text,
  summary: text,
  threats: z.array(threatSchema).min(1),
  coverage: z.object({
    analyzed_components: idList,
    stride_categories_covered: z
      .array(strideCategorySchema)
      .refine((categories) => new Set(categories).size === categories.length, {
        message: "STRIDE coverage categories must be unique.",
      }),
  }),
  missing_info: stringList,
});

const researchSchema = z.object({
  research_findings: z
    .array(
      z.object({
        threat_id: text,
        status: z.literal("research_needed"),
        owasp_category: text,
        cwe_ids: stringList,
        risk_pattern: text,
        validation_steps: z.array(text).min(1),
        source_types: stringList,
        verified_cves: z.array(z.string()).max(0),
      }),
    )
    .min(1),
  research_summary: text,
  research_limitations: z.array(text).min(1),
});

const dreadThreatSchema = z.object({
  threat_id: text,
  title: text,
  priority: z.enum(["critical", "high", "medium", "low"]),
  damage: z.number().int().min(1).max(10),
  reproducibility: z.number().int().min(1).max(10),
  exploitability: z.number().int().min(1).max(10),
  affected_users: z.number().int().min(1).max(10),
  discoverability: z.number().int().min(1).max(10),
  total: z.number().int().min(5).max(50),
  rationale: text,
  assumptions: stringList,
});

const prioritizationSchema = z.object({
  executive_risk_summary: text,
  ranked_threats: z.array(dreadThreatSchema).min(1),
  scoring_assumptions: stringList,
});

export type IntakeInputContract = z.infer<typeof intakeInputSchema>;
export type IntakeResult = z.infer<typeof intakeResultSchema>;
export type Architecture = z.infer<typeof architectureSchema>;
export type StrideAnalysis = z.infer<typeof strideSchema>;
export type ResearchFindings = z.infer<typeof researchSchema>;
export type Prioritization = z.infer<typeof prioritizationSchema>;

function parse<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      throw new Error(`${label} was not valid JSON.`);
    }
  }

  const result = schema.safeParse(candidate);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? ` at ${issue.path.join(".")}` : "";
    const detail = issue?.message ? ` ${issue.message}` : "";
    throw new Error(`${label} violated its output contract${path}.${detail}`);
  }
  return result.data;
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} contains duplicate IDs.`);
  }
}

export function validateIntakeInput(value: unknown): IntakeInputContract {
  return parse(intakeInputSchema, value, "Threat-model request");
}

export function parseIntakeResult(value: unknown): IntakeResult {
  return parse(intakeResultSchema, value, "Intake response");
}

export function parseArchitecture(value: unknown): Architecture {
  const architecture = parse(architectureSchema, value, "Architecture response");
  const componentIds = architecture.components.map(({ id }) => id);
  const actorIds = architecture.external_actors.map(({ id }) => id);
  const endpointIds = new Set([...componentIds, ...actorIds]);
  const dataAssetIds = new Set(architecture.data_assets.map(({ id }) => id));

  assertUnique([...componentIds, ...actorIds], "Architecture");
  assertUnique(architecture.data_flows.map(({ id }) => id), "Architecture data flows");

  for (const flow of architecture.data_flows) {
    if (!endpointIds.has(flow.from_component_id) || !endpointIds.has(flow.to_component_id)) {
      throw new Error(`Architecture data flow ${flow.id} references an unknown endpoint.`);
    }
    if (flow.data_assets.some((id) => !dataAssetIds.has(id))) {
      throw new Error(`Architecture data flow ${flow.id} references an unknown data asset.`);
    }
  }
  for (const boundary of architecture.trust_boundaries) {
    if (boundary.components_crossed.some((id) => !endpointIds.has(id))) {
      throw new Error(`Architecture trust boundary ${boundary.id} references an unknown endpoint.`);
    }
  }
  for (const entryPoint of architecture.entry_points) {
    if (!endpointIds.has(entryPoint.component_id)) {
      throw new Error(`Architecture entry point ${entryPoint.id} references an unknown endpoint.`);
    }
  }
  return architecture;
}

export function parseStride(
  value: unknown,
  architecture?: Architecture,
): StrideAnalysis {
  const stride = parse(strideSchema, value, "STRIDE response");
  assertUnique(stride.threats.map(({ id }) => id), "STRIDE response");
  const representedCategories = new Set(stride.threats.map(({ stride_category }) => stride_category));
  const coveredCategories = new Set(stride.coverage.stride_categories_covered);
  if (
    representedCategories.size !== coveredCategories.size ||
    [...representedCategories].some((category) => !coveredCategories.has(category))
  ) {
    throw new Error(
      "STRIDE response coverage must match the distinct categories represented by threats.",
    );
  }

  if (architecture) {
    const componentIds = new Set([
      ...architecture.components.map(({ id }) => id),
      ...architecture.external_actors.map(({ id }) => id),
    ]);
    const flowIds = new Set(architecture.data_flows.map(({ id }) => id));
    for (const threat of stride.threats) {
      if (threat.component_ids.some((id) => !componentIds.has(id))) {
        throw new Error(`STRIDE threat ${threat.id} references an unknown component.`);
      }
      if (threat.data_flow_ids.some((id) => !flowIds.has(id))) {
        throw new Error(`STRIDE threat ${threat.id} references an unknown data flow.`);
      }
    }
  }
  return stride;
}

export function parseResearch(
  value: unknown,
  stride: StrideAnalysis,
): ResearchFindings {
  const research = parse(researchSchema, value, "Research response");
  const threatIds = new Set(stride.threats.map(({ id }) => id));
  assertUnique(
    research.research_findings.map(({ threat_id }) => threat_id),
    "Research response",
  );
  for (const finding of research.research_findings) {
    if (!threatIds.has(finding.threat_id)) {
      throw new Error(`Research response references unknown threat ${finding.threat_id}.`);
    }
  }
  if (
    !research.research_limitations.includes(
      "No live CVE or advisory lookup is connected to this flow.",
    )
  ) {
    throw new Error("Research response omitted the mandatory source limitation.");
  }
  return research;
}

export function parsePrioritization(
  value: unknown,
  stride: StrideAnalysis,
): Prioritization {
  const prioritization = parse(
    prioritizationSchema,
    value,
    "DREAD response",
  );
  const threatIds = new Set(stride.threats.map(({ id }) => id));
  assertUnique(
    prioritization.ranked_threats.map(({ threat_id }) => threat_id),
    "DREAD response",
  );
  for (const threat of prioritization.ranked_threats) {
    if (!threatIds.has(threat.threat_id)) {
      throw new Error(`DREAD response references unknown threat ${threat.threat_id}.`);
    }
  }
  return prioritization;
}

export function normalizePrioritization(
  prioritization: Prioritization,
): Prioritization {
  const rankedThreats = prioritization.ranked_threats
    .map((threat) => {
      const total =
        threat.damage +
        threat.reproducibility +
        threat.exploitability +
        threat.affected_users +
        threat.discoverability;
      const priority =
        total >= 40
          ? "critical"
          : total >= 30
            ? "high"
            : total >= 20
              ? "medium"
              : "low";
      return { ...threat, total, priority } as const;
    })
    .sort((left, right) => right.total - left.total);

  return { ...prioritization, ranked_threats: rankedThreats };
}
