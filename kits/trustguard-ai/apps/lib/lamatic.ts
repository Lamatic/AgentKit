// lib/lamatic.ts
// Server-only Lamatic SDK singleton factory.
// This file must ONLY be imported in server-side code (Server Actions, Route Handlers).
import "server-only";

import { Lamatic } from "lamatic";

let client: Lamatic | null = null;

/**
 * Returns a singleton Lamatic client initialised from environment variables.
 * Throws a clear error if any required env var is missing.
 */
export function getLamaticClient(): Lamatic {
  if (client) return client;

  const apiKey = process.env.LAMATIC_API_KEY;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const endpoint = process.env.LAMATIC_API_URL;

  if (!apiKey || !projectId || !endpoint) {
    throw new Error(
      "Missing Lamatic credentials. Please set LAMATIC_API_KEY, LAMATIC_PROJECT_ID, and LAMATIC_API_URL in your .env.local file."
    );
  }

  client = new Lamatic({
    apiKey,
    projectId,
    endpoint,
  });

  return client;
}

/**
 * Returns the flow ID from the environment, or throws if missing.
 */
export function getFlowId(): string {
  const flowId = process.env.TRUSTGUARD_FLOW_ID;
  if (!flowId) {
    throw new Error(
      "Missing TRUSTGUARD_FLOW_ID. Please set it in your .env.local file."
    );
  }
  return flowId;
}
