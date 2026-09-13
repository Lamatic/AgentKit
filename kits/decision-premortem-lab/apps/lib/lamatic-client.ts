import { Lamatic } from "lamatic";

type JsonRecord = Record<string, unknown>;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Add it to apps/.env.local.`);
  return value;
}

function parsePossiblyEncoded(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const normalized = value.startsWith("$") ? value.slice(1) : value;
  try {
    return JSON.parse(normalized);
  } catch {
    return value;
  }
}

function requireHttpsEndpoint(value: string): string {
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    throw new Error("LAMATIC_API_URL must be a valid HTTPS URL.");
  }
  if (endpoint.protocol !== "https:") {
    throw new Error("LAMATIC_API_URL must use HTTPS.");
  }
  return value;
}

export function normalizeLamaticResult(value: unknown): unknown {
  const parsed = parsePossiblyEncoded(value);
  if (Array.isArray(parsed)) return parsed.map(normalizeLamaticResult);
  if (parsed && typeof parsed === "object") {
    return Object.fromEntries(
      Object.entries(parsed as JsonRecord).map(([key, item]) => [
        key.startsWith("$") ? key.slice(1) : key,
        normalizeLamaticResult(item),
      ]),
    );
  }
  return parsed;
}

export async function executeDecisionPremortem(payload: JsonRecord): Promise<unknown> {
  const endpoint = requireHttpsEndpoint(requiredEnvironment("LAMATIC_API_URL"));
  const projectId = requiredEnvironment("LAMATIC_PROJECT_ID");
  const apiKey = requiredEnvironment("LAMATIC_API_KEY");
  const workflowId = requiredEnvironment("DECISION_PREMORTEM_FLOW_ID");

  const client = new Lamatic({ endpoint, projectId, apiKey });
  const response = await client.executeFlow(workflowId, payload);
  if (response?.result == null) throw new Error("Lamatic returned no analysis result.");
  return normalizeLamaticResult(response.result);
}
