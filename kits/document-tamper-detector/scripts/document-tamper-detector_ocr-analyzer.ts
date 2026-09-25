/**
 * OCR Font & Spacing Analyzer — Signal 2 (Weight: 30%)
 *
 * Simulates the OCR bounding-box font consistency check that would be performed
 * by pytesseract in a Python environment. In Lamatic's TS runtime, this node
 * analyses the document by calling a Lamatic-configured OCR integration or,
 * for demonstration, applies statistical heuristics on known tamper patterns.
 *
 * Detection approach:
 * - Calls Lamatic's document parsing / OCR capability via the inputs pipeline
 * - Receives word-level bounding boxes with character metrics
 * - Computes mean and standard deviation of font heights and spacing across lines
 * - Flags statistical outliers (> 2σ from mean) as potential tampering signals
 *
 * Classic tamper pattern: a number or name edited in a different application
 * will have subtly different font metrics than the surrounding original text.
 */

interface BoundingBox {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  conf: number;         // OCR confidence 0-100
  line_num: number;
  block_num: number;
}

interface OCRFlag {
  region: string;
  signal: "font_spacing";
  confidence: number;
  explanation: string;
  raw_detail: string;
  bounding_box?: { x: number; y: number; w: number; h: number };
}

interface OCRResult {
  flags: OCRFlag[];
  confidence: number;
  summary: string;
  words_analyzed: number;
  flagged_regions_description: string;
  /** True when no ocrBoxes were provided and the signal was not run. */
  skipped?: boolean;
}

// Statistical helpers
/** Returns the arithmetic mean of the given numeric array, or 0 for an empty array. */
function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

/** Returns the population standard deviation of arr given its precomputed mean m. */
function stdDev(arr: number[], m: number): number {
  if (arr.length < 2) return 0;
  return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length);
}

/**
 * Analyses an array of OCR bounding boxes for statistical font-height and
 * inter-word-gap outliers (> 2.5σ / 2.8σ from the document mean).
 * Returns an OCRFlag for each outlier found.
 */
function analyzeBoxes(boxes: BoundingBox[]): OCRFlag[] {
  const flags: OCRFlag[] = [];

  // Filter to high-confidence words only
  const confident = boxes.filter(b => b.conf > 60 && b.text.trim().length > 0);
  if (confident.length < 5) return flags; // Not enough data

  // Compute per-line metrics
  const lineMap: Map<number, BoundingBox[]> = new Map();
  for (const box of confident) {
    const key = box.block_num * 1000 + box.line_num;
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key)!.push(box);
  }

  // Collect heights of all words for global statistics
  const allHeights = confident.map(b => b.height);
  const globalMeanHeight = mean(allHeights);
  const globalStdHeight = stdDev(allHeights, globalMeanHeight);

  // Collect inter-word gaps within lines
  const allGaps: number[] = [];
  lineMap.forEach(words => {
    const sorted = [...words].sort((a, b) => a.left - b.left);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].left - (sorted[i - 1].left + sorted[i - 1].width);
      if (gap > 0 && gap < 200) allGaps.push(gap);
    }
  });
  const globalMeanGap = mean(allGaps);
  const globalStdGap = stdDev(allGaps, globalMeanGap);

  // Threshold: flag words > 2.5σ from mean
  const HEIGHT_SIGMA_THRESHOLD = 2.5;
  const GAP_SIGMA_THRESHOLD = 2.8;

  // Check each word for height outlier
  for (const box of confident) {
    if (globalStdHeight > 0) {
      const zHeight = Math.abs(box.height - globalMeanHeight) / globalStdHeight;
      if (zHeight > HEIGHT_SIGMA_THRESHOLD) {
        const confidence = Math.min(0.4 + (zHeight - HEIGHT_SIGMA_THRESHOLD) * 0.12, 0.88);
        flags.push({
          region: `Text block containing "${box.text.substring(0, 30)}${box.text.length > 30 ? "..." : ""}"`,
          signal: "font_spacing",
          confidence,
          explanation: `The text "${box.text}" has a font height ${Math.round(zHeight * 10) / 10}× further from the document average than expected. This type of size mismatch is a common sign that text was inserted or modified using a different application after the document was originally created.`,
          raw_detail: `Word height: ${box.height}px, global mean: ${Math.round(globalMeanHeight)}px, σ: ${Math.round(globalStdHeight)}px, z-score: ${Math.round(zHeight * 10) / 10}`,
          bounding_box: { x: box.left, y: box.top, w: box.width, h: box.height }
        });
      }
    }
  }

  // Check for inter-word spacing outliers within lines
  lineMap.forEach(words => {
    const sorted = [...words].sort((a, b) => a.left - b.left);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].left - (sorted[i - 1].left + sorted[i - 1].width);
      if (gap > 0 && gap < 200 && globalStdGap > 0) {
        const zGap = Math.abs(gap - globalMeanGap) / globalStdGap;
        if (zGap > GAP_SIGMA_THRESHOLD) {
          const prevWord = sorted[i - 1].text;
          const nextWord = sorted[i].text;
          const confidence = Math.min(0.38 + (zGap - GAP_SIGMA_THRESHOLD) * 0.10, 0.80);
          flags.push({
            region: `Between "${prevWord}" and "${nextWord}"`,
            signal: "font_spacing",
            confidence,
            explanation: `There is an unusual gap between the words "${prevWord}" and "${nextWord}" — ${Math.round(zGap * 10) / 10}× larger than the typical word spacing in this document. Inconsistent spacing around a specific word or number can indicate it was typed over or inserted separately from the original content.`,
            raw_detail: `Gap: ${gap}px, global mean gap: ${Math.round(globalMeanGap)}px, σ: ${Math.round(globalStdGap)}px, z-score: ${Math.round(zGap * 10) / 10}`,
            bounding_box: {
              x: sorted[i - 1].left + sorted[i - 1].width,
              y: sorted[i].top,
              w: gap,
              h: sorted[i].height
            }
          });
        }
      }
    }
  });

  return flags;
}

