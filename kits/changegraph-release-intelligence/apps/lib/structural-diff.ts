import type {
  ChangeCategory,
  ExportedFile,
  ParsedEdge,
  ParsedFlow,
  ParsedNode,
  ParsedSchemaEntry,
  ParsedWorkflowExport,
  StructuralDiff,
  WorkflowChange,
} from "@/types/changegraph";

type PendingChange = Omit<WorkflowChange, "changeId"> & {
  sortKey: string;
};

const VOLATILE_KEYS = new Set([
  "createdat",
  "updatedat",
  "modifiedat",
  "lastmodified",
  "selected",
  "dragging",
  "positionabsolute",
  "measured",
  "width",
  "height",
  "x",
  "y",
]);

const NON_BEHAVIORAL_FILES = new Set([
  "readme.md",
  "agent.md",
  ".gitignore",
  "license",
  "license.md",
  "agents.md",
  "claude.md",
]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizePath(path: string): string {
  return path
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");
}

function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function normalizeForComparison(
  value: unknown,
): unknown {
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return normalizeText(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (!isRecord(value)) {
    return String(value);
  }

  const entries = Object.entries(value)
    .filter(([key, child]) => {
      const normalizedKey = key.toLowerCase();

      return (
        !VOLATILE_KEYS.has(normalizedKey) &&
        child !== undefined &&
        typeof child !== "function"
      );
    })
    .sort(([left], [right]) =>
      left.localeCompare(right),
    )
    .map(([key, child]) => [
      key,
      normalizeForComparison(child),
    ]);

  return Object.fromEntries(entries);
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(normalizeForComparison(value));
}

function valuesEqual(
  left: unknown,
  right: unknown,
): boolean {
  return stableSerialize(left) === stableSerialize(right);
}

function snapshot(
  value: unknown,
  maximumCharacters = 4_000,
): unknown {
  const normalized = normalizeForComparison(value);
  const serialized = JSON.stringify(normalized);

  if (serialized.length <= maximumCharacters) {
    return normalized;
  }

  return {
    truncated: true,
    originalCharacters: serialized.length,
    excerpt: serialized.slice(0, maximumCharacters),
  };
}

function fileSnapshot(file: ExportedFile): unknown {
  return {
    path: file.path,
    size: file.size,
    content: snapshot(file.content),
  };
}

function flowSnapshot(flow: ParsedFlow): unknown {
  return {
    id: flow.id,
    name: flow.name,
    path: flow.path,
    nodeCount: flow.nodes.length,
    edgeCount: flow.edges.length,
    schemaCount: flow.schemas.length,
  };
}

function addPendingChange(
  changes: PendingChange[],
  input: {
    category: ChangeCategory;
    component: string;
    before: unknown;
    after: unknown;
    affectedPaths?: string[];
  },
): void {
  changes.push({
    category: input.category,
    component: input.component,
    before: snapshot(input.before),
    after: snapshot(input.after),
    affectedPaths: [
      ...new Set(input.affectedPaths ?? []),
    ].sort(),
    sortKey: `${input.category}:${input.component}`.toLowerCase(),
  });
}

function mapBy<T>(
  values: T[],
  keySelector: (value: T) => string,
): Map<string, T> {
  return new Map(
    values.map((value) => [
      keySelector(value).toLowerCase(),
      value,
    ]),
  );
}

function inferNodeCategory(
  node: ParsedNode,
): ChangeCategory {
  const searchable = stableSerialize({
    type: node.type,
    name: node.name,
    config: node.config,
  }).toLowerCase();

  if (
    searchable.includes("prompt") ||
    searchable.includes("instruction") ||
    searchable.includes("constitution")
  ) {
    return "prompt";
  }
  if (
  searchable.includes("fallback") ||
  searchable.includes("backup model")
) {
  return "fallback";
}

if (
  searchable.includes("model") ||
  searchable.includes("temperature") ||
  searchable.includes("top_p") ||
  searchable.includes("topp")
) {
  return "model";
}

  if (
    searchable.includes("schema") ||
    searchable.includes("outputmapping") ||
    searchable.includes("responseformat")
  ) {
    return "schema";
  }

  if (
    searchable.includes("fallback") ||
    searchable.includes("backup model")
  ) {
    return "fallback";
  }

  if (
    searchable.includes("retry") ||
    searchable.includes("retry_delay")
  ) {
    return "retry";
  }

  if (
    searchable.includes("condition") ||
    searchable.includes("branch") ||
    searchable.includes("router") ||
    searchable.includes("switch")
  ) {
    return "branching";
  }

  if (
    searchable.includes("permission") ||
    searchable.includes("authorization") ||
    searchable.includes("credential")
  ) {
    return "permission";
  }

  if (
    searchable.includes("tool") ||
    searchable.includes("integration") ||
    searchable.includes("webhook") ||
    searchable.includes("http request")
  ) {
    return "tool";
  }

  if (
    searchable.includes("environment") ||
    searchable.includes("envkey") ||
    searchable.includes("process.env")
  ) {
    return "environment";
  }

  return "node";
}

function inferFileCategory(
  path: string,
): ChangeCategory {
  const normalized = normalizePath(path).toLowerCase();

  if (
    normalized.startsWith("prompts/") ||
    normalized.startsWith("constitutions/")
  ) {
    return "prompt";
  }

  if (normalized.startsWith("model-configs/")) {
    return "model";
  }

  if (normalized.startsWith("tools/")) {
    return "tool";
  }

  if (
    normalized.includes(".env") ||
    normalized.includes("environment") ||
    normalized.endsWith("lamatic.config.ts")
  ) {
    return "environment";
  }

  if (
    normalized.startsWith("triggers/") ||
    normalized.startsWith("memory/") ||
    normalized.startsWith("scripts/")
  ) {
    return "node";
  }

  return "other";
}

function shouldCompareFile(path: string): boolean {
  const filename =
    normalizePath(path).toLowerCase().split("/").at(-1) ??
    "";

  return !NON_BEHAVIORAL_FILES.has(filename);
}

function flowComponent(
  flow: ParsedFlow,
  suffix?: string,
): string {
  return suffix
    ? `${flow.name}/${suffix}`
    : flow.name;
}

function edgeKey(edge: ParsedEdge): string {
  return [
    edge.source,
    edge.target,
    edge.label ?? "",
  ].join("::");
}

function compareNodes(
  baseline: ParsedFlow,
  candidate: ParsedFlow,
  changes: PendingChange[],
): boolean {
  let modified = false;

  const baselineNodes = mapBy(
    baseline.nodes,
    (node) => node.id,
  );

  const candidateNodes = mapBy(
    candidate.nodes,
    (node) => node.id,
  );

  const nodeIds = new Set([
    ...baselineNodes.keys(),
    ...candidateNodes.keys(),
  ]);

  for (const nodeId of [...nodeIds].sort()) {
    const before = baselineNodes.get(nodeId);
    const after = candidateNodes.get(nodeId);

    if (!before && after) {
      modified = true;

      addPendingChange(changes, {
        category: inferNodeCategory(after),
        component: flowComponent(
          candidate,
          after.id,
        ),
        before: null,
        after: after.config,
        affectedPaths: [
          flowComponent(candidate, after.id),
        ],
      });

      continue;
    }

    if (before && !after) {
      modified = true;

      addPendingChange(changes, {
        category: inferNodeCategory(before),
        component: flowComponent(
          baseline,
          before.id,
        ),
        before: before.config,
        after: null,
        affectedPaths: [
          flowComponent(baseline, before.id),
        ],
      });

      continue;
    }

    if (
      before &&
      after &&
      !valuesEqual(before.config, after.config)
    ) {
      modified = true;

      addPendingChange(changes, {
        category: inferNodeCategory(after),
        component: flowComponent(
          candidate,
          after.id,
        ),
        before: before.config,
        after: after.config,
        affectedPaths: [
          flowComponent(candidate, after.id),
        ],
      });
    }
  }

  return modified;
}

function compareEdges(
  baseline: ParsedFlow,
  candidate: ParsedFlow,
  changes: PendingChange[],
): boolean {
  let modified = false;

  const baselineEdges = mapBy(
    baseline.edges,
    edgeKey,
  );

  const candidateEdges = mapBy(
    candidate.edges,
    edgeKey,
  );

  const edgeKeys = new Set([
    ...baselineEdges.keys(),
    ...candidateEdges.keys(),
  ]);

  for (const key of [...edgeKeys].sort()) {
    const before = baselineEdges.get(key);
    const after = candidateEdges.get(key);

    if (!before && after) {
      modified = true;

      const component = flowComponent(
        candidate,
        `${after.source}->${after.target}`,
      );

      addPendingChange(changes, {
        category: "edge",
        component,
        before: null,
        after: after.config,
        affectedPaths: [component],
      });

      continue;
    }

    if (before && !after) {
      modified = true;

      const component = flowComponent(
        baseline,
        `${before.source}->${before.target}`,
      );

      addPendingChange(changes, {
        category: "edge",
        component,
        before: before.config,
        after: null,
        affectedPaths: [component],
      });

      continue;
    }

    if (
      before &&
      after &&
      !valuesEqual(before.config, after.config)
    ) {
      modified = true;

      const component = flowComponent(
        candidate,
        `${after.source}->${after.target}`,
      );

      addPendingChange(changes, {
        category: "edge",
        component,
        before: before.config,
        after: after.config,
        affectedPaths: [component],
      });
    }
  }

  return modified;
}

function compareSchemas(
  baseline: ParsedFlow,
  candidate: ParsedFlow,
  changes: PendingChange[],
): boolean {
  let modified = false;

  const baselineSchemas = mapBy(
    baseline.schemas,
    (schema: ParsedSchemaEntry) => schema.path,
  );

  const candidateSchemas = mapBy(
    candidate.schemas,
    (schema: ParsedSchemaEntry) => schema.path,
  );

  const schemaPaths = new Set([
    ...baselineSchemas.keys(),
    ...candidateSchemas.keys(),
  ]);

  for (const schemaPath of [...schemaPaths].sort()) {
    const before = baselineSchemas.get(schemaPath);
    const after = candidateSchemas.get(schemaPath);

    if (!before && after) {
      modified = true;

      addPendingChange(changes, {
        category: "schema",
        component: flowComponent(
          candidate,
          after.path,
        ),
        before: null,
        after: after.value,
        affectedPaths: [
          flowComponent(candidate, after.path),
        ],
      });

      continue;
    }

    if (before && !after) {
      modified = true;

      addPendingChange(changes, {
        category: "schema",
        component: flowComponent(
          baseline,
          before.path,
        ),
        before: before.value,
        after: null,
        affectedPaths: [
          flowComponent(baseline, before.path),
        ],
      });

      continue;
    }

    if (
      before &&
      after &&
      !valuesEqual(before.value, after.value)
    ) {
      modified = true;

      addPendingChange(changes, {
        category: "schema",
        component: flowComponent(
          candidate,
          after.path,
        ),
        before: before.value,
        after: after.value,
        affectedPaths: [
          flowComponent(candidate, after.path),
        ],
      });
    }
  }

  return modified;
}

function allSupplementalFiles(
  workflow: ParsedWorkflowExport,
): ExportedFile[] {
  const files = [
    ...workflow.prompts,
    ...workflow.modelConfigs,
    ...workflow.constitutions,
    ...workflow.otherFiles,
  ];

  const uniqueFiles = new Map<string, ExportedFile>();

  for (const file of files) {
    const path = normalizePath(file.path);

    if (shouldCompareFile(path)) {
      uniqueFiles.set(path.toLowerCase(), {
        ...file,
        path,
      });
    }
  }

  return [...uniqueFiles.values()];
}

function compareSupplementalFiles(
  baseline: ParsedWorkflowExport,
  candidate: ParsedWorkflowExport,
  changes: PendingChange[],
  addedFiles: Set<string>,
  removedFiles: Set<string>,
  modifiedFiles: Set<string>,
): void {
  const baselineFiles = mapBy(
    allSupplementalFiles(baseline),
    (file) => file.path,
  );

  const candidateFiles = mapBy(
    allSupplementalFiles(candidate),
    (file) => file.path,
  );

  const paths = new Set([
    ...baselineFiles.keys(),
    ...candidateFiles.keys(),
  ]);

  for (const pathKey of [...paths].sort()) {
    const before = baselineFiles.get(pathKey);
    const after = candidateFiles.get(pathKey);

    if (!before && after) {
      addedFiles.add(after.path);

      addPendingChange(changes, {
        category: inferFileCategory(after.path),
        component: after.path,
        before: null,
        after: fileSnapshot(after),
        affectedPaths: [after.path],
      });

      continue;
    }

    if (before && !after) {
      removedFiles.add(before.path);

      addPendingChange(changes, {
        category: inferFileCategory(before.path),
        component: before.path,
        before: fileSnapshot(before),
        after: null,
        affectedPaths: [before.path],
      });

      continue;
    }

    if (
      before &&
      after &&
      normalizeText(before.content) !==
        normalizeText(after.content)
    ) {
      modifiedFiles.add(after.path);

      addPendingChange(changes, {
        category: inferFileCategory(after.path),
        component: after.path,
        before: fileSnapshot(before),
        after: fileSnapshot(after),
        affectedPaths: [after.path],
      });
    }
  }
}

export function compareWorkflowExports(
  baseline: ParsedWorkflowExport,
  candidate: ParsedWorkflowExport,
): StructuralDiff {
  const pendingChanges: PendingChange[] = [];

  const addedFiles = new Set<string>();
  const removedFiles = new Set<string>();
  const modifiedFiles = new Set<string>();

  const baselineFlows = mapBy(
    baseline.flows,
    (flow) => flow.path,
  );

  const candidateFlows = mapBy(
    candidate.flows,
    (flow) => flow.path,
  );

  const flowPaths = new Set([
    ...baselineFlows.keys(),
    ...candidateFlows.keys(),
  ]);

  for (const flowPath of [...flowPaths].sort()) {
    const before = baselineFlows.get(flowPath);
    const after = candidateFlows.get(flowPath);

    if (!before && after) {
      addedFiles.add(after.path);

      addPendingChange(pendingChanges, {
        category: "node",
        component: after.name,
        before: null,
        after: flowSnapshot(after),
        affectedPaths: [after.name],
      });

      continue;
    }

    if (before && !after) {
      removedFiles.add(before.path);

      addPendingChange(pendingChanges, {
        category: "node",
        component: before.name,
        before: flowSnapshot(before),
        after: null,
        affectedPaths: [before.name],
      });

      continue;
    }

    if (!before || !after) {
      continue;
    }

    const nodesModified = compareNodes(
      before,
      after,
      pendingChanges,
    );

    const edgesModified = compareEdges(
      before,
      after,
      pendingChanges,
    );

    const schemasModified = compareSchemas(
      before,
      after,
      pendingChanges,
    );

    if (
      nodesModified ||
      edgesModified ||
      schemasModified
    ) {
      modifiedFiles.add(after.path);
    }
  }

  compareSupplementalFiles(
    baseline,
    candidate,
    pendingChanges,
    addedFiles,
    removedFiles,
    modifiedFiles,
  );

  const changes: WorkflowChange[] = pendingChanges
    .sort((left, right) =>
      left.sortKey.localeCompare(right.sortKey),
    )
    .map((change, index): WorkflowChange => ({
  changeId: `change-${String(index + 1).padStart(3, "0")}`,
  category: change.category,
  component: change.component,
  before: change.before,
  after: change.after,
  affectedPaths: change.affectedPaths,
   }));

  return {
    changes,
    addedFiles: [...addedFiles].sort(),
    removedFiles: [...removedFiles].sort(),
    modifiedFiles: [...modifiedFiles].sort(),
    affectedPaths: [
      ...new Set(
        changes.flatMap(
          (change) => change.affectedPaths,
        ),
      ),
    ].sort(),
    runtimeEvidence: [],
    testsExecuted: [],
  };
}