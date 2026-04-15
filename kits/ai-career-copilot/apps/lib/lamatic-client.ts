import { Lamatic } from "lamatic";
import { CareerAnalysisInput, CareerAnalysisOutput } from "@/types";

// ✅ Validate env variables (FAIL FAST)
const requiredEnv = [
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
  "LAMATIC_FLOW_ID",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env variable: ${key}`);
  }
});

const flowId = process.env.LAMATIC_FLOW_ID!;

// ✅ Initialize SDK (STANDARD WAY)
export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiKey: process.env.LAMATIC_API_KEY!,
});

// ✅ Wrapper function (keeps your architecture same)
export async function executeCareerAnalysis(
  input: CareerAnalysisInput
): Promise<CareerAnalysisOutput> {
  try {
    const res = await lamaticClient.executeFlow(
      flowId,
      {
        resume_text: input.resume_text,
        domain: input.domain,
      }
    );

    // ✅ IMPORTANT: return correctly typed data
    return res.result as CareerAnalysisOutput;

  } catch (error) {
    console.error("Lamatic SDK Error:", error);
    throw error;
  }
}