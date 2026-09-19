import { supabase } from "../supabase.js";
import type { SettlementAdapter, Quote, LockRef, SettlementReceipt } from "./types.js";

interface LockExtra {
  bountyId?: string;
  bidId?: string;
}

/** Fetch the latest ledger balance for an agent. */
async function lastBalance(agentId: string): Promise<number> {
  const { data } = await supabase
    .from("credit_ledger")
    .select("balance_after")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? Number(data.balance_after) : 0;
}

/** Append a credit-ledger entry with a best-effort running balance. */
export async function appendLedger(
  agentId: string,
  amount: number,
  reason: string,
  refId: string | undefined,
): Promise<void> {
  // NOTE: read-then-insert is a best-effort running balance for this demo kit.
  // For production, compute balance_after atomically in the database (RPC).
  const balance = await lastBalance(agentId);
  const { error } = await supabase.from("credit_ledger").insert({
    agent_id: agentId,
    amount,
    balance_after: balance + amount,
    reason,
    ref_id: refId,
    source: "live",
  });
  if (error) throw new Error(`Ledger append failed: ${error.message}`);
}

export class LedgerAdapter implements SettlementAdapter {
  async quote(amount: bigint): Promise<Quote> {
    const fee = (amount * 10n) / 100n;
    return { amount, fee, total: amount, currency: "credits" };
  }

  /** Lock escrow funds for a bounty. */
  async lock(escrowId: string, amount: bigint, extra?: LockExtra): Promise<LockRef> {
    const { data: existing } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("escrows").insert({
        id: escrowId,
        bounty_id: extra?.bountyId,
        bid_id: extra?.bidId,
        amount: Number(amount),
        lock_ref: `ledger-${escrowId}`,
        status: "locked",
      });
      if (error) throw new Error(`Escrow lock failed: ${error.message}`);
    }

    return {
      escrowId,
      lockId: `ledger-${escrowId}`,
      amount,
      lockedAt: Date.now(),
    };
  }

  /** Atomically settle a locked escrow to the worker. */
  async settle(escrowId: string, to: string): Promise<SettlementReceipt> {
    const { data: escrow, error: escrowError } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .maybeSingle();

    if (escrowError) throw new Error(`Escrow lookup failed: ${escrowError.message}`);
    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);
    if (!escrow.bounty_id) throw new Error(`Escrow ${escrowId} has no bounty — refusing to settle`);
    if (escrow.status === "settled") {
      throw new Error(`Escrow ${escrowId} already settled`);
    }
    if (escrow.status === "refunded") {
      throw new Error(`Escrow ${escrowId} already refunded`);
    }

    // Atomically claim the escrow: only one caller can flip locked -> settled.
    const { data: claimed, error: claimError } = await supabase
      .from("escrows")
      .update({ status: "settled", settled_at: new Date().toISOString() })
      .eq("id", escrowId)
      .eq("status", "locked")
      .select("id");
    if (claimError) throw new Error(`Escrow claim failed: ${claimError.message}`);
    if (!claimed || claimed.length === 0) {
      throw new Error(`Escrow ${escrowId} is no longer locked — already processed`);
    }

    const grossAmount = BigInt(escrow.amount);
    const feeAmount = (grossAmount * 10n) / 100n;
    const netAmount = grossAmount - feeAmount;

    const bountyId = escrow.bounty_id;
    const fromAgent = await lookupPoster(bountyId);

    const receipt: SettlementReceipt = {
      receiptId: crypto.randomUUID(),
      escrowId,
      txHash: null,
      fromAgent,
      toAgent: to,
      grossAmount,
      feeAmount,
      netAmount,
      adapter: "ledger",
      settledAt: Date.now(),
      source: "live",
    };

    const { error: receiptError } = await supabase.from("settlement_receipts").insert({
      id: receipt.receiptId,
      bounty_id: bountyId,
      escrow_id: receipt.escrowId,
      from_agent: receipt.fromAgent,
      to_agent: receipt.toAgent,
      gross_amount: Number(receipt.grossAmount),
      fee_amount: Number(receipt.feeAmount),
      net_amount: Number(receipt.netAmount),
      tx_hash: null,
      adapter: receipt.adapter,
    });
    if (receiptError) throw new Error(`Receipt insert failed: ${receiptError.message}`);

    await appendLedger(to, Number(netAmount), "settlement", bountyId);
    await appendLedger(fromAgent, -Number(feeAmount), "fee", bountyId);

    return receipt;
  }

  /** Atomically refund a locked escrow to the poster. */
  async refund(escrowId: string, to: string): Promise<SettlementReceipt> {
    const { data: escrow, error } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .maybeSingle();

    if (error) throw new Error(`Escrow lookup failed: ${error.message}`);
    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);
    if (!escrow.bounty_id) throw new Error(`Escrow ${escrowId} has no bounty — refusing to refund`);
    if (escrow.status === "settled") {
      throw new Error(`Escrow ${escrowId} already settled`);
    }
    if (escrow.status === "refunded") {
      throw new Error(`Escrow ${escrowId} already refunded`);
    }

    // Atomically claim the escrow: only one caller can flip locked -> refunded.
    const { data: claimed, error: claimError } = await supabase
      .from("escrows")
      .update({ status: "refunded", settled_at: new Date().toISOString() })
      .eq("id", escrowId)
      .eq("status", "locked")
      .select("id");
    if (claimError) throw new Error(`Escrow claim failed: ${claimError.message}`);
    if (!claimed || claimed.length === 0) {
      throw new Error(`Escrow ${escrowId} is no longer locked — already processed`);
    }

    const grossAmount = BigInt(escrow.amount);

    const bountyId = escrow.bounty_id;
    const fromAgent = await lookupPoster(bountyId);

    const receipt: SettlementReceipt = {
      receiptId: crypto.randomUUID(),
      escrowId,
      txHash: null,
      fromAgent,
      toAgent: to,
      grossAmount,
      feeAmount: 0n,
      netAmount: grossAmount,
      adapter: "ledger",
      settledAt: Date.now(),
      source: "live",
    };

    const { error: receiptError } = await supabase.from("settlement_receipts").insert({
      id: receipt.receiptId,
      bounty_id: bountyId,
      escrow_id: receipt.escrowId,
      from_agent: receipt.fromAgent,
      to_agent: receipt.toAgent,
      gross_amount: Number(receipt.grossAmount),
      fee_amount: Number(receipt.feeAmount),
      net_amount: Number(receipt.netAmount),
      tx_hash: null,
      adapter: receipt.adapter,
    });
    if (receiptError) throw new Error(`Receipt insert failed: ${receiptError.message}`);

    await appendLedger(to, Number(grossAmount), "refund", bountyId);

    return receipt;
  }
}

/** Look up the poster of a bounty. */
async function lookupPoster(bountyId: string | undefined): Promise<string> {
  if (!bountyId) return "";
  const { data } = await supabase
    .from("bounties")
    .select("posted_by")
    .eq("id", bountyId)
    .maybeSingle();
  return data?.posted_by || "";
}