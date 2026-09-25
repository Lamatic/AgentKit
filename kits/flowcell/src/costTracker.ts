// Per-instance ledger of ESTIMATED spend (see priceTable.ts) for the
// runaway guard. Not accounting-grade billing — a kill switch for runaway
// call volume within one client instance.

export class CostTracker {
  private spentUsd = 0;

  /** Create a ledger with a per-instance estimated-spend ceiling. */
  constructor(private maxEstimatedUsd: number) {
    if (maxEstimatedUsd < 0) throw new Error("maxEstimatedUsd must be >= 0");
  }

  /** Whether one more call of the given estimated cost fits under the ceiling. */
  canAfford(estimatedCallCostUsd: number): boolean {
    return this.spentUsd + estimatedCallCostUsd <= this.maxEstimatedUsd;
  }

  /** Charge one attempt's estimated cost to the ledger. */
  record(estimatedCallCostUsd: number): void {
    this.spentUsd += estimatedCallCostUsd;
  }

  /** Estimated spend remaining under the ceiling. */
  remaining(): number {
    return this.maxEstimatedUsd - this.spentUsd;
  }

  /** Total estimated spend recorded so far. */
  spent(): number {
    return this.spentUsd;
  }
}
