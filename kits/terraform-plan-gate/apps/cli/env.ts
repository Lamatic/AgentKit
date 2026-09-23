import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { assertHttpsEndpoint, pinRedirectPolicy } from "../lib/endpoint";

/** Load apps/.env.local into process.env without overriding values already set. */
export function loadDotEnvLocal() {
  const p = resolve(__dirname, "..", ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=(.*)$/);
    // An explicitly set variable wins even when it is empty; only unset ones are filled.
    if (!m || process.env[m[1]] !== undefined) continue;
    const value = m[2].trim();
    const quoted = value.match(/^"(.*)"$|^'(.*)'$/);
    process.env[m[1]] = quoted ? (quoted[1] ?? quoted[2]) : value;
  }
}

export class ConfigError extends Error {}

/** Read a required variable or throw a ConfigError (exit 3) with a readable message. */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new ConfigError(`Missing ${name}. Set it in the environment or in apps/.env.local.`);
  return v;
}

/** The Lamatic endpoint, checked to be HTTPS before any credential is attached. */
export function endpoint(): string {
  try {
    const url = assertHttpsEndpoint(env("LAMATIC_API_URL"));
    pinRedirectPolicy(url);
    return url;
  } catch (e) {
    throw new ConfigError(e instanceof Error ? e.message : String(e));
  }
}
