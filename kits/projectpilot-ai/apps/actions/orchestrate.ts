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
    if (!ideas) throw new Error("No ideas found in response");
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
    if (!blueprint) throw new Error("No blueprint found in response");
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
    if (!plan) throw new Error("No execution plan found in response");
    return { success: true, data: plan };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

