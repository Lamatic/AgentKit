
/**
 * Scores model outputs locally using sentence embeddings
 * (Xenova/all-MiniLM-L6-v2 via Transformers.js). No external API calls
 * are made for scoring — runs offline after the model is downloaded
 * on first use.
 */

import { cosineSimilarity } from "../lib/metrics";

// ---------------------------------------------------------------------------
// Embedding pipeline (lazy singleton)
// ---------------------------------------------------------------------------

// We dynamically import @xenova/transformers and cache the pipeline so the
// model is only loaded once even if scoreOutput is called many times.

type FeatureExtractionPipeline = (
  texts: string[],
  options?: { pooling: string; normalize: boolean }
) => Promise<{ tolist: () => number[][] }>;

let pipelineInstance: FeatureExtractionPipeline | null = null;

async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (pipelineInstance) return pipelineInstance;

  // Dynamic import — @xenova/transformers is ESM-only
  const { pipeline } = await import("@xenova/transformers");
  const pipe = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  // Cache it for subsequent calls
  pipelineInstance = pipe as unknown as FeatureExtractionPipeline;
  return pipelineInstance;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScoreResult {
  /** Cosine similarity between actual and expected (0.0 – 1.0). */
  similarity: number;
  /** Whether similarity >= threshold. */
  pass: boolean;
}

/**
 * Score an actual output against an expected reference using local
 * sentence-embedding cosine similarity.
 *
 * @param actual    - The actual output string from the flow.
 * @param expected  - The reference/expected output string.
 * @param threshold - Minimum similarity to pass (default: 0.7).
 *
 * Edge cases:
 *   - Empty actual or expected → similarity = 0.0, pass = false
 *   - Identical strings → ~1.0 (not exactly 1.0 due to float math)
 */
export async function scoreOutput(
  actual: string,
  expected: string,
  threshold: number = 0.7
): Promise<ScoreResult> {
  // Edge case: empty strings
  if (!actual.trim() || !expected.trim()) {
    return { similarity: 0.0, pass: false };
  }

  const pipe = await getEmbeddingPipeline();

  // Batch both texts in a single call for efficiency
  const output = await pipe([actual, expected], {
    pooling: "mean",
    normalize: true,
  });

  const embeddings = output.tolist();
  const similarity = cosineSimilarity(embeddings[0], embeddings[1]);

  // Clamp to [0, 1] for display (embeddings are non-negative after normalization)
  const clamped = Math.max(0, Math.min(1, similarity));
  const rounded = Math.round(clamped * 10000) / 10000;

  return {
    similarity: rounded,
    pass: rounded >= threshold,
  };
}
