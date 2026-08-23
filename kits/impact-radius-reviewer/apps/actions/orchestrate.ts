"use server";

import { getFlowId, lamatic } from "../lib/lamatic-client";
import { impactReviewSchema } from "../lib/schema";

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

/** Result returned to the client after attempting to generate an impact-radius brief. */
export type ImpactReviewResult = {
  ok: boolean;
  output?: string;
  error?: string;
  credentialDetected?: boolean;
};

/**
 * Validates the submitted DiffContext JSON + PR diff, redacts
 * credential-like values, then calls the deployed impact-review Lamatic
 * flow to generate the reviewer brief.
 */
export async function generateImpactBrief(
  rawInput: unknown
): Promise<ImpactReviewResult> {
  const parsed = impactReviewSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid input.",
    };
  }

  const { diffcontextJson, prDiff } = parsed.data;

  // Keep this outside try so the credential signal survives failures.
  let credentialDetected = false;

  try {
    const diffResult = redactCredentials(diffcontextJson);
    const prDiffResult = redactCredentials(prDiff);

    credentialDetected = diffResult.detected || prDiffResult.detected;

    const flowId = getFlowId();

    const payload = {
      diffcontext_json: diffResult.text,
      pr_diff: prDiffResult.text,
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
      credentialDetected,
    };
  }
}
