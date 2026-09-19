import { supabase } from "../supabase.js";
import type { SettlementAdapter, Quote, LockRef, SettlementReceipt } from "./types.js";

interface LockExtra {
  bountyId?: string;
  bidId?: string;
}

/** Append a credit-ledger entry. balance_after is computed and inserted
 * atomically by the append_ledger database RPC (see 002 migration).
 * Amounts cross the TypeScript boundary as canonical decimal strings so
 * bigint values survive past Number.MAX_SAFE_INTEGER; PostgREST casts the
 * string to the RPC's bigint parameter. */
export async function appendLedger(
  agentId: string,
  amount: string,
  reason: string,
  refId: string | undefined,
): Promise<void> {
  if (!/^-?\d+$/.test(amount)) {
    throw new Error(`Ledger append failed: amount "${amount}" is not a canonical decimal integer`);
  }
  const { error } = await supabase.rpc("append_ledger", {
    p_agent_id: agentId,
    p_amount: amount,
    p_reason: reason,
    p_ref_id: refId ?? null,
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

    try {
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

      // The lock path already charged the poster the gross amount; the worker
      // takes net and the fee stays recorded on the receipt (no second poster
      // debit, no phantom platform account).
      await appendLedger(to, netAmount.toString(), "settlement", bountyId);
    } catch (err) {
      // Compensate: drop only this attempt's receipt (if it landed) and
      // release the claim so a retry reprocesses exactly once. Local payout
      // has no external side effects, so retry is always safe; the orchestrator
      // also releases the consumed idempotency key on failure.
      const { error: cleanupError } = await supabase
        .from("settlement_receipts")
        .delete()
        .eq("id", receipt.receiptId);
      const { error: releaseError } = await supabase
        .from("escrows")
        .update({ status: "locked", settled_at: null })
        .eq("id", escrowId);
      if (cleanupError || releaseError) {
        console.error(
          `[reconcile] settle compensation failed for escrow ${escrowId}: ` +
            `receipt cleanup ${cleanupError ? `failed (${cleanupError.message})` : "ok"}, ` +
            `escrow release ${releaseError ? `failed (${releaseError.message})` : "ok"} — manual reconciliation required`,
        );
      }
      throw err;
    }

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

    try {
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

      await appendLedger(to, grossAmount.toString(), "refund", bountyId);
    } catch (err) {
      // Compensate: drop only this attempt's receipt (if it landed) and
      // release the claim so a retry reprocesses exactly once (see settle).
      const { error: cleanupError } = await supabase
        .from("settlement_receipts")
        .delete()
        .eq("id", receipt.receiptId);
      const { error: releaseError } = await supabase
        .from("escrows")
        .update({ status: "locked", settled_at: null })
        .eq("id", escrowId);
      if (cleanupError || releaseError) {
        console.error(
          `[reconcile] refund compensation failed for escrow ${escrowId}: ` +
            `receipt cleanup ${cleanupError ? `failed (${cleanupError.message})` : "ok"}, ` +
            `escrow release ${releaseError ? `failed (${releaseError.message})` : "ok"} — manual reconciliation required`,
        );
      }
      throw err;
    }

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