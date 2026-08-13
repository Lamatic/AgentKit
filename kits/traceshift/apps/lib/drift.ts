import type { AnalysisReport, DriftMetric, DriftReport, DriftSignal } from "./types";

const rounded = (value: number, digits = 4): number => Number(value.toFixed(digits));

const metric = (
  name: string,
  baseline: number,
  current: number,
  lowerIsBetter: boolean,
): DriftMetric => {
  const absoluteDelta = current - baseline;
  const percentDelta = baseline === 0 ? null : absoluteDelta / baseline;
  const threshold = Math.max(Math.abs(baseline) * 0.01, 0.000001);
  const changed = Math.abs(absoluteDelta) > threshold;
  const improved = lowerIsBetter ? absoluteDelta < 0 : absoluteDelta > 0;
  return {
    name,
    baseline: rounded(baseline),
    current: rounded(current),
    absoluteDelta: rounded(absoluteDelta),
    percentDelta: percentDelta === null ? null : rounded(percentDelta),
    direction: !changed ? "unchanged" : improved ? "improved" : "regressed",
  };
};

export function compareTraceWindows(
  baseline: AnalysisReport,
  current: AnalysisReport,
): DriftReport {
  const metrics = [
    metric("p50 latency", baseline.metrics.p50Seconds, current.metrics.p50Seconds, true),
    metric("p95 latency", baseline.metrics.p95Seconds, current.metrics.p95Seconds, true),
    metric("cost per successful run",
      baseline.metrics.successfulRuns ? baseline.metrics.totalCost / baseline.metrics.successfulRuns : 0,
      current.metrics.successfulRuns ? current.metrics.totalCost / current.metrics.successfulRuns : 0,
      true,
    ),
    metric("tokens per successful run",
      baseline.metrics.successfulRuns ? baseline.metrics.totalTokens / baseline.metrics.successfulRuns : 0,
      current.metrics.successfulRuns ? current.metrics.totalTokens / current.metrics.successfulRuns : 0,
      true,
    ),
    metric("success rate", baseline.metrics.successRate, current.metrics.successRate, false),
  ];

  const baselinePaths = new Map(baseline.paths.map((path) => [path.signature, path]));
  const currentPaths = new Map(current.paths.map((path) => [path.signature, path]));
  const newPaths = [...currentPaths.keys()].filter((path) => !baselinePaths.has(path));
  const removedPaths = [...baselinePaths.keys()].filter((path) => !currentPaths.has(path));
  const pathShareChanges = [...new Set([...baselinePaths.keys(), ...currentPaths.keys()])]
    .map((signature) => {
      const baselineShare = baselinePaths.get(signature)?.shareOfSuccessfulRuns ?? 0;
      const currentShare = currentPaths.get(signature)?.shareOfSuccessfulRuns ?? 0;
      return {
        signature,
        baselineShare,
        currentShare,
        delta: currentShare - baselineShare,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const signals: DriftSignal[] = [];
  for (const item of metrics) {
    const change = item.percentDelta;
    if (item.direction === "regressed" && change !== null && Math.abs(change) >= 0.1) {
      const severity = Math.abs(change) >= 0.25 ? "high" : "medium";
      signals.push({
        id: `metric-${item.name}`,
        severity,
        kind: item.name.includes("latency")
          ? "latency"
          : item.name.includes("success")
            ? "success"
            : "cost",
        title: `${item.name} regressed by ${(Math.abs(change) * 100).toFixed(1)}%`,
        detail: `Baseline ${item.baseline}; current ${item.current}.`,
      });
    }
  }

  for (const change of pathShareChanges.filter((item) => Math.abs(item.delta) >= 0.1).slice(0, 5)) {
    signals.push({
      id: `path-${change.signature}`,
      severity: Math.abs(change.delta) >= 0.25 ? "high" : "medium",
      kind: "path",
      title: `Path share changed by ${(change.delta * 100).toFixed(1)} points`,
      detail: change.signature,
    });
  }

  const baselineNodes = new Map(baseline.nodes.map((node) => [node.name, node]));
  for (const node of current.nodes) {
    const previous = baselineNodes.get(node.name);
    if (!previous || previous.averageSeconds <= 0) continue;
    const latencyDelta = node.averageSeconds / previous.averageSeconds - 1;
    if (latencyDelta >= 0.2) {
      signals.push({
        id: `node-${node.name}`,
        severity: latencyDelta >= 0.5 ? "high" : "medium",
        kind: "node",
        title: `${node.name} average latency increased ${(latencyDelta * 100).toFixed(1)}%`,
        detail: `${previous.averageSeconds.toFixed(3)}s → ${node.averageSeconds.toFixed(3)}s per call.`,
      });
    }
  }

  if (current.dataQuality.costCoverage + 0.2 < baseline.dataQuality.costCoverage) {
    signals.push({
      id: "coverage-cost",
      severity: "medium",
      kind: "coverage",
      title: "Cost evidence coverage dropped",
      detail: `${(baseline.dataQuality.costCoverage * 100).toFixed(1)}% → ${(current.dataQuality.costCoverage * 100).toFixed(1)}%.`,
    });
  }

  return {
    metrics,
    signals: signals.sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return rank[b.severity] - rank[a.severity];
    }),
    newPaths,
    removedPaths,
    pathShareChanges,
  };
}
