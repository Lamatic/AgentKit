import type { MigrationPipelineResult } from "@/types/migrationPipeline";

export type PipelineNodeStatus = "IDLE" | "RUNNING" | "COMPLETED" | "ERROR";

export type PipelineNodeState = {
  id: string;
  label: string;
  summary: string | null;
  title: string;
  status: PipelineNodeStatus;
};

const pipelineNodeDefinitions = [
  {
    id: "node-1",
    label: "Node 1",
    title: "Migration Intent Extractor",
  },
  {
    id: "node-2",
    label: "Node 2",
    title: "Lock & Behavior Evaluator",
  },
  {
    id: "node-3",
    label: "Node 3",
    title: "Deployment Strategy Planner",
  },
  {
    id: "node-4",
    label: "Node 4",
    title: "Release Decision & Rollback",
  },
] as const;

export function createIdlePipelineNodes(): PipelineNodeState[] {
  return pipelineNodeDefinitions.map((node) => ({
    ...node,
    status: "IDLE",
    summary: null,
  }));
}

export function buildPipelineSummaries(
  result: MigrationPipelineResult,
): string[] {
  const operationCount = result.operations.length;
  const operationLabel = operationCount === 1 ? "operation" : "operations";

  return [
    `${operationCount} ${operationLabel} detected`,
    `${result.behavior_analysis.lock_type} - ${result.behavior_analysis.blocking_risk}`,
    result.deployment_strategy.strategy,
    `${result.release_plan.release_decision.status} - ${result.release_plan.release_decision.confidence}`,
  ];
}

export function setPipelineNodeState(
  nodes: PipelineNodeState[],
  index: number,
  status: PipelineNodeStatus,
  summary: string | null,
): PipelineNodeState[] {
  return nodes.map((node, nodeIndex) => {
    if (nodeIndex !== index) {
      return node;
    }

    return {
      ...node,
      status,
      summary,
    };
  });
}
