"use server";

import { lamatic } from "@/lib/lamatic-client";

export type Order = {
  id: string;
  dueDate: string;
  stages: string[];
  currentStage: string;
  stageEnteredDate: string;
  quantity: string;
  completedQuantity: string;
};

export type OrderStat = {
  id: string;
  currentStage: string;
  daysInStage?: number;
  daysUntilDue?: number;
  pctComplete?: number;
  stagesRemaining?: number;
  atRisk: boolean;
  error?: string;
};

export type BriefResult = {
  brief: string;
  stats: OrderStat[];
  emailDraft: string;
};

export async function getBottleneckBrief(orders: Order[]): Promise<BriefResult> {
  const flowId = process.env.BRIEF_FLOW_ID!;
  const response: any = await lamatic.executeFlow(flowId, { orders });
  return {
    brief: response?.result?.brief ?? "No response received.",
    stats: response?.result?.stats ?? [],
    emailDraft: response?.result?.emailDraft ?? "",
  };
}

export async function askAboutOrder(orders: Order[], orderId: string, question: string): Promise<string> {
  const flowId = process.env.QA_FLOW_ID!;
  const response: any = await lamatic.executeFlow(flowId, { orders, orderId: orderId.trim(), question });
  return response?.result?.output ?? "No response received.";
}