import { Lamatic } from "lamatic";

const client = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  endpoint: process.env.LAMATIC_API_URL!,
});

export interface JobResult {
  url: string;
  job_title: string;
  company: string;
  seniority: string;
  match_score: number;
  qualified: boolean;
  matched_skills: string;
  cover_letter: string | null;
}

export interface ApplyBudResponse {
  candidate: string;
  total_jobs_evaluated: number;
  qualified_jobs: number;
  results: JobResult[];
}

export interface ApplyBudInput {
  resume: string;
  job_urls: string[];
}

export async function runApplyBudFlow(
  input: ApplyBudInput
): Promise<ApplyBudResponse> {
  const flowId = process.env.LAMATIC_FLOW_ID!;

  const response = await client.executeFlow(flowId, {
    resume: input.resume,
    job_urls: input.job_urls.join(","),
  });

  if (!response || response.status === "error" || response.status === "failed") {
    throw new Error(`Flow failed: ${JSON.stringify(response)}`);
  }

  const result = response.result;
  const parsed = typeof result === "string" ? JSON.parse(result) : result;
  return parsed as ApplyBudResponse;
}