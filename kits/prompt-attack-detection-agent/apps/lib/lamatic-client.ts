import { Lamatic } from "lamatic";
import { PromptAnalysisInput, PromptAnalysisOutput } from "@/types";

const requiredEnv = [
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
  "LAMATIC_FLOW_ID",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

const flowId = process.env.LAMATIC_FLOW_ID!;

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiKey: process.env.LAMATIC_API_KEY!,
});

export async function executePromptAnalysis(
  input: PromptAnalysisInput,
): Promise<PromptAnalysisOutput> {
  try {
    const res = await Promise.race([
      lamaticClient.executeFlow(flowId, {
        prompt: input.prompt,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Lamatic API request timed out")),
          30000,
        ),
      ),
    ]);

    return res.result as PromptAnalysisOutput;
  } catch (error) {
    console.error("Lamatic Error:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}