/**
 * Builds a human-readable description of flagged regions for use in the
 * downstream VLM prompt template.
 */
function buildRegionDescription(flags: OCRFlag[]): string {
  if (flags.length === 0) return "No regions flagged by OCR analysis.";
  return flags
    .map((f, i) => `Region ${i + 1}: ${f.region} — ${f.raw_detail}`)
    .join("\n");
}

// Main execution
const ocrOutput = inputs.codeNode_metadata?.output ?? null;
// In a real Lamatic flow, OCR results would come from a dedicated OCR node or
// from Lamatic's document parsing integration upstream. Here we check if the
// flow has provided OCR bounding boxes via an earlier node.
const boxes: BoundingBox[] = inputs.triggerNode_1?.output?.ocrBoxes ?? [];

let result: OCRResult = {
  flags: [],
  confidence: 0,
  summary: "No OCR data available for font analysis.",
  words_analyzed: 0,
  flagged_regions_description: "No OCR data available."
};

try {
  if (boxes.length > 0) {
    const flags = analyzeBoxes(boxes);

    // Deduplicate: keep highest-confidence flag per region
    const dedupMap = new Map<string, OCRFlag>();
    for (const f of flags) {
      const existing = dedupMap.get(f.region);
      if (!existing || f.confidence > existing.confidence) {
        dedupMap.set(f.region, f);
      }
    }
    const deduped = Array.from(dedupMap.values()).sort((a, b) => b.confidence - a.confidence);

    const confidence = deduped.length > 0
      ? Math.min(deduped.reduce((sum, f) => sum + f.confidence, 0) / deduped.length, 1.0)
      : 0;

    const summary = deduped.length === 0
      ? "No font/spacing anomalies detected."
      : `${deduped.length} font/spacing anomaly(ies) detected.`;

    result = {
      flags: deduped,
      confidence,
      summary,
      words_analyzed: boxes.length,
      flagged_regions_description: buildRegionDescription(deduped)
    };
  } else {
    // No OCR boxes provided — mark the signal as skipped so downstream
    // weight redistribution can exclude it from the composite score.
    result = {
      flags: [],
      confidence: 0,
      skipped: true,
      summary: "OCR analysis skipped — no bounding box data in payload. Provide ocrBoxes[] in the trigger payload to enable this signal.",
      words_analyzed: 0,
      flagged_regions_description: "OCR analysis was not run on this document."
    };
  }
} catch (e: any) {
  result = {
    flags: [],
    confidence: 0,
    summary: `OCR analysis failed: ${e.message}`,
    words_analyzed: 0,
    flagged_regions_description: "OCR analysis failed."
  };
}

return result;
