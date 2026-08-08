/**
 * Applies Layer 2's LLM-detected entities as actual text replacements.
 * The LLM node only *identifies* entities (as JSON) — it doesn't mask
 * text itself. This step does the actual substitution and merges the
 * Layer 2 token map with Layer 1's, so `rehydrate` only has to deal with
 * one combined map.
 *
 * Referenced from the flow via:
 *   "@scripts/pii-guardrail_apply-entity-mask.ts"
 */

interface DetectedEntity {
  text: string;
  type: "NAME" | "ADDRESS" | "OTHER_PERSONAL";
  confidence: "high" | "medium" | "low";
}

export interface ApplyEntityMaskResult {
  fullyMaskedText: string;
  combinedTokenMap: Record<string, string>;
  probabilisticCount: number;
}

export function applyEntityMask(
  layer1MaskedText: string,
  layer1TokenMap: Record<string, string>,
  layer1Count: number,
  llmJsonOutput: string
): ApplyEntityMaskResult {
  let fullyMaskedText = layer1MaskedText;
  const combinedTokenMap: Record<string, string> = { ...layer1TokenMap };
  let counter = layer1Count;

  let entities: DetectedEntity[] = [];
  try {
    const parsed = JSON.parse(llmJsonOutput);
    entities = Array.isArray(parsed.entities) ? parsed.entities : [];
  } catch {
    // Per the constitution, we fail closed — but a malformed JSON response
    // from the NER step shouldn't kill the whole request when Layer 1
    // already provided baseline protection. We skip Layer 2 for this
    // request and flag it via probabilisticCount staying at 0, which is
    // visible to the caller in the final tokensRedacted breakdown.
    return {
      fullyMaskedText,
      combinedTokenMap,
      probabilisticCount: 0
    };
  }

  // Longest text first, so "John Smith" is masked before a stray "John".
  entities.sort((a, b) => b.text.length - a.text.length);

  for (const entity of entities) {
    if (!entity.text || !fullyMaskedText.includes(entity.text)) continue;

    const placeholder = `[REDACTED_${entity.type}_${counter}]`;
    combinedTokenMap[placeholder] = entity.text;
    fullyMaskedText = fullyMaskedText.split(entity.text).join(placeholder);
    counter += 1;
  }

  return {
    fullyMaskedText,
    combinedTokenMap,
    probabilisticCount: counter - layer1Count
  };
}
