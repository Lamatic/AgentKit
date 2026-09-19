// Per-instance ledger of ESTIMATED spend (see priceTable.ts) for the
// runaway guard. Not accounting-grade billing — a kill switch for runaway
// call volume within one client instance.

export class CostTracker {
  private spentUsd = 0;

  constructor(private maxEstimatedUsd: number) {
    if (maxEstimatedUsd < 0) throw new Error("maxEstimatedUsd must be >= 0");
  }

  canAfford(estimatedCallCostUsd: number): boolean {
    return this.spentUsd + estimatedCallCostUsd <= this.maxEstimatedUsd;
  }

  record(estimatedCallCostUsd: number): void {
    this.spentUsd += estimatedCallCostUsd;
  }

  remaining(): number {
    return this.maxEstimatedUsd - this.spentUsd;
  }

  spent(): number {
    return this.spentUsd;
  }
}
