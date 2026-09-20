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
 * string to the RPC's bigint parameter. opts lets seed flows preserve
 * their source/created_at metadata through the same atomic path. */
export async function appendLedger(
  agentId: string,
  amount: string,
  reason: string,
  refId: string | undefined,
  opts?: { source?: string; createdAt?: string },
): Promise<void> {
  if (!/^-?\d+$/.test(amount)) {
    throw new Error(`Ledger append failed: amount "${amount}" is not a canonical decimal integer`);
  }
  const { error } = await supabase.rpc("append_ledger", {
    p_agent_id: agentId,
    p_amount: amount,
    p_reason: reason,
    p_ref_id: refId ?? null,
    p_source: opts?.source ?? "live",
    p_created_at: opts?.createdAt ?? null,
  });
  if (error) {
    // A conflict on the (agent_id, reason, ref_id) identity means this exact
    // leg already applied — treat as a no-op without touching balances again.
    // Every other error (including unrelated 23505s) still throws.
    if (error.code === "23505" && error.message.includes("uq_credit_ledger_agent_reason_ref")) {
      return;
    }
    throw new Error(`Ledger append failed: ${error.message}`);
  }
}

/**
 * Reconcile a 23505 receipt conflict: a duplicate submission carries a fresh
 * random id, so the conflict is on escrow_id — meaning a receipt for this
 * escrow already exists. Return it only after confirming the matching ledger
 * leg actually landed; otherwise the conflict is someone else's partial state
 * and must surface as an error, never a blind return.
 */
async function reconcileReceipt(
  receipt: SettlementReceipt,
  reason: string,
  legAmount: bigint,
  bountyId: string,
): Promise<SettlementReceipt> {
  const { data: leg } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("agent_id", receipt.toAgent)
    .eq("reason", reason)
    .eq("ref_id", bountyId)
    .eq("amount", legAmount.toString())
    .limit(1)
    .maybeSingle();
  if (!leg) {
    throw new Error(
      `Receipt insert failed: duplicate receipt for escrow ${receipt.escrowId} with no matching ledger entry — manual reconciliation required`,
    );
  }
  const { data: existing, error } = await supabase
    .from("settlement_receipts")
    .select("*")
    .eq("escrow_id", receipt.escrowId)
    .maybeSingle();
  if (error || !existing) {
    throw new Error(
      `Receipt insert failed: duplicate receipt for escrow ${receipt.escrowId}, existing receipt unreadable — manual reconciliation required`,
    );
  }
  return {
    receiptId: existing.id,
    escrowId: receipt.escrowId,
    txHash: existing.tx_hash,
    fromAgent: existing.from_agent,
    toAgent: existing.to_agent,
    grossAmount: BigInt(existing.gross_amount),
    feeAmount: BigInt(existing.fee_amount),
    netAmount: BigInt(existing.net_amount),
    adapter: receipt.adapter,
    settledAt: new Date(existing.created_at).getTime(),
    source: "live",
  };
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
        amount: amount.toString(),
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
        gross_amount: receipt.grossAmount.toString(),
        fee_amount: receipt.feeAmount.toString(),
        net_amount: receipt.netAmount.toString(),
        tx_hash: null,
        adapter: receipt.adapter,
      });
      if (receiptError) {
        if (receiptError.code === "23505") {
          return reconcileReceipt(receipt, "settlement", netAmount, bountyId);
        }
        throw new Error(`Receipt insert failed: ${receiptError.message}`);
      }

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
        gross_amount: receipt.grossAmount.toString(),
        fee_amount: receipt.feeAmount.toString(),
        net_amount: receipt.netAmount.toString(),
        tx_hash: null,
        adapter: receipt.adapter,
      });
      if (receiptError) {
        if (receiptError.code === "23505") {
          return reconcileReceipt(receipt, "refund", grossAmount, bountyId);
        }
        throw new Error(`Receipt insert failed: ${receiptError.message}`);
      }

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