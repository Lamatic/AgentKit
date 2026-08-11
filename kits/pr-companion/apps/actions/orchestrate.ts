"use server";

import { getFlowId, lamatic } from "../lib/lamatic-client";
import { prCompanionSchema } from "../lib/schema";

const CREDENTIAL_MARKER = "[credential detected; value omitted]";

function redactCredentials(input: string): {
  text: string;
  detected: boolean;
} {
  let detected = false;
  let text = input;

  const patterns = [
    /AKIA[0-9A-Z]{16}/g,
    /gh[pousr]_[A-Za-z0-9]{36,255}/g,
    /xox[baprs]-[A-Za-z0-9-]{10,72}/g,
    /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    /(api[_-]?key|secret|token|password|passwd|pwd)\s*[:=]\s*["']?[A-Za-z0-9._/+=-]{8,}["']?/gi,
    /(sk|pk|rk)_(live|test)_[A-Za-z0-9]{16,}/g,
  ];

  for (const pattern of patterns) {
    text = text.replace(pattern, () => {
      detected = true;
      return CREDENTIAL_MARKER;
    });
  }

  return {
    text,
    detected,
  };
}

/** Result returned to the client after attempting to generate a PR description. */
export type PRCompanionResult = {
  ok: boolean;
  output?: string;
  error?: string;
  credentialDetected?: boolean;
};

/**
 * Validates the submitted diff/commits/intent against the shared schema,
 * redacts credential-like values, then calls the deployed pr-flow Lamatic
 * flow to generate a PR description.
 */
export async function generatePRDescription(
  rawInput: unknown
): Promise<PRCompanionResult> {
  const parsed = prCompanionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid input.",
    };
  }

  const { diffOrFiles, commitMessages, intent } = parsed.data;

  try {
    const flowId = getFlowId();

    const diffResult = redactCredentials(diffOrFiles);
    const commitResult = redactCredentials(commitMessages);
    const intentResult = redactCredentials(intent ?? "");

    const credentialDetected =
      diffResult.detected ||
      commitResult.detected ||
      intentResult.detected;

    const payload = {
      diff_or_files: diffResult.text,
      commit_messages: commitResult.text,
      intent: intentResult.text,
      credential_detected: credentialDetected,
    };

    const response = await lamatic.executeFlow(flowId, payload);

    if (response.status === "error") {
      return {
        ok: false,
        error:
          response.message ??
          "Flow returned an error.",
        credentialDetected,
      };
    }

    return {
      ok: true,
      output: String(
        (response.result as { output?: string })?.output ?? ""
      ),
      credentialDetected,
    };
  } catch (err: any) {
    return {
      ok: false,
      error:
        err?.message ??
        "Something went wrong calling the flow.",
    };
  }
}