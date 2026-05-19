"use server";

import { z } from "zod";
import { Lamatic } from "lamatic";

const ENDPOINT = "https://himanshusorganization969-codebaseonboardingagent753.lamatic.dev";
const PROJECT_ID = "c2fd5cee-b61c-41a5-9f77-e2ab1b60e9a5";
const WORKFLOW_ID = "71d0e3b2-63df-4b85-8a0d-c1f6d6b8c064";

const schema = z.object({
  repo_url: z.string().url().min(1).max(500),
  developer_role: z.string().min(1).max(200),
  github_token: z.string().max(500).optional(),
});

function unwrapResult(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;

  if (record.generatedResponse !== undefined) return unwrapResult(record.generatedResponse);
  if (record.result !== undefined) return unwrapResult(record.result);
  if (record.output !== undefined) return unwrapResult(record.output);

  return value;
}

async function waitForCompletedFlow(lamaticClient: Lamatic, requestId: string): Promise<any> {
  const checker = lamaticClient.checkStatus?.bind(lamaticClient);

  if (typeof checker !== 'function') {
    throw new Error('[Lamatic] checkStatus is not available on the current client');
  }

  const response = await checker(requestId, 5, 900);
  return response;
}

export async function runOnboardingAgent(input: z.infer<typeof schema>) {
  try {
    const data = schema.parse(input);

    const apiKey = process.env.LAMATIC_PROJECT_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "LAMATIC_PROJECT_API_KEY is not configured on the server." };
    }

    const lamaticClient = new Lamatic({
      endpoint: process.env.LAMATIC_API_URL ?? ENDPOINT,
      projectId: process.env.LAMATIC_PROJECT_ID ?? PROJECT_ID,
      apiKey: apiKey,
    });

    const inputs = {
      repo_url: data.repo_url,
      developer_role: data.developer_role,
      ...(data.github_token ? { github_token: data.github_token } : {}),
    };

    console.log("Executing Lamatic flow with inputs:", inputs);
    const resData: any = await lamaticClient.executeFlow(WORKFLOW_ID, inputs);
    console.log("Lamatic response:", resData);

    if (!resData) {
      return { ok: false as const, error: "No response from Lamatic API" };
    }

    if (resData.status === 'error') {
      return { ok: false as const, error: resData.error || resData.message || 'The flow returned an error' };
    }

    const requestId =
      typeof resData.result === 'object' && resData.result !== null
        ? (resData.result as { requestId?: string }).requestId
        : undefined;

    if (requestId) {
      console.log('[Flow] Async request accepted, waiting for completion:', { requestId });
      const statusResponse = await waitForCompletedFlow(lamaticClient, requestId);
      console.log('[Flow] Status response:', statusResponse);

      if (statusResponse?.status === 'error') {
        return { ok: false as const, error: statusResponse.error || statusResponse.message || 'The async flow failed' };
      }

      return {
        ok: true as const,
        status: statusResponse?.status || 'completed',
        result: unwrapResult(statusResponse?.result ?? statusResponse?.data ?? statusResponse?.output),
      };
    }

    return {
      ok: true as const,
      status: resData.status || "success",
      result: unwrapResult(resData.result),
    };
  } catch (err) {
    console.error("Lamatic request failed:", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Request failed" };
  }
}
