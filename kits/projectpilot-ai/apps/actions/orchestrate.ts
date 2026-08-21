"use server";

import { lamaticClient } from "@/lib/lamatic-client";

export interface ProjectIdea {
  title: string;
  difficulty: string;
  industryRelevance: string;
  innovationScore: number;
}

export interface Blueprint {
  frontend: string;
  backend: string;
  database: string;
  aiFrameworks: string;
  deployment: string;
  architectureExplanation: string;
  datasets: string[];
}

export interface ExecutionPlan {
  roadmap: { week: string; task: string }[];
  abstract: string;
  vivaQuestions: string[];
  resumeBullets: string[];
}

function getFlowId(envKey: string): string {
  const id = process.env[envKey];
  if (!id) {
    throw new Error(`Missing environment variable: ${envKey}`);
  }
  return id;
}

function isProjectIdeaArray(value: unknown): value is ProjectIdea[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as any).title === "string" &&
        typeof (item as any).difficulty === "string" &&
        typeof (item as any).industryRelevance === "string" &&
        typeof (item as any).innovationScore === "number"
    )
  );
}

function isBlueprint(value: unknown): value is Blueprint {
  if (!value || typeof value !== "object") return false;
  const b = value as any;
  return (
    typeof b.frontend === "string" &&
    typeof b.backend === "string" &&
    typeof b.database === "string" &&
    typeof b.aiFrameworks === "string" &&
    typeof b.deployment === "string" &&
    typeof b.architectureExplanation === "string" &&
    Array.isArray(b.datasets)
  );
}

function isExecutionPlan(value: unknown): value is ExecutionPlan {
  if (!value || typeof value !== "object") return false;
  const p = value as any;
  return (
    Array.isArray(p.roadmap) &&
    typeof p.abstract === "string" &&
    Array.isArray(p.vivaQuestions) &&
    Array.isArray(p.resumeBullets)
  );
}

export async function getProjectIdeas(input: {
  branch: string;
  interest: string;
  skillLevel: string;
  duration: string;
  teamType: string;
}): Promise<{ success: boolean; data?: ProjectIdea[]; error?: string }> {
  try {
    const flowId = getFlowId("DISCOVERY_FLOW_ID");
    const resData = await lamaticClient.executeFlow(flowId, input);
    const ideas = resData?.result?.ideas;
    if (!isProjectIdeaArray(ideas)) {
      throw new Error("Invalid response: ideas is not a valid array of project ideas");
    }
    return { success: true, data: ideas };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getBlueprint(input: {
  selectedIdea: string;
  skillLevel: string;
}): Promise<{ success: boolean; data?: Blueprint; error?: string }> {
  try {
    const flowId = getFlowId("BLUEPRINT_FLOW_ID");
    const resData = await lamaticClient.executeFlow(flowId, input);
    const blueprint = resData?.result;
    if (!isBlueprint(blueprint)) {
      throw new Error("Invalid response: blueprint is missing required fields");
    }
    return { success: true, data: blueprint };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getExecutionPlan(input: {
  selectedIdea: string;
  blueprint: string;
  duration: string;
}): Promise<{ success: boolean; data?: ExecutionPlan; error?: string }> {
  try {
    const flowId = getFlowId("EXECUTION_FLOW_ID");
    const resData = await lamaticClient.executeFlow(flowId, input);
    const plan = resData?.result;
    if (!isExecutionPlan(plan)) {
      throw new Error("Invalid response: execution plan is missing required fields");
    }
    return { success: true, data: plan };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}