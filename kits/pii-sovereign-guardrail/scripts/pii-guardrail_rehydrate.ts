/**
 * Rehydration — restores original values into the model's response.
 *
 * Runs after the `generate` node. Takes the combined token map (Layer 1 +
 * Layer 2) and the model's masked-space response, and swaps placeholders
 * back to real values. Per the constitution (see constitutions/default.md),
 * this token map exists only for the lifetime of a single request and is
 * never persisted.
 *
 * This file is referenced from the flow via:
 *   "@scripts/pii-guardrail_rehydrate.ts"
 */

export interface RehydrateResult {
  secureResponse: string;
  tokensRedacted: {
    total: number;
    deterministic: number;
    probabilistic: number;
  };
}

export function rehydrateResponse(
  aiOutput: string,
  tokenMap: Record<string, string>,
  deterministicCount: number,
  probabilisticCount: number
): RehydrateResult {
  let secureResponse = aiOutput;

  // Replace longest placeholders first to avoid partial-match collisions
  // (e.g. [REDACTED_EMAIL_10] vs [REDACTED_EMAIL_1]).
  const placeholders = Object.keys(tokenMap).sort(
    (a, b) => b.length - a.length
  );

  for (const placeholder of placeholders) {
    const original = tokenMap[placeholder];
    // Split/join instead of a regex replace — placeholders are static
    // strings, not patterns, so this avoids any regex-injection surface.
    secureResponse = secureResponse.split(placeholder).join(original);
  }

  return {
    secureResponse,
    tokensRedacted: {
      total: deterministicCount + probabilisticCount,
      deterministic: deterministicCount,
      probabilistic: probabilisticCount
    }
  };
}
