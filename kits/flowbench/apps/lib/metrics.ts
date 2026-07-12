// metrics.ts — Pure utility functions for scoring and measurement
// No side effects, no API calls — just math.

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

/**
 * Compute cosine similarity between two vectors.
 *
 * Returns a value between -1 and 1. For embedding vectors (non-negative),
 * the range is effectively 0–1.
 *
 * @throws {Error} if vectors have different lengths or are empty.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector length mismatch: a has ${a.length} dimensions, b has ${b.length}`
    );
  }
  if (a.length === 0) {
    throw new Error("Cannot compute cosine similarity of empty vectors");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Guard against zero-magnitude vectors (all zeros)
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

// ---------------------------------------------------------------------------
// Regression detection
// ---------------------------------------------------------------------------

/**
 * Check if current latency is a regression vs baseline.
 * Default threshold: 1.20 (20% slower = regression).
 */
export function isLatencyRegression(
  current: number,
  baseline: number,
  threshold: number = 1.2
): boolean {
  return current > baseline * threshold;
}

/**
 * Check if current similarity is a regression vs baseline.
 * Default threshold: 0.1 (drop of >0.1 = regression).
 */
export function isSimilarityRegression(
  current: number,
  baseline: number,
  threshold: number = 0.1
): boolean {
  return (baseline - current) > threshold;
}

// ---------------------------------------------------------------------------
// Run ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a timestamp-based unique run ID.
 * Format: "run_YYYYMMDD_HHmmss_SSS"
 */
export function generateRunId(): string {
  const now = new Date();
  const pad = (n: number, len: number = 2) =>
    String(n).padStart(len, "0");

  const date = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("");

  const time = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");

  const ms = pad(now.getMilliseconds(), 3);

  return `run_${date}_${time}_${ms}`;
}

// ---------------------------------------------------------------------------
// Percentile computation
// ---------------------------------------------------------------------------

/**
 * Compute a percentile value from a sorted-ascending array of numbers.
 * Uses linear interpolation between closest ranks.
 *
 * @param sorted - Array of numbers, MUST be sorted ascending.
 * @param p      - Percentile in 0–100 (e.g. 50 for p50, 95 for p95).
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
