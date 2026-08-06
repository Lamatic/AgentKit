import type {
  ExportedFile,
  ExportedWorkflow,
  ParsedEdge,
  ParsedFlow,
  ParsedNode,
  ParsedSchemaEntry,
  ParsedWorkflowExport,
} from "@/types/changegraph";

const FLOW_FILE_PATTERN = /^flows\/.+\.(?:ts|js|json)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function filenameWithoutExtension(path: string): string {
  const filename = normalizePath(path).split("/").at(-1) ?? path;

  return filename.replace(/\.(?:ts|js|json)$/i, "");
}

function escapeRegExp(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

/**
 * Extracts an exported JSON-compatible object or array without
 * importing or executing the uploaded TypeScript.
 *
 * Supported examples:
 *
 * export const meta = { ... };
 * export const nodes = [ ... ];
 * export const edges = [ ... ];
 */
function parseExportedJsonValue(
  content: string,
  exportName: string,
): unknown | null {
  const pattern = new RegExp(
    `export\\s+const\\s+${escapeRegExp(
      exportName,
    )}\\s*=\\s*`,
    "m",
  );

  const match = pattern.exec(content);

  if (!match) {
    return null;
  }

  let start =
    match.index + match[0].length;

  while (
    start < content.length &&
    /\s/.test(content[start])
  ) {
    start += 1;
  }

  const openingCharacter = content[start];

  if (
    openingCharacter !== "{" &&
    openingCharacter !== "["
  ) {
    return null;
  }

  const closingCharacter =
    openingCharacter === "{" ? "}" : "]";

  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (
    let index = start;
    index < content.length;
    index += 1
  ) {
    const character = content[index];

    if (quote !== null) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (
      character === '"' ||
      character === "'" ||
      character === "`"
    ) {
      quote = character;
      continue;
    }

    if (character === openingCharacter) {
      depth += 1;
      continue;
    }

    if (character === closingCharacter) {
      depth -= 1;

      if (depth === 0) {
        const serializedValue =
          content.slice(start, index + 1);

        try {
          return JSON.parse(
            serializedValue,
          );
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function parseExportedFlow(
  content: string,
): Record<string, unknown> | null {
  const normalized =
    content.replace(/^\uFEFF/, "");

  const exportsToRead = [
    "meta",
    "inputs",
    "references",
    "nodes",
    "edges",
  ] as const;

  const parsed: Record<string, unknown> =
    {};

  for (const exportName of exportsToRead) {
    const value = parseExportedJsonValue(
      normalized,
      exportName,
    );

    if (value !== null) {
      parsed[exportName] = value;
    }
  }

  if (
    !Array.isArray(parsed.nodes) ||
    !Array.isArray(parsed.edges)
  ) {
    return null;
  }

  return parsed;
}

function collectArraysByKey(
  root: unknown,
  acceptedKeys: Set<string>,
): unknown[][] {
  const results: unknown[][] = [];

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }

      return;
    }

    if (!isRecord(value)) {
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      if (
        acceptedKeys.has(key.toLowerCase()) &&
        Array.isArray(child)
      ) {
        results.push(child);
      }

      visit(child);
    }
  }

  visit(root);

  return results;
}

function parseNode(
  value: unknown,
): ParsedNode | null {
  if (!isRecord(value)) {
    return null;
  }

  const data = isRecord(value.data)
    ? value.data
    : {};

  const values = isRecord(data.values)
    ? data.values
    : {};

  const id = firstString(
    value.id,
    value.nodeId,
    value.uuid,
    data.id,
    data.nodeId,
    values.id,
    values.nodeId,
  );

  if (!id) {
    return null;
  }

  const type =
    firstString(
      value.type,
      value.nodeType,
      value.kind,
      data.type,
      data.nodeType,
      data.nodeId,
      values.type,
      values.nodeType,
    ) ?? "unknown";

  const name =
    firstString(
      values.nodeName,
      values.name,
      values.label,
      value.nodeName,
      value.name,
      value.label,
      value.title,
      data.nodeName,
      data.name,
      data.label,
      data.title,
    ) ?? id;

  return {
    id,
    type,
    name,
    config: value,
  };
}

function parseEdge(
  value: unknown,
  index: number,
): ParsedEdge | null {
  if (!isRecord(value)) {
    return null;
  }

  const data = isRecord(value.data)
    ? value.data
    : {};

  const values = isRecord(data.values)
    ? data.values
    : {};

  const source = firstString(
    value.source,
    value.sourceId,
    value.from,
    value.fromNode,
    value.fromNodeId,
    data.source,
    data.sourceId,
    data.from,
    data.fromNode,
    data.fromNodeId,
    values.source,
    values.sourceId,
    values.from,
  );

  const target = firstString(
    value.target,
    value.targetId,
    value.to,
    value.toNode,
    value.toNodeId,
    data.target,
    data.targetId,
    data.to,
    data.toNode,
    data.toNodeId,
    values.target,
    values.targetId,
    values.to,
  );

  if (!source || !target) {
    return null;
  }

  const id =
    firstString(
      value.id,
      value.edgeId,
      data.id,
      data.edgeId,
      values.id,
      values.edgeId,
    ) ?? `${source}->${target}:${index}`;

  const label = firstString(
    value.label,
    value.name,
    data.label,
    data.name,
    values.label,
    values.name,
  );

  return {
    id,
    source,
    target,
    ...(label ? { label } : {}),
    config: value,
  };
}

function deduplicateNodes(nodes: ParsedNode[]): ParsedNode[] {
  const result = new Map<string, ParsedNode>();

  for (const node of nodes) {
    result.set(node.id, node);
  }

  return [...result.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function deduplicateEdges(edges: ParsedEdge[]): ParsedEdge[] {
  const result = new Map<string, ParsedEdge>();

  for (const edge of edges) {
    result.set(edge.id, edge);
  }

  return [...result.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function collectSchemas(root: unknown): ParsedSchemaEntry[] {
  const schemas: ParsedSchemaEntry[] = [];

  function visit(value: unknown, path: string): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        visit(item, `${path}[${index}]`);
      });

      return;
    }

    if (!isRecord(value)) {
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key;

      if (/schema/i.test(key)) {
        schemas.push({
          path: childPath,
          value: child,
        });
      }

      visit(child, childPath);
    }
  }

  visit(root, "");

  return schemas;
}

function extractEnvironmentReferences(
  files: ExportedFile[],
): string[] {
  const references = new Set<string>();

  const generalPatterns = [
    /process\.env\.([A-Z][A-Z0-9_]*)/g,
    /\b(?:envKey|environmentVariable)\s*[:=]\s*["']([A-Z][A-Z0-9_]*)["']/g,
    /\$\{([A-Z][A-Z0-9_]{2,})\}/g,
  ];

  const dotenvPattern =
    /^\s*(?:export\s+)?([A-Z][A-Z0-9_]{2,})\s*=/gm;

  for (const file of files) {
    const normalizedPath =
      file.path.replaceAll("\\", "/");

    const patterns =
      /(^|\/)\.env(?:\.[^/]*)?$/i.test(
        normalizedPath,
      )
        ? [...generalPatterns, dotenvPattern]
        : generalPatterns;

    for (const pattern of patterns) {
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;

      while ((match = pattern.exec(file.content)) !== null) {
        const reference = match[1];

        if (reference) {
          references.add(reference);
        }
      }
    }
  }

  return [...references].sort();
}

function parseFlowFile(
  file: ExportedFile,
  warnings: string[],
): ParsedFlow {
  const raw = parseExportedFlow(file.content);

  const fallbackName =
    filenameWithoutExtension(file.path);

  if (!raw) {
    warnings.push(
      `${file.path}: could not parse Lamatic's named flow exports safely.`,
    );
  }

  const meta =
    raw && isRecord(raw.meta)
      ? raw.meta
      : {};

  const nodeArrays = raw
    ? collectArraysByKey(
        raw,
        new Set([
          "nodes",
          "flownodes",
          "workflownodes",
        ]),
      )
    : [];

  const nodes = deduplicateNodes(
    nodeArrays
      .flat()
      .map(parseNode)
      .filter(
        (node): node is ParsedNode =>
          node !== null,
      ),
  );

  const edgeArrays = raw
    ? collectArraysByKey(
        raw,
        new Set([
          "edges",
          "flowedges",
          "workflowedges",
          "connections",
        ]),
      )
    : [];

  const edges = deduplicateEdges(
    edgeArrays
      .flat()
      .map((edge, index) =>
        parseEdge(edge, index),
      )
      .filter(
        (edge): edge is ParsedEdge =>
          edge !== null,
      ),
  );

  const id =
    firstString(
      meta.id,
      raw?.id,
      raw?.flowId,
      raw?.workflowId,
    ) ?? fallbackName;

  const name =
    firstString(
      meta.name,
      meta.title,
      raw?.name,
      raw?.flowName,
      raw?.title,
    ) ?? fallbackName;

  return {
    id,
    name,
    path: normalizePath(file.path),
    nodes,
    edges,
    schemas: raw
      ? collectSchemas(raw)
      : [],
    raw,
  };
}

function filesWithin(
  files: ExportedFile[],
  directory: string,
): ExportedFile[] {
  const prefix = `${directory.toLowerCase()}/`;

  return files
    .filter((file) =>
      normalizePath(file.path).toLowerCase().startsWith(prefix),
    )
    .sort((left, right) =>
      left.path.localeCompare(right.path),
    );
}

export function parseWorkflowExport(
  workflow: ExportedWorkflow,
): ParsedWorkflowExport {
  const files = workflow.files.map((file) => ({
    ...file,
    path: normalizePath(file.path),
  }));

  const warnings: string[] = [];

  const flowFiles = files
    .filter((file) =>
      FLOW_FILE_PATTERN.test(file.path),
    )
    .sort((left, right) =>
      left.path.localeCompare(right.path),
    );

  if (flowFiles.length === 0) {
    warnings.push(
      "No supported flow files were found inside flows/.",
    );
  }

  const prompts = filesWithin(
    files,
    "prompts",
  );

  const modelConfigs = filesWithin(
    files,
    "model-configs",
  );

  const constitutions = filesWithin(
    files,
    "constitutions",
  );

  const categorizedPaths = new Set(
    [
      ...flowFiles,
      ...prompts,
      ...modelConfigs,
      ...constitutions,
    ].map((file) => file.path),
  );

  const otherFiles = files
    .filter(
      (file) =>
        !categorizedPaths.has(file.path),
    )
    .sort((left, right) =>
      left.path.localeCompare(right.path),
    );

  return {
    name: workflow.name,

    flows: flowFiles.map((file) =>
      parseFlowFile(file, warnings),
    ),

    prompts,
    modelConfigs,
    constitutions,
    otherFiles,

    environmentReferences:
      extractEnvironmentReferences(files),

    warnings,
  };
}
