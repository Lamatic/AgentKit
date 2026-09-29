// lib/lamatic-client.ts
// Server-only: talks to your deployed Lamatic flow via the official SDK.
// This file must never be imported from a "use client" component —
// it reads secrets that should never reach the browser.

import { Lamatic } from "lamatic";

export interface ParallelMatch {
  domainA_element: string;
  domainB_element: string;
  shared_structure: string;
}

export interface CrossPollinatorResult {
  domainA_analysis: string;
  domainB_analysis: string;
  parallels: ParallelMatch[];
  proposed_innovation: string;
  evaluation: string;
  final_summary: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Lamatic can return object/array-mapped fields as either a real
// JSON value OR a JSON-encoded string, depending on how the field's
// declared type resolves server-side. Guard against both shapes so
// a successful response never crashes the page on .map().
function normalizeParallels(value: unknown): ParallelMatch[] {
  if (Array.isArray(value)) {
    return value as ParallelMatch[];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as ParallelMatch[];
      }
    } catch {
      // fall through to the empty-array fallback below
    }
  }
  return [];
}

export async function runNeuralCrossPollinator(
  workflowId: string,
  domainA: string,
  domainB: string
): Promise<CrossPollinatorResult> {
  const apiUrl = requireEnv("LAMATIC_API_URL");
  if (!apiUrl.startsWith("https://")) {
    throw new Error(
      "LAMATIC_API_URL must use https:// — refusing to send credentials over an insecure connection."
    );
  }
  const apiKey = requireEnv("LAMATIC_API_KEY");
  const projectId = requireEnv("LAMATIC_PROJECT_ID");

  const lamatic = new Lamatic({
    endpoint: apiUrl,
    projectId,
    apiKey
  });

  const response = await lamatic.executeFlow(workflowId, { domainA, domainB });

  // The SDK's exact response envelope isn't fully documented, so pull the
  // real payload out defensively rather than assuming one fixed shape.
  const raw: Record<string, unknown> =
    (response as any)?.result ?? (response as any)?.data ?? (response as any) ?? {};

  const status = (response as any)?.status;
  if (status && status !== "success") {
    throw new Error(`Flow execution did not return a success status (got: ${status})`);
  }

  return {
    domainA_analysis: String(raw.domainA_analysis ?? ""),
    domainB_analysis: String(raw.domainB_analysis ?? ""),
    parallels: normalizeParallels(raw.parallels),
    proposed_innovation: String(raw.proposed_innovation ?? ""),
    evaluation: String(raw.evaluation ?? ""),
    final_summary: String(raw.success_summary || raw.caveat_summary || "")
  };
}