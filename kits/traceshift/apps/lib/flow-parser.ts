import type {
  AnalysisReport,
  FlowGraph,
  FlowGraphEdge,
  FlowGraphNode,
  FlowMapping,
} from "./types";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const fingerprint = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `flow_${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const extractArray = (source: string, exportName: "nodes" | "edges"): unknown[] => {
  const marker = new RegExp(`export\\s+const\\s+${exportName}\\s*=`, "m");
  const match = marker.exec(source);
  if (!match) throw new Error(`The flow export is missing export const ${exportName}.`);
  const start = source.indexOf("[", match.index + match[0].length);
  if (start < 0) throw new Error(`The ${exportName} export is not an array.`);

  let depth = 0;
  let quote: '"' | "'" | "`" | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "[") depth += 1;
    if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        const value = source.slice(start, index + 1);
        try {
          const parsed = JSON.parse(value) as unknown;
          if (!Array.isArray(parsed)) throw new Error("not an array");
          return parsed;
        } catch {
          throw new Error(
            `The ${exportName} block must be the JSON-compatible array produced by Lamatic Studio.`,
          );
        }
      }
    }
  }
  throw new Error(`The ${exportName} array is incomplete.`);
};

const flowName = (source: string): string => {
  const metaStart = source.search(/export\s+const\s+meta\s*=/m);
  const inputStart = source.search(/export\s+const\s+inputs\s*=/m);
  const meta = source.slice(Math.max(0, metaStart), inputStart > metaStart ? inputStart : undefined);
  return meta.match(/["']?name["']?\s*:\s*["']([^"']+)["']/)?.[1] ?? "Imported Lamatic flow";
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function parseLamaticFlow(source: string): FlowGraph {
  if (!source.trim()) throw new Error("The flow export is empty.");
  if (source.length > 2_000_000) throw new Error("The flow export is over 2 MB.");

  const rawNodes = extractArray(source, "nodes");
  const rawEdges = extractArray(source, "edges");
  const nodes: FlowGraphNode[] = rawNodes.map((raw, index) => {
    const node = asRecord(raw);
    const data = asRecord(node.data);
    const values = asRecord(data.values);
    const position = asRecord(node.position);
    const id = typeof node.id === "string" ? node.id : `node-${index + 1}`;
    return {
      id,
      type: typeof node.type === "string" ? node.type : "unknown",
      nodeId: typeof data.nodeId === "string" ? data.nodeId : "unknown",
      name: typeof values.nodeName === "string" ? values.nodeName : id,
      position: {
        x: typeof position.x === "number" ? position.x : 0,
        y: typeof position.y === "number" ? position.y : index * 180,
      },
      values,
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: FlowGraphEdge[] = rawEdges.map((raw, index) => {
    const edge = asRecord(raw);
    return {
      id: typeof edge.id === "string" ? edge.id : `edge-${index + 1}`,
      source: typeof edge.source === "string" ? edge.source : "",
      target: typeof edge.target === "string" ? edge.target : "",
      type: typeof edge.type === "string" ? edge.type : "defaultEdge",
    };
  });
  const broken = edges.find((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
  if (broken) throw new Error(`Edge ${broken.id} points to a node that is not present in the export.`);

  return {
    name: flowName(source),
    sourceFingerprint: fingerprint(source),
    nodes,
    edges,
  };
}

export function mapFlowToReport(graph: FlowGraph, report: AnalysisReport): FlowMapping {
  const aggregates = new Map(report.nodes.map((node) => [normalize(node.name), node]));
  const usedTraceNodes = new Set<string>();
  const successfulRuns = report.executions.filter((execution) => execution.status === "success");

  const nodes = graph.nodes.map((node) => {
    const exact = report.nodes.find((aggregate) => aggregate.name === node.name);
    const aggregate = exact ?? aggregates.get(normalize(node.name));
    if (aggregate) usedTraceNodes.add(aggregate.name);
    return {
      ...node,
      traceNodeName: aggregate?.name ?? null,
      match: aggregate ? (exact ? "exact-name" as const : "normalized-name" as const) : "unmapped" as const,
      calls: aggregate?.calls ?? 0,
      totalSeconds: aggregate?.totalSeconds ?? 0,
      totalCost: aggregate?.cost ?? 0,
      latencyShare: aggregate?.latencyShare ?? 0,
      costShare: aggregate?.costShare ?? 0,
    };
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges = graph.edges.map((edge) => {
    const source = byId.get(edge.source)?.traceNodeName;
    const target = byId.get(edge.target)?.traceNodeName;
    const observedRuns = source && target
      ? successfulRuns.filter((run) =>
          run.path.some((name, index) => name === source && run.path[index + 1] === target),
        ).length
      : 0;
    return {
      ...edge,
      observedRuns,
      shareOfSuccessfulRuns: successfulRuns.length ? observedRuns / successfulRuns.length : 0,
    };
  });

  return {
    graph,
    nodes,
    edges,
    mappedNodes: nodes.filter((node) => node.match !== "unmapped").length,
    unmappedFlowNodes: nodes.filter((node) => node.match === "unmapped").map((node) => node.name),
    unmappedTraceNodes: report.nodes
      .filter((node) => !usedTraceNodes.has(node.name))
      .map((node) => node.name),
  };
}
