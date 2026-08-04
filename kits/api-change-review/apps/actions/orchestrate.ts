"use server";

import { diffSpecs } from "../lib/spec-diff";
import { parseSpec, assertLooksLikeOpenApi } from "../lib/parse-spec";
import { getLamaticClient, flowIdFor } from "../lib/lamatic-client";
import type { ReviewResult, ReviewResponse } from "../lib/types";

/**
 * The SDK reports failures as a value — `{ status: "error", message }` — instead
 * of throwing, so an auth or flow error arrives looking like a successful call.
 * Check that before unwrapping, or the real reason gets replaced by a generic
 * "unexpected shape" message.
 *
 * On success the payload may be the flow's API Response directly or wrapped in a
 * `result` envelope depending on flow configuration; handle either.
 */
function unwrap(raw: any): ReviewResult {
  if (raw?.status === "error" || raw?.message) {
    const detail = raw.message ?? "unknown error";
    const code = raw.statusCode ? ` (HTTP ${raw.statusCode})` : "";
    throw new Error(`Lamatic rejected the request${code}: ${detail}`);
  }

  const payload = raw?.result ?? raw;
  if (!payload || typeof payload !== "object" || !payload.verdict) {
    throw new Error(
      "The flow returned an unexpected shape — no `verdict` field was present in the response."
    );
  }
  return payload as ReviewResult;
}

export async function reviewApiChanges(input: {
  oldSpecText: string;
  newSpecText: string;
  audience: string;
}): Promise<ReviewResponse> {
  try {
    const oldSpec = parseSpec(input.oldSpecText, "Previous spec");
    const newSpec = parseSpec(input.newSpecText, "New spec");
    assertLooksLikeOpenApi(oldSpec, "Previous spec");
    assertLooksLikeOpenApi(newSpec, "New spec");

    const diff = diffSpecs(oldSpec, newSpec);

    // No changes: answer locally. There is nothing for the model to judge, and
    // it keeps the identical-spec case instant.
    if (!diff.hasChanges) {
      return {
        ok: true,
        data: {
          verdict: "no-api-change",
          summary: "No differences found in the API surface between the two specs.",
          oldVersion: diff.oldVersion,
          newVersion: diff.newVersion,
          totalChanges: 0,
          counts: { breaking: 0, potentiallyBreaking: 0, additive: 0 },
          changes: [],
          migrationNotes: null,
          changelog: null,
        },
      };
    }

    const client = getLamaticClient();
    const raw = await client.executeFlow(flowIdFor("step1"), {
      changes: diff.changes,
      totalChanges: diff.totalChanges,
      oldVersion: diff.oldVersion,
      newVersion: diff.newVersion,
      endpointsTouched: diff.endpointsTouched,
      audience: input.audience,
    });

    return { ok: true, data: unwrap(raw) };
  } catch (e: any) {
    // Errors come back as values — a thrown error inside a server action renders
    // as a blank screen in the client component.
    let message = e?.message ?? "Review failed.";
    if (typeof message === "string" && message.includes("fetch failed")) {
      message =
        "Could not reach Lamatic. Check LAMATIC_API_URL and your network connection.";
    } else if (typeof message === "string" && message.includes("HTTP 403")) {
      message +=
        " — check LAMATIC_API_KEY is an API key from Studio > Settings > API Keys, not the Project ID.";
    }
    return { ok: false, error: message };
  }
}
