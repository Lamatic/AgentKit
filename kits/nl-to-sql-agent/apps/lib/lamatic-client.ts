import { Lamatic } from "lamatic";
import type { LamaticResponse } from "lamatic/dist/types";
import config from "../../lamatic.config";

if (!process.env.LAMATIC_API_URL) {
  throw new Error(
    "LAMATIC_API_URL is not set. Please add it to your .env.local file."
  );
}
if (!process.env.LAMATIC_PROJECT_ID) {
  throw new Error(
    "LAMATIC_PROJECT_ID is not set. Please add it to your .env.local file."
  );
}
if (!process.env.LAMATIC_API_KEY) {
  throw new Error(
    "LAMATIC_API_KEY is not set. Please add it to your .env.local file."
  );
}

const sqlFlowStep = config.steps.find(s => s.id === 'nl-to-sql-flow');
if (!sqlFlowStep) {
  throw new Error(
    'nl-to-sql-flow step not found in lamatic.config.ts. Please check the configuration.'
  );
}

const sqlFlowEnvKey = sqlFlowStep.envKey;
const nlToSqlFlowId = process.env[sqlFlowEnvKey];
if (!nlToSqlFlowId) {
  throw new Error(
    `${sqlFlowEnvKey} is not set. Please add it to your .env.local file.`
  );
}

export const NL_TO_SQL_FLOW_ID = nlToSqlFlowId;

const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY;
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID;

/**
 * Require that the Lamatic endpoint is HTTPS. The Lamatic API credential (the
 * Authorization Bearer header derived from LAMATIC_API_KEY) must only ever be
 * transmitted over a secure, authenticated transport. Any plain-HTTP endpoint
 * - including localhost and loopback - is rejected before a request can be
 * constructed, so the key can never be sent in cleartext.
 *
 * Returns the validated URL so that the module's only fetch target (the SDK
 * endpoint below) is the direct output of this validation.
 */
function validateLamaticEndpoint(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "Invalid LAMATIC_API_URL. Please set a valid https:// Lamatic API URL."
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      "Insecure LAMATIC_API_URL. Lamatic API credentials may only be transmitted over https://. Plain http:// endpoints, including localhost, are not allowed."
    );
  }

  return url;
}

// The only endpoint this module may send credentials to. Validation runs at
// module load (before any SDK request) and LAMATIC_API_URL is defined as the
// return value of that validation, so the SDK - which derives its
// Authorization Bearer header from LAMATIC_API_KEY internally - can never
// attach the credential to an HTTP or otherwise unvalidated URL.
const LAMATIC_API_URL = validateLamaticEndpoint(process.env.LAMATIC_API_URL);

// Official Lamatic SDK. All flow execution goes through executeFlow(); the SDK
// performs the authenticated GraphQL request to the validated endpoint above.
const lamaticClient = new Lamatic({
  endpoint: LAMATIC_API_URL,
  projectId: LAMATIC_PROJECT_ID,
  apiKey: LAMATIC_API_KEY,
});

/**
 * Application-level error for Lamatic flow execution failures. Carries the
 * HTTP status code (when the SDK/API provides one) so callers - e.g.
 * orchestrate.ts - can keep producing targeted 401/403 guidance without
 * parsing opaque strings. Never contains credential material.
 */
export class LamaticClientError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "LamaticClientError";
    this.statusCode = statusCode;
  }
}

/**
 * Normalize a resolved SDK execution response to the application contract.
 * The SDK's own `LamaticResponse` type is used so the shape can never drift
 * from what the SDK actually returns:
 *   - success -> { status: "success", result }
 *   - flow-level failure (non-HTTP, e.g. GraphQL 200) -> resolved
 *     { status: "error", result, message }, which callers already handle
 *   - HTTP-level failure (>= 400, e.g. 401/403/5xx) -> throws a
 *     LamaticClientError whose message keeps the historical
 *     "Lamatic API error (<status>): <detail>" shape.
 */
function normalizeLamaticResponse(
  response: LamaticResponse
): { status: string; result: any; message?: string } {
  if (!response) {
    throw new LamaticClientError("No response returned from Lamatic workflow");
  }

  if (response.status === "success") {
    return {
      status: "success",
      result: response.result ?? null,
    };
  }

  if (response.status === "error") {
    const detail = response.message || "Lamatic workflow execution failed.";
    const statusCode = response.statusCode;

    if (typeof statusCode === "number" && statusCode >= 400) {
      throw new LamaticClientError(
        `Lamatic API error (${statusCode}): ${detail}`,
        statusCode
      );
    }

    return {
      status: "error",
      result: response.result ?? null,
      message: detail,
    };
  }

  throw new LamaticClientError(
    "Lamatic workflow returned an unrecognized status"
  );
}

/**
 * Normalize a throw from the SDK (or the adapter above) into a predictable
 * application-level error. The SDK itself rethrows raw errors for network
 * failures and for non-JSON response bodies (a JSON.parse SyntaxError); those
 * are rewritten so callers always see a stable Lamatic message and no
 * confusing parser internals leak through. Secrets are never included.
 */
function normalizeLamaticError(error: unknown): LamaticClientError {
  if (error instanceof LamaticClientError) {
    return error;
  }

  const message =
    error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : String(error);

  if (
    /(Unexpected token|Unexpected end of JSON input|is not valid JSON|JSON\.parse)/.test(
      message
    )
  ) {
    return new LamaticClientError(
      `Lamatic API returned a non-JSON response: ${message.slice(0, 800)}`
    );
  }

  return new LamaticClientError(message);
}

export async function executeLamaticFlow(
  flowId: string,
  payload: Record<string, unknown>
): Promise<{ status: string; result: any; message?: string }> {
  try {
    const response = await lamaticClient.executeFlow(flowId, payload);
    return normalizeLamaticResponse(response);
  } catch (error) {
    throw normalizeLamaticError(error);
  }
}