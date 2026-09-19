export interface Quote {
  amount: bigint;
  fee: bigint;
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
  quote(amount: bigint): Promise<Quote>;
  lock(escrowId: string, amount: bigint, extra?: LockExtra): Promise<LockRef>;
  settle(escrowId: string, to: string): Promise<SettlementReceipt>;
  refund(escrowId: string, to: string): Promise<SettlementReceipt>;
}
