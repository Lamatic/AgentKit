"use server";
import { lamaticClient } from "@/lib/lamatic-client";

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_REALESTATE!, "base64").toString("utf8"));

export type Verdict = "Buy" | "Hold" | "Pass";

export interface PropertyResult {
  address: string;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  verdict: Verdict;
  brief: string;
}

export async function runPropertyAnalysis(inputs: Record<string, unknown> = {}): Promise<PropertyResult[]> {
  const flow = config.flows.property_analysis;
  const resData = await lamaticClient.executeFlow(flow.workflowId, inputs);
  return resData?.result?.properties ?? [];
}
