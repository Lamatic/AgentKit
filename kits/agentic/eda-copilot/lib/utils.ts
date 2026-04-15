import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ColumnStats {
  name: string;
  type: "numeric" | "categorical" | "datetime" | "boolean" | "unknown";
  count: number;
  missing: number;
  missingPct: number;
  unique: number;
  // Numeric
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  q25?: number;
  median?: number;
  q75?: number;
  skewness?: number;
  // Categorical
  topValues?: { value: string; count: number }[];
}

export interface DatasetSummary {
  rowCount: number;
  colCount: number;
  totalMissing: number;
  totalMissingPct: number;
  columns: ColumnStats[];
  sampleRows: Record<string, string | number | null>[];
  correlationHints: { col1: string; col2: string; correlation: number }[];
}

/**
 * Computes a Pearson correlation coefficient between two numeric arrays.
 */
function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const denom = Math.sqrt(denX * denY);
  return denom === 0 ? 0 : num / denom;
}

/**
 * Computes skewness of a numeric array.
 */
function skewness(values: number[], mean: number, std: number): number {
  if (std === 0 || values.length < 3) return 0;
  const n = values.length;
  const cubic = values.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0);
  return (n / ((n - 1) * (n - 2))) * cubic;
}

/**
 * Detects column type from a sample of string values.
 */
function detectType(
  samples: string[]
): "numeric" | "categorical" | "datetime" | "boolean" | "unknown" {
  const nonEmpty = samples.filter((s) => s !== "" && s !== null && s !== undefined);
  if (nonEmpty.length === 0) return "unknown";

  const boolValues = new Set(["true", "false", "yes", "no", "0", "1"]);
  if (nonEmpty.every((s) => boolValues.has(s.toLowerCase()))) return "boolean";

  const numericCount = nonEmpty.filter((s) => !isNaN(parseFloat(s)) && isFinite(Number(s))).length;
  if (numericCount / nonEmpty.length > 0.9) return "numeric";

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}/,
    /^\d{4}\/\d{2}\/\d{2}/,
  ];
  const dateCount = nonEmpty.filter((s) => datePatterns.some((p) => p.test(s))).length;
  if (dateCount / nonEmpty.length > 0.8) return "datetime";

  return "categorical";
}

/**
 * Full client-side EDA computation from parsed CSV data.
 */
export function computeDatasetSummary(
  data: Record<string, string>[],
  maxSampleRows = 5
): DatasetSummary {
  if (data.length === 0) {
    return {
      rowCount: 0,
      colCount: 0,
      totalMissing: 0,
      totalMissingPct: 0,
      columns: [],
      sampleRows: [],
      correlationHints: [],
    };
  }

  const colNames = Object.keys(data[0]);
  const rowCount = data.length;

  const columns: ColumnStats[] = colNames.map((name) => {
    const rawValues = data.map((row) => row[name]);
    const missing = rawValues.filter(
      (v) => v === "" || v === null || v === undefined || v === "null" || v === "NA" || v === "N/A" || v === "nan"
    ).length;
    const nonMissing = rawValues.filter(
      (v) => v !== "" && v !== null && v !== undefined && v !== "null" && v !== "NA" && v !== "N/A" && v !== "nan"
    );
    const unique = new Set(nonMissing).size;
    const type = detectType(nonMissing.slice(0, 100));

    const base: ColumnStats = {
      name,
      type,
      count: rowCount,
      missing,
      missingPct: parseFloat(((missing / rowCount) * 100).toFixed(2)),
      unique,
    };

    if (type === "numeric") {
      const nums = nonMissing.map(Number).filter(isFinite);
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
        const std = Math.sqrt(variance);
        const q25 = nums[Math.floor(nums.length * 0.25)];
        const median = nums[Math.floor(nums.length * 0.5)];
        const q75 = nums[Math.floor(nums.length * 0.75)];
        return {
          ...base,
          mean: parseFloat(mean.toFixed(4)),
          std: parseFloat(std.toFixed(4)),
          min: nums[0],
          max: nums[nums.length - 1],
          q25,
          median,
          q75,
          skewness: parseFloat(skewness(nums, mean, std).toFixed(4)),
        };
      }
    }

    if (type === "categorical" || type === "boolean") {
      const freq: Record<string, number> = {};
      nonMissing.forEach((v) => {
        freq[v] = (freq[v] || 0) + 1;
      });
      const topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
      return { ...base, topValues };
    }

    return base;
  });

  // Compute correlation hints between numeric columns (top 10 pairs)
  const numericCols = columns.filter((c) => c.type === "numeric");
  const correlationHints: { col1: string; col2: string; correlation: number }[] = [];

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const c1 = numericCols[i].name;
      const c2 = numericCols[j].name;
      const xs = data
        .map((row) => parseFloat(row[c1]))
        .filter(isFinite);
      const ys = data
        .map((row) => parseFloat(row[c2]))
        .filter(isFinite);
      const minLen = Math.min(xs.length, ys.length);
      if (minLen > 5) {
        const corr = pearsonCorrelation(xs.slice(0, minLen), ys.slice(0, minLen));
        correlationHints.push({
          col1: c1,
          col2: c2,
          correlation: parseFloat(corr.toFixed(4)),
        });
      }
    }
  }

  const topCorrelations = correlationHints
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 10);

  const totalMissing = columns.reduce((acc, c) => acc + c.missing, 0);
  const totalCells = rowCount * colNames.length;

  return {
    rowCount,
    colCount: colNames.length,
    totalMissing,
    totalMissingPct: parseFloat(((totalMissing / totalCells) * 100).toFixed(2)),
    columns,
    sampleRows: data.slice(0, maxSampleRows) as Record<string, string | number | null>[],
    correlationHints: topCorrelations,
  };
}
