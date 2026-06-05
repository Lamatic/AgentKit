"use server";

import { z } from "zod";
import { Lamatic } from "lamatic";

const ENDPOINT = process.env.LAMATIC_PROJECT_ENDPOINT;
const PROJECT_ID = process.env.LAMATIC_PROJECT_ID;
const WORKFLOW_ID = process.env.LAMATIC_FLOW_ID;

const schema = z.object({
  repo_url: z
    .string()
    .url()
    .max(500)
    .refine((value) => {
      const url = new URL(value);
      const segments = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
      return url.hostname.toLowerCase() === "github.com" && segments.length === 2;
    }, { message: "Must be a valid GitHub repository URL" }),
  developer_role: z.string().trim().min(1).max(200),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (!ENDPOINT) {
      return { ok: false as const, error: "LAMATIC_PROJECT_ENDPOINT is not configured on the server." };
    }
    if (!PROJECT_ID) {
      return { ok: false as const, error: "LAMATIC_PROJECT_ID is not configured on the server." };
    }
    if (!WORKFLOW_ID) {
      return { ok: false as const, error: "LAMATIC_FLOW_ID is not configured on the server." };
    }

    const lamaticClient = new Lamatic({
      endpoint: ENDPOINT,
      projectId: PROJECT_ID,
      apiKey: apiKey,
    });

    const inputs = {
      repo_url: data.repo_url,
      developer_role: data.developer_role,
      ...(data.github_token ? { github_token: data.github_token } : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resData: any = await lamaticClient.executeFlow(WORKFLOW_ID, inputs);


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
      const statusResponse = await waitForCompletedFlow(lamaticClient, requestId);

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
