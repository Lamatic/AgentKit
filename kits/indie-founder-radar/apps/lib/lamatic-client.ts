// lib/lamatic-client.ts — Lamatic SDK Execution Client for Indie Founder Radar

import { Lamatic } from 'lamatic';

export interface ExecuteWorkflowResult {
  status: string;
  result: Record<string, unknown> | string;
  requestId?: string;
  latencyMs: number;
}

export interface LamaticConfig {
  endpoint: string;
  projectId: string;
  flowId: string;
  apiKey: string;
}

/**
 * Resolves credentials and endpoints from environment variables or Studio URLs.
 */
export function getLamaticConfig(): LamaticConfig {
  let apiUrl = (process.env.LAMATIC_API_URL || '').trim();
  let projectId = (process.env.LAMATIC_PROJECT_ID || 'FactcheckAi595').trim();
  let flowId = (
    process.env.INDIE_FOUNDER_RADAR_FLOW_ID ||
    process.env.LAMATIC_FLOW_ID ||
    'e4705e2f-5405-4e00-aaf9-7e6263459012'
  ).trim();
  const apiKey = (process.env.LAMATIC_API_KEY || '').trim();
  const studioUrl = (process.env.LAMATIC_STUDIO_URL || '').trim();

  // If apiUrl was set to a studio URL, extract IDs
  const targetUrl = apiUrl.includes('studio.lamatic.ai') ? apiUrl : studioUrl;
  if (targetUrl.includes('studio.lamatic.ai')) {
    const match = targetUrl.match(/project\/([^/]+)\/flow\/([^/]+)/);
    if (match) {
      if (!projectId || projectId === 'FactcheckAi595') projectId = match[1];
      if (!flowId || flowId === 'e4705e2f-5405-4e00-aaf9-7e6263459012') flowId = match[2];
    }
  }

  if (!apiKey) {
    throw new Error(
      'Missing LAMATIC_API_KEY in environment variables. Please check your apps/.env.local file.'
    );
  }

  if (!apiUrl) {
    throw new Error(
      'Missing LAMATIC_API_URL in apps/.env.local. In Lamatic Studio, open your flow and copy the deployed API Endpoint URL.'
    );
  }

  // Ensure valid endpoint structure with HTTPS
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = `https://${apiUrl}`;
  }

  // Reject insecure HTTP connections to prevent cleartext transmission of sensitive credentials (CWE-319)
  if (!apiUrl.startsWith('https://')) {
    throw new Error(
      `Insecure connection rejected: LAMATIC_API_URL must use the HTTPS protocol (https://) to protect API credentials. Provided: "${apiUrl}"`
    );
  }

  return {
    endpoint: apiUrl.replace(/\/+$/, ''),
    projectId,
    flowId,
    apiKey,
  };
}

/**
 * Creates and returns an initialized Lamatic SDK client.
 */
export function createLamaticClient(): { client: Lamatic; flowId: string } {
  const { endpoint, projectId, flowId, apiKey } = getLamaticConfig();
  const client = new Lamatic({
    endpoint,
    projectId,
    apiKey,
  });
  return { client, flowId };
}

/**
 * Executes the Indie Founder Radar flow via the Lamatic SDK with bounded timeout and cancellation support.
 */
export async function executeIndieFounderRadarFlow(
  idea: string,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<ExecuteWorkflowResult> {
  const { client, flowId } = createLamaticClient();
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const startTime = performance.now();

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Lamatic workflow timed out after ${timeoutMs}ms.`);
      err.name = 'TimeoutError';
      reject(err);
    }, timeoutMs);
  });

  const abortPromise = new Promise<never>((_, reject) => {
    if (options?.signal?.aborted) {
      const err = new Error('Request was aborted by caller.');
      err.name = 'AbortError';
      reject(err);
    } else if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        const err = new Error('Request was aborted by caller.');
        err.name = 'AbortError';
        reject(err);
      });
    }
  });

  try {
    const execution: unknown = await Promise.race([
      client.executeFlow(flowId, { idea }),
      timeoutPromise,
      abortPromise,
    ]);

    const endTime = performance.now();
    const latencyMs = Math.round((endTime - startTime) * 10) / 10;

    const execObj = execution as {
      status?: string;
      result?: unknown;
      data?: unknown;
      message?: string;
      error?: string;
      requestId?: string;
    };

    if (execObj?.status !== 'success' && execObj?.status && execObj.status !== 'completed') {
      throw new Error(
        `Lamatic workflow execution failed: ${execObj?.message || execObj?.error || 'Unknown error'}`
      );
    }

    const result = (execObj?.result ?? execObj?.data ?? execution) as Record<string, unknown> | string;

    return {
      status: execObj?.status || 'success',
      result,
      requestId: execObj?.requestId,
      latencyMs,
    };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
