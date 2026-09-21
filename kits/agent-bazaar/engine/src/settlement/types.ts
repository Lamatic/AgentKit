export interface Quote {
  amount: bigint;
  fee: bigint;
  /**
   * Gross amount charged/collected for the settlement, EXCLUDING the platform
   * fee (the fee is reported separately and never added to the total). Both
   * adapters honor this contract so callers get identical semantics.
   */
  total: bigint;
  currency: string;
}

export interface LockRef {
  escrowId: string;
  lockId: string;
  amount: bigint;
  lockedAt: number;
}

export interface SettlementReceipt {
  receiptId: string;
  escrowId: string;
  txHash: string | null;
  fromAgent: string;
  toAgent: string;
  grossAmount: bigint;
  feeAmount: bigint;
  netAmount: bigint;
  adapter: "ledger" | "x402";
  settledAt: number;
  source: "live" | "seed";
}

export interface LockExtra {
  bountyId?: string;
  bidId?: string;
}

export interface SettlementAdapter {
  /** Quote settlement amount and platform fee. */
  quote(amount: bigint): Promise<Quote>;
  /** Lock escrow funds for a bounty. */
  lock(escrowId: string, amount: bigint, extra?: LockExtra): Promise<LockRef>;
  /** Atomically settle a locked escrow to the worker. */
  settle(escrowId: string, to: string): Promise<SettlementReceipt>;
  /** Atomically refund a locked escrow to the poster. */
  refund(escrowId: string, to: string): Promise<SettlementReceipt>;
}
