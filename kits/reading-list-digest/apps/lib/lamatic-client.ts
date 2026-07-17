import { Lamatic } from "lamatic";

function missingEnvKeys(): string[] {
  const required = [
    "LAMATIC_API_URL",
    "LAMATIC_PROJECT_ID",
    "LAMATIC_API_KEY",
  ] as const;
  return required.filter((k) => !process.env[k]);
}

export function getLamaticConfigError(): string | null {
  const missing = missingEnvKeys();
  if (!missing.length) return null;
  return `Missing in apps/.env.local: ${missing.join(", ")}. Run: cd apps && cp .env.example .env.local`;
}

let client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  const err = getLamaticConfigError();
  if (err) throw new Error(err);

  if (!client) {
    client = new Lamatic({
      endpoint: process.env.LAMATIC_API_URL!,
      projectId: process.env.LAMATIC_PROJECT_ID!,
      apiKey: process.env.LAMATIC_API_KEY!,
    });
  }
  return client;
}

/**
 * Lamatic outputMapping may prefix values with `$` and stringify objects/arrays.
 */
export function unwrap(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const stripped = value.replace(/^\$/, "");
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

export function unwrapRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = unwrap(v);
  }
  return out;
}
