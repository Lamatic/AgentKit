import { runDeterministicCacheBenchmark } from "../lib/benchmark";

const result = runDeterministicCacheBenchmark();

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
