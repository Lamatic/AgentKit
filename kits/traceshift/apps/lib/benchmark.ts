import type { WorkloadBenchmark } from "./types";

const canonical = (value: unknown): string => {
  if (value === undefined) return "__undefined__";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const expensiveLookup = (input: { product: string }, iterations: number) => {
  let checksum = 0;
  const seed = input.product.charCodeAt(input.product.length - 1);
  for (let index = 0; index < iterations; index += 1) {
    checksum = (checksum + Math.imul(index ^ seed, 2654435761)) >>> 0;
  }
  return { product: input.product, stock: input.product === "sku-D" ? 0 : 18, checksum };
};

export function runDeterministicCacheBenchmark(
  totalRequests = 240,
  uniqueInputs = 12,
  iterations = 60_000,
): WorkloadBenchmark {
  if (!Number.isSafeInteger(totalRequests) || totalRequests <= 0) {
    throw new RangeError("totalRequests must be a positive integer.");
  }
  if (!Number.isSafeInteger(uniqueInputs) || uniqueInputs <= 0) {
    throw new RangeError("uniqueInputs must be a positive integer.");
  }
  if (uniqueInputs > totalRequests) {
    throw new RangeError("uniqueInputs cannot exceed totalRequests.");
  }
  if (!Number.isSafeInteger(iterations) || iterations <= 0) {
    throw new RangeError("iterations must be a positive integer.");
  }
  const workload = Array.from({ length: totalRequests }, (_, index) => ({
    product: `sku-${String(index % uniqueInputs).padStart(2, "0")}`,
  }));

  const baselineStart = performance.now();
  const baselineOutputs = workload.map((input) => expensiveLookup(input, iterations));
  const baselineMilliseconds = performance.now() - baselineStart;

  const cache = new Map<string, ReturnType<typeof expensiveLookup>>();
  let optimizedCalls = 0;
  let cacheHits = 0;
  const optimizedStart = performance.now();
  const optimizedOutputs = workload.map((input) => {
    const key = canonical(input);
    const cached = cache.get(key);
    if (cached) {
      cacheHits += 1;
      return cached;
    }
    optimizedCalls += 1;
    const output = expensiveLookup(input, iterations);
    cache.set(key, output);
    return output;
  });
  const optimizedMilliseconds = performance.now() - optimizedStart;
  const agreements = optimizedOutputs.filter(
    (output, index) => canonical(output) === canonical(baselineOutputs[index]),
  ).length;

  return {
    name: "Exact-input cache replay benchmark",
    uniqueInputs,
    totalRequests,
    baselineCalls: totalRequests,
    optimizedCalls,
    cacheHits,
    outputAgreement: totalRequests ? agreements / totalRequests : 1,
    baselineMilliseconds: Number(baselineMilliseconds.toFixed(3)),
    optimizedMilliseconds: Number(optimizedMilliseconds.toFixed(3)),
    speedup: optimizedMilliseconds > 0
      ? Number((baselineMilliseconds / optimizedMilliseconds).toFixed(2))
      : 0,
  };
}
