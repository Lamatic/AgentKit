import { Lamatic } from "lamatic";
import { DraftAnswerInput, DraftAnswerOutput } from "@/types";

// Validate env variables up front so failures are obvious, not silent.
const requiredEnv = [
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
  "LAMATIC_FLOW_ID",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
});

const flowId = process.env.LAMATIC_FLOW_ID!;

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiKey: process.env.LAMATIC_API_KEY!,
});

export async function draftAnswer(
  input: DraftAnswerInput
): Promise<DraftAnswerOutput> {
  try {
    const res = await lamaticClient.executeFlow(flowId, {
      new_question: input.new_question,
      past_answers: input.past_answers,
    });

    return res.result as DraftAnswerOutput;
  } catch (error) {
    console.error("Lamatic SDK Error:", error);
    throw error;
  }
}
