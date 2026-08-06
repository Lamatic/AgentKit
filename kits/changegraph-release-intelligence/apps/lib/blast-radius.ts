import type {
  BlastRadiusAnalysis,
  BlastRadiusNode,
  WorkflowGraphFlow,
  WorkflowGraphNode,
  WorkflowGraphSnapshot,
  StructuralDiff,
  WorkflowChange,
} from "@/types/changegraph";

export const MAX_WORKFLOW_GRAPH_NODES_PER_FLOW = 500;
export const MAX_WORKFLOW_GRAPH_EDGES_PER_FLOW = 2_000;

const MAX_PATHS_PER_NODE = 5;

interface FlowContext {
  baseline?: WorkflowGraphFlow;
  candidate?: WorkflowGraphFlow;
}

interface DirectSeed {
  flow: WorkflowGraphFlow;
  nodeId: string;
  changeId: string;
}

interface FlowGraph {
  nodes: Map<string, WorkflowGraphNode>;
  adjacency: Map<string, string[]>;
}

interface NodeAccumulator {
  flowId: string;
  flowName: string;
  nodeId: string;
  nodeName: string;
  impact: "direct" | "downstream";
  distance: number;
  relatedChangeIds: Set<string>;
  paths: Map<string, string[]>;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePath(value: string): string {
  return value
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");
}

function assertGraphBounds(
  snapshot: WorkflowGraphSnapshot,
  label: "baseline" | "candidate",
): void {
  for (const flow of snapshot.flows) {
    if (
      flow.nodes.length >
      MAX_WORKFLOW_GRAPH_NODES_PER_FLOW
    ) {
      throw new Error(
        `${label} workflow graph flow "${flow.path}" exceeds the ${MAX_WORKFLOW_GRAPH_NODES_PER_FLOW} node limit.`,
      );
    }

    if (
      flow.edges.length >
      MAX_WORKFLOW_GRAPH_EDGES_PER_FLOW
    ) {
      throw new Error(
        `${label} workflow graph flow "${flow.path}" exceeds the ${MAX_WORKFLOW_GRAPH_EDGES_PER_FLOW} edge limit.`,
      );
    }
  }
}

function filenameWithoutExtension(path: string): string {
  return (
    normalizePath(path)
      .split("/")
      .at(-1)
      ?.replace(/\.(?:ts|js|json)$/i, "") ?? path
  );
}

function basename(path: string): string {
  return normalizePath(path).split("/").at(-1) ?? path;
}

function nodeMap(flow: WorkflowGraphFlow): Map<string, WorkflowGraphNode> {
  return new Map(
    flow.nodes.map((node) => [normalize(node.id), node]),
  );
}

function buildAdjacency(
  flow: WorkflowGraphFlow,
): Map<string, string[]> {
  const adjacency = new Map<string, Set<string>>();

  for (const node of flow.nodes) {
    adjacency.set(normalize(node.id), new Set());
  }

  for (const edge of flow.edges) {
    const source = normalize(edge.source);
    const target = normalize(edge.target);

    if (!adjacency.has(source)) {
      adjacency.set(source, new Set());
    }

    adjacency.get(source)?.add(target);
  }

  return new Map(
    [...adjacency.entries()].map(([key, targets]) => [
      key,
      [...targets].sort(),
    ]),
  );
}

const flowGraphCache =
  new WeakMap<WorkflowGraphFlow, FlowGraph>();

function flowGraph(
  flow: WorkflowGraphFlow,
): FlowGraph {
  const cached = flowGraphCache.get(flow);

  if (cached) {
    return cached;
  }

  const graph = {
    nodes: nodeMap(flow),
    adjacency: buildAdjacency(flow),
  };

  flowGraphCache.set(flow, graph);

  return graph;
}

function flowAliases(flow: WorkflowGraphFlow): string[] {
  return [
    flow.id,
    flow.name,
    filenameWithoutExtension(flow.path),
  ]
    .map(normalize)
    .filter(
      (value, index, values) =>
        value.length > 0 && values.indexOf(value) === index,
    );
}

/**
 * Returns:
 * - "" for a flow-level component
 * - the portion after "<flow>/" for a node/edge component
 * - null when the component does not belong to this flow
 */
function componentSuffix(
  component: string,
  flows: Array<WorkflowGraphFlow | undefined>,
): string | null {
  const normalizedComponent = normalize(component);

  for (const flow of flows) {
    if (!flow) {
      continue;
    }

    for (const alias of flowAliases(flow)) {
      if (normalizedComponent === alias) {
        return "";
      }

      const prefix = `${alias}/`;

      if (normalizedComponent.startsWith(prefix)) {
        return component.slice(prefix.length);
      }
    }
  }

  return null;
}

function findNode(
  flow: WorkflowGraphFlow,
  identifier: string,
): WorkflowGraphNode | undefined {
  const normalizedIdentifier = normalize(identifier);

  return flow.nodes.find(
    (node) =>
      normalize(node.id) === normalizedIdentifier ||
      normalize(node.name) === normalizedIdentifier,
  );
}

function searchableNodeConfig(node: WorkflowGraphNode): string {
  try {
    return JSON.stringify(node.config).toLowerCase();
  } catch {
    return "";
  }
}

function nodeReferencesResource(
  node: WorkflowGraphNode,
  resourcePath: string,
): boolean {
  const searchable = searchableNodeConfig(node);
  const normalizedResource = normalizePath(resourcePath).toLowerCase();
  const resourceBasename = basename(normalizedResource);

  return (
    searchable.includes(normalizedResource) ||
    searchable.includes(`@${normalizedResource}`) ||
    (resourceBasename.length > 3 &&
      searchable.includes(resourceBasename))
  );
}

function isResourceChange(change: WorkflowChange): boolean {
  return (
    change.component.includes("/") &&
    !change.component.includes("->") &&
    /\.(?:md|tsx?|jsx?|json|ya?ml)$/i.test(
      change.component,
    )
  );
}

function createFlowContexts(
  baseline: WorkflowGraphSnapshot,
  candidate: WorkflowGraphSnapshot,
): FlowContext[] {
  const baselineFlows = new Map(
    baseline.flows.map((flow) => [
      normalizePath(flow.path).toLowerCase(),
      flow,
    ]),
  );

  const candidateFlows = new Map(
    candidate.flows.map((flow) => [
      normalizePath(flow.path).toLowerCase(),
      flow,
    ]),
  );

  const paths = new Set([
    ...baselineFlows.keys(),
    ...candidateFlows.keys(),
  ]);

  return [...paths]
    .sort()
    .map((path) => ({
      baseline: baselineFlows.get(path),
      candidate: candidateFlows.get(path),
    }));
}

function addSeed(
  seeds: DirectSeed[],
  seedKeys: Set<string>,
  flow: WorkflowGraphFlow,
  nodeId: string,
  changeId: string,
): void {
  const key =
    `${normalizePath(flow.path).toLowerCase()}::` +
    `${normalize(nodeId)}::${changeId}`;

  if (seedKeys.has(key)) {
    return;
  }

  seedKeys.add(key);
  seeds.push({
    flow,
    nodeId,
    changeId,
  });
}

function seedRemovedNodeDownstream(
  context: FlowContext,
  removedNodeId: string,
  changeId: string,
  seeds: DirectSeed[],
  seedKeys: Set<string>,
): boolean {
  const { baseline, candidate } = context;

  if (!baseline || !candidate) {
    return false;
  }

  const baselineAdjacency =
    flowGraph(baseline).adjacency;
  const candidateNodes =
    flowGraph(candidate).nodes;
  const downstreamIds =
    baselineAdjacency.get(normalize(removedNodeId)) ?? [];

  let matched = false;

  for (const downstreamId of downstreamIds) {
    const candidateNode = candidateNodes.get(downstreamId);

    if (!candidateNode) {
      continue;
    }

    addSeed(
      seeds,
      seedKeys,
      candidate,
      candidateNode.id,
      changeId,
    );

    matched = true;
  }

  return matched;
}

function collectDirectSeeds(
  contexts: FlowContext[],
  structuralDiff: StructuralDiff,
  warnings: string[],
): DirectSeed[] {
  const seeds: DirectSeed[] = [];
  const seedKeys = new Set<string>();

  for (const change of structuralDiff.changes) {
    let matched = false;

    for (const context of contexts) {
      const { baseline, candidate } = context;

      if (!candidate) {
        if (
          baseline &&
          componentSuffix(change.component, [baseline]) !== null
        ) {
          warnings.push(
            `${change.changeId}: flow "${baseline.name}" was removed, so its downstream candidate graph cannot be traversed.`,
          );
          matched = true;
        }

        continue;
      }

      const suffix = componentSuffix(change.component, [
        baseline,
        candidate,
      ]);

      if (suffix !== null) {
        // Flow-level addition or modification.
        if (suffix.length === 0) {
          for (const node of candidate.nodes) {
            addSeed(
              seeds,
              seedKeys,
              candidate,
              node.id,
              change.changeId,
            );
          }

          matched = candidate.nodes.length > 0;
          continue;
        }

        // Edge change: mark both connection endpoints as direct.
        if (suffix.includes("->")) {
          const [sourceId, targetId] = suffix
            .split("->", 2)
            .map((value) => value.trim());

          const sourceNode = findNode(candidate, sourceId);
          const targetNode = findNode(candidate, targetId);

          if (sourceNode) {
            addSeed(
              seeds,
              seedKeys,
              candidate,
              sourceNode.id,
              change.changeId,
            );
            matched = true;
          }

          if (targetNode) {
            addSeed(
              seeds,
              seedKeys,
              candidate,
              targetNode.id,
              change.changeId,
            );
            matched = true;
          }

          continue;
        }

        // Normal node change.
        const candidateNode = findNode(candidate, suffix);

        if (candidateNode) {
          addSeed(
            seeds,
            seedKeys,
            candidate,
            candidateNode.id,
            change.changeId,
          );

          matched = true;
          continue;
        }

        // A removed node is no longer in the candidate. Seed its
        // previous immediate consumers when they still exist.
        const baselineNode = baseline
          ? findNode(baseline, suffix)
          : undefined;

        if (
          baselineNode &&
          seedRemovedNodeDownstream(
            context,
            baselineNode.id,
            change.changeId,
            seeds,
            seedKeys,
          )
        ) {
          matched = true;
        }
      }

      // Prompt/model/config files are linked to nodes through
      // @reference strings in node configuration.
      if (suffix === null && isResourceChange(change)) {
        for (const node of candidate.nodes) {
          if (
            nodeReferencesResource(node, change.component)
          ) {
            addSeed(
              seeds,
              seedKeys,
              candidate,
              node.id,
              change.changeId,
            );

            matched = true;
          }
        }

        // If a referenced file was removed, inspect baseline nodes and
        // map equivalent node IDs into the candidate flow.
        if (baseline) {
          const candidateNodes = flowGraph(candidate).nodes;

          for (const baselineNode of baseline.nodes) {
            if (
              !nodeReferencesResource(
                baselineNode,
                change.component,
              )
            ) {
              continue;
            }

            const equivalentNode = candidateNodes.get(
              normalize(baselineNode.id),
            );

            if (equivalentNode) {
              addSeed(
                seeds,
                seedKeys,
                candidate,
                equivalentNode.id,
                change.changeId,
              );

              matched = true;
            }
          }
        }
      }
    }

    if (!matched) {
      warnings.push(
        `${change.changeId}: no candidate node could be linked to "${change.component}".`,
      );
    }
  }

  return seeds;
}

function accumulatorKey(
  flow: WorkflowGraphFlow,
  nodeId: string,
): string {
  return `${normalizePath(flow.path).toLowerCase()}::${normalize(
    nodeId,
  )}`;
}

function addAffectedNode(
  accumulator: Map<string, NodeAccumulator>,
  flow: WorkflowGraphFlow,
  node: WorkflowGraphNode,
  impact: "direct" | "downstream",
  distance: number,
  changeId: string,
  path: string[],
): void {
  const key = accumulatorKey(flow, node.id);
  const existing = accumulator.get(key);

  if (!existing) {
    accumulator.set(key, {
      flowId: flow.id,
      flowName: flow.name,
      nodeId: node.id,
      nodeName: node.name,
      impact,
      distance,
      relatedChangeIds: new Set([changeId]),
      paths: new Map([[path.join(" -> "), path]]),
    });

    return;
  }

  existing.relatedChangeIds.add(changeId);
  existing.distance = Math.min(existing.distance, distance);

  if (impact === "direct") {
    existing.impact = "direct";
  }

  if (
    existing.paths.size < MAX_PATHS_PER_NODE &&
    !existing.paths.has(path.join(" -> "))
  ) {
    existing.paths.set(path.join(" -> "), path);
  }
}

function traverseSeed(
  seed: DirectSeed,
  accumulator: Map<string, NodeAccumulator>,
): void {
  const flow = seed.flow;
  const { nodes, adjacency } =
    flowGraph(flow);
  const startingNode = nodes.get(normalize(seed.nodeId));

  if (!startingNode) {
    return;
  }

  const queue: Array<{
    nodeId: string;
    distance: number;
    path: string[];
  }> = [
    {
      nodeId: startingNode.id,
      distance: 0,
      path: [startingNode.id],
    },
  ];

  const shortestDistance =
    new Map<string, number>();

  const enqueuedPathsByNode =
    new Map<string, Set<string>>([
      [
        normalize(startingNode.id),
        new Set([startingNode.id]),
      ],
    ]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    const normalizedNodeId = normalize(current.nodeId);
    const knownDistance =
      shortestDistance.get(normalizedNodeId);

    if (
      knownDistance !== undefined &&
      knownDistance < current.distance
    ) {
      continue;
    }

    shortestDistance.set(
      normalizedNodeId,
      current.distance,
    );

    const currentNode = nodes.get(normalizedNodeId);

    if (!currentNode) {
      continue;
    }

    addAffectedNode(
      accumulator,
      flow,
      currentNode,
      current.distance === 0 ? "direct" : "downstream",
      current.distance,
      seed.changeId,
      current.path,
    );

    const downstream =
      adjacency.get(normalizedNodeId) ?? [];

    for (const nextNodeId of downstream) {
      if (
        current.path.some(
          (pathNodeId) =>
            normalize(pathNodeId) === nextNodeId,
        )
      ) {
        continue;
      }

      const nextNode = nodes.get(nextNodeId);

      if (!nextNode) {
        continue;
      }

      const nextPath = [
        ...current.path,
        nextNode.id,
      ];

      const nextPathKey =
        nextPath.join(" -> ");

      const existingPaths =
        enqueuedPathsByNode.get(nextNodeId) ??
        new Set<string>();

      if (
        existingPaths.has(nextPathKey) ||
        existingPaths.size >=
          MAX_PATHS_PER_NODE
      ) {
        continue;
      }

      existingPaths.add(nextPathKey);
      enqueuedPathsByNode.set(
        nextNodeId,
        existingPaths,
      );

      queue.push({
        nodeId: nextNode.id,
        distance: current.distance + 1,
        path: nextPath,
      });
    }
  }
}

export function calculateBlastRadius(
  baseline: WorkflowGraphSnapshot,
  candidate: WorkflowGraphSnapshot,
  structuralDiff: StructuralDiff,
): BlastRadiusAnalysis {
  assertGraphBounds(baseline, "baseline");
  assertGraphBounds(candidate, "candidate");

  const warnings: string[] = [];
  const contexts = createFlowContexts(
    baseline,
    candidate,
  );

  const seeds = collectDirectSeeds(
    contexts,
    structuralDiff,
    warnings,
  );

  const accumulator = new Map<
    string,
    NodeAccumulator
  >();

  for (const seed of seeds) {
    traverseSeed(seed, accumulator);
  }

  const nodes: BlastRadiusNode[] = [
    ...accumulator.values(),
  ]
    .map((node) => ({
      flowId: node.flowId,
      flowName: node.flowName,
      nodeId: node.nodeId,
      nodeName: node.nodeName,
      impact: node.impact,
      distance: node.distance,
      relatedChangeIds: [
        ...node.relatedChangeIds,
      ].sort(),
      paths: [...node.paths.values()].sort(
        (left, right) =>
          left.join(" -> ").localeCompare(
            right.join(" -> "),
          ),
      ),
    }))
    .sort((left, right) => {
      if (left.impact !== right.impact) {
        return left.impact === "direct" ? -1 : 1;
      }

      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }

      return `${left.flowName}/${left.nodeId}`.localeCompare(
        `${right.flowName}/${right.nodeId}`,
      );
    });

  const affectedPaths = [
    ...new Set(
      nodes.flatMap((node) =>
        node.paths.map(
          (path) =>
            `${node.flowName}: ${path.join(" -> ")}`,
        ),
      ),
    ),
  ].sort();

  return {
    nodes,
    directlyAffectedNodeIds: nodes
      .filter((node) => node.impact === "direct")
      .map(
        (node) =>
          `${node.flowId}/${node.nodeId}`,
      ),
    indirectlyAffectedNodeIds: nodes
      .filter((node) => node.impact === "downstream")
      .map(
        (node) =>
          `${node.flowId}/${node.nodeId}`,
      ),
    affectedPaths,
    warnings: [...new Set(warnings)].sort(),
  };
}
