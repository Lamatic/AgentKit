const REQUIRED_KEYS = [
  "DOC_EXTRACT_FLOW",
  "DOC_VERIFY_FLOW",
  "DOC_REPORT_FLOW",
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
] as const;

export type EnvironmentKey = (typeof REQUIRED_KEYS)[number];
export type LamaticEnvironment = Record<EnvironmentKey, string>;

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

function isPlaceholder(key: EnvironmentKey, value: string): boolean {
  const normalized = value.trim().toUpperCase();
  return (
    normalized === key ||
    normalized.includes("FLOW ID") ||
    normalized.startsWith("YOUR_") ||
    normalized.startsWith("ACTUAL-") ||
    normalized.includes("PLACEHOLDER")
  );
}

export function validateEnvironment(
  source: Readonly<Record<string, string | undefined>>,
): LamaticEnvironment {
  const result = {} as LamaticEnvironment;
  const invalid: string[] = [];

  for (const key of REQUIRED_KEYS) {
    const value = source[key]?.trim() ?? "";
    if (!value || isPlaceholder(key, value)) {
      invalid.push(key);
    } else {
      result[key] = value;
    }
  }

  if (invalid.length > 0) {
    throw new ConfigurationError(
      `Missing or placeholder environment values: ${invalid.join(", ")}.`,
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(result.LAMATIC_API_URL);
  } catch {
    throw new ConfigurationError(
      "LAMATIC_API_URL must be a complete absolute URL copied from Lamatic API Docs.",
    );
  }
  // https is always accepted; http only outside production, so a deployed app
  // can never silently talk to Lamatic over an unencrypted endpoint.
  const httpAllowed = process.env.NODE_ENV !== "production";
  const validProtocol =
    endpoint.protocol === "https:" || (httpAllowed && endpoint.protocol === "http:");
  if (!validProtocol) {
    throw new ConfigurationError(
      httpAllowed
        ? "LAMATIC_API_URL must use http:// or https://."
        : "LAMATIC_API_URL must use https:// (http:// is only allowed outside production).",
    );
  }

  return result;
}

export function getLamaticEnvironment(): LamaticEnvironment {
  return validateEnvironment(process.env);
}
