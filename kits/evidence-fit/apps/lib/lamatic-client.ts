/**
 * Server-only Lamatic SDK wiring for EvidenceFit.
 *
 * The "server-only" package is not a dependency of this kit (see apps/package.json).
 * We deliberately do not add it — this module relies on the "use server" boundary in
 * actions/orchestrate.ts, its only caller, to keep it out of client bundles.
 *
 * Every credential is read directly from process.env. None of these are ever read with
 * the browser-exposed env prefix Next.js inlines into the client bundle, because these
 * are secrets.
 */

import { Lamatic } from "lamatic";

function readEnv() {
  return {
    apiKey: process.env.LAMATIC_API_KEY,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiUrl: process.env.LAMATIC_API_URL,
  };
}

/** True when the core Lamatic connection credentials are all present. */
export function isLamaticConfigured(): boolean {
  const env = readEnv();
  return Boolean(env.apiKey && env.projectId && env.apiUrl);
}

let client: Lamatic | null = null;

/**
 * Lazily constructs a singleton Lamatic client. Throws a setup message — never an env
 * var value — when credentials are missing. Callers should check isLamaticConfigured()
 * first to choose between the local and deployed code paths.
 */
export function getLamaticClient(): Lamatic {
  const env = readEnv();
  if (!env.apiKey || !env.projectId || !env.apiUrl) {
    throw new Error(
      "Lamatic is not configured. Set LAMATIC_API_KEY, LAMATIC_PROJECT_ID and LAMATIC_API_URL in apps/.env.local."
    );
  }
  if (!client) {
    client = new Lamatic({
      endpoint: env.apiUrl,
      projectId: env.projectId,
      apiKey: env.apiKey,
    });
  }
  return client;
}

/**
 * Lamatic outputMapping may prefix values with `$` and stringify objects/arrays.
 * Empty string "" is common when a mapped field is missing — treat as null.
 */
export function unwrap(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const stripped = value.replace(/^\$/, "").trim();
  if (stripped === "") return null;
  if (stripped === "true") return true;
  if (stripped === "false") return false;
  if (stripped.startsWith("{") || stripped.startsWith("[")) {
    try {
      return JSON.parse(stripped);
    } catch {
      return stripped;
    }
  }
  return stripped;
}

/** Coerce a Lamatic field that should be a string array ("" / object / null -> []). */
export function asStringArray(value: unknown): string[] {
  const v = unwrap(value);
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

/** Coerce a Lamatic field that should be a plain object ("" / array / null -> {}). */
export function asRecord(value: unknown): Record<string, unknown> {
  const v = unwrap(value);
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

export function unwrapRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = unwrap(v);
  return out;
}
