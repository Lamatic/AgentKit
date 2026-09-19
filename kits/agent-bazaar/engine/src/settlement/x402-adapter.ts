import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { supabase } from "../supabase.js";
import type { SettlementAdapter, Quote, LockRef, SettlementReceipt } from "./types.js";

/** Validate and normalize the x402 facilitator URL. */
function resolveFacilitatorUrl(): string {
  const raw = (process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator").trim();
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`[x402] Invalid X402_FACILITATOR_URL: ${raw}`);
  }
  const isLocal =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";
  if (parsed.protocol !== "https:" && !isLocal) {
    throw new Error(`[x402] X402_FACILITATOR_URL must use https: ${raw}`);
  }
  return raw.replace(/\/$/, "");
}

const X402_FACILITATOR = resolveFacilitatorUrl();
const X402_PRIVATE_KEY = process.env.X402_PRIVATE_KEY || "";
const USDC_DECIMALS = 6;
const X402_TIMEOUT_MS = Number(process.env.X402_TIMEOUT_MS || "15000");

/** Facilitator timeout: the payout may or may not have executed server-side. */
class FacilitatorTimeoutError extends Error {
  constructor(op: string) {
    super(`x402 ${op} timed out after ${X402_TIMEOUT_MS}ms`);
    this.name = "FacilitatorTimeoutError";
  }
}

/** POST to the facilitator with a bounded timeout. */
async function facilitatorPost(op: string, body: Record<string, unknown>): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${X402_FACILITATOR}/${op}`, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(X402_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${X402_PRIVATE_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new FacilitatorTimeoutError(op);
    }
    throw err;
  }
  return response;
}

/**
 * Reconcile re-entry on an already-claimed escrow: a present receipt means the
 * payout completed (safe to report as done), while a missing receipt means a
 * payout may be in flight — refuse to retry and require manual reconciliation.
 * Never returns; always throws.
 */
async function reconcileEntry(escrowId: string, status: string, op: string): Promise<never> {
  const { data: receipt } = await supabase
    .from("settlement_receipts")
    .select("id")
    .eq("escrow_id", escrowId)
    .maybeSingle();
  if (!receipt) {
    throw new Error(
      `Escrow ${escrowId} is ${status} with no receipt — a ${op} payout may be in flight; manual reconciliation required, refusing to retry`,
    );
  }
  throw new Error(`Escrow ${escrowId} already ${status}`);
}

/** Release an escrow claim so a retry can process it again. */
async function releaseClaim(escrowId: string): Promise<void> {
  await supabase
    .from("escrows")
    .update({ status: "locked", settled_at: null })
    .eq("id", escrowId);
}

interface LockExtra {
  bountyId?: string;
  bidId?: string;
}

export class X402Adapter implements SettlementAdapter {
  private client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  /** Quote settlement amount and platform fee. */
  async quote(amount: bigint): Promise<Quote> {
    const fee = (amount * 10n) / 100n;
    return { amount, fee, total: amount + fee, currency: "USDC" };
  }

  /** Lock escrow funds for a bounty. */
  async lock(escrowId: string, amount: bigint, extra?: LockExtra): Promise<LockRef> {
    const response = await facilitatorPost("lock", {
      escrowId,
      amount: amount.toString(),
      chain: "base-sepolia",
      token: "USDC",
      decimals: USDC_DECIMALS,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`x402 lock failed: ${text}`);
    }

    const data = await response.json() as { lockId: string };
    return {
      escrowId,
      lockId: data.lockId,
      amount,
      lockedAt: Date.now(),
    };
  }

  /** Atomically settle a locked escrow to the worker. */
  async settle(escrowId: string, to: string): Promise<SettlementReceipt> {
    const { data: escrow } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .maybeSingle();

    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);
    if (!escrow.bounty_id) throw new Error(`Escrow ${escrowId} has no bounty — refusing to settle`);
    if (escrow.status === "settled" || escrow.status === "refunded") {
      await reconcileEntry(escrowId, escrow.status, "settle");
    }

    // Atomically claim the escrow before paying out. The claim is the durable
    // pending-operation record (the status CHECK only allows
    // locked/settled/refunded, so no finer-grained pending state exists):
    // claimed + no receipt means a payout may be in flight — see
    // reconcileEntry above, which runs on later rounds before any retry.
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

    // Release the claim only when failure is confirmed to have happened before
    // the payout executed; otherwise preserve it for manual reconciliation so
    // a retry can never pay twice.
    let response: Response;
    try {
      response = await facilitatorPost("settle", {
        escrowId,
        to,
        chain: "base-sepolia",
      });
    } catch (err) {
      if (err instanceof FacilitatorTimeoutError) {
        console.error(
          `[x402] settle timed out for escrow ${escrowId}: payout may have executed — manual reconciliation required`,
        );
        throw err;
      }
      // Connection-level failure: confirmed nothing executed — safe to retry.
      await releaseClaim(escrowId);
      throw err;
    }

    if (!response.ok) {
      // Explicit facilitator rejection: confirmed no payout — safe to retry.
      const text = await response.text();
      await releaseClaim(escrowId);
      throw new Error(`x402 settle failed: ${text}`);
    }

    // Validate the facilitator body before receipt creation: read as text so
    // a malformed payload is preserved (bounded) for manual reconciliation.
    const settleBody = await response.text();
    let settleData: { amount?: unknown; txHash?: unknown };
    try {
      settleData = JSON.parse(settleBody) as { amount?: unknown; txHash?: unknown };
    } catch {
      console.error(`[x402] settle invalid facilitator JSON for escrow ${escrowId}: ${settleBody.slice(0, 500)} — manual reconciliation required`);
      throw new Error(`x402 settle failed: invalid facilitator response`);
    }
    // A facilitator that only confirms transfer may omit the amount: derive
    // it from the locked escrow instead of failing the settlement.
    let grossAmount: bigint;
    try {
      grossAmount = settleData.amount != null ? BigInt(String(settleData.amount)) : BigInt(escrow.amount);
    } catch {
      console.error(`[x402] settle invalid facilitator amount for escrow ${escrowId}: ${settleBody.slice(0, 500)} — manual reconciliation required`);
      throw new Error(`x402 settle failed: invalid facilitator amount`);
    }
    const feeAmount = (grossAmount * 10n) / 100n;
    const netAmount = grossAmount - feeAmount;

    const bountyId = escrow.bounty_id;
    const fromAgent = await lookupPoster(bountyId);

    const receipt: SettlementReceipt = {
      receiptId: crypto.randomUUID(),
      escrowId,
      txHash: typeof settleData.txHash === "string" ? settleData.txHash : null,
      fromAgent,
      toAgent: to,
      grossAmount,
      feeAmount,
      netAmount,
      adapter: "x402",
      settledAt: Date.now(),
      source: "live",
    };

    const { error: receiptError } = await supabase.from("settlement_receipts").insert({
      id: receipt.receiptId,
      bounty_id: bountyId,
      escrow_id: receipt.escrowId,
      from_agent: receipt.fromAgent,
      to_agent: receipt.toAgent,
        gross_amount: receipt.grossAmount.toString(),
        fee_amount: receipt.feeAmount.toString(),
        net_amount: receipt.netAmount.toString(),
      tx_hash: receipt.txHash,
      adapter: receipt.adapter,
    });
    if (receiptError) {
      // The payout already executed — releasing the claim would let a retry
      // pay twice. Preserve for manual reconciliation.
      console.error(
        `[x402] settle receipt insert failed for escrow ${escrowId} (tx ${receipt.txHash ?? "unknown"}): payout executed — manual reconciliation required`,
      );
      throw new Error(`Receipt insert failed: ${receiptError.message}`);
    }

    return receipt;
  }

  /** Atomically refund a locked escrow to the poster. */
  async refund(escrowId: string, to: string): Promise<SettlementReceipt> {
    const { data: escrow } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .maybeSingle();

    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);
    if (!escrow.bounty_id) throw new Error(`Escrow ${escrowId} has no bounty — refusing to refund`);
    if (escrow.status === "settled" || escrow.status === "refunded") {
      await reconcileEntry(escrowId, escrow.status, "refund");
    }

    // Atomically claim the escrow before refunding (claim is the durable
    // pending-operation record — see settle).
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

    // Same release-only-on-confirmed-pre-payout-failure contract as settle.
    let response: Response;
    try {
      response = await facilitatorPost("refund", {
        escrowId,
        to,
        chain: "base-sepolia",
      });
    } catch (err) {
      if (err instanceof FacilitatorTimeoutError) {
        console.error(
          `[x402] refund timed out for escrow ${escrowId}: payout may have executed — manual reconciliation required`,
        );
        throw err;
      }
      await releaseClaim(escrowId);
      throw err;
    }

    if (!response.ok) {
      const text = await response.text();
      await releaseClaim(escrowId);
      throw new Error(`x402 refund failed: ${text}`);
    }

    // Validate the facilitator body before receipt creation (see settle).
    const refundBody = await response.text();
    let refundData: { amount?: unknown; txHash?: unknown };
    try {
      refundData = JSON.parse(refundBody) as { amount?: unknown; txHash?: unknown };
    } catch {
      console.error(`[x402] refund invalid facilitator JSON for escrow ${escrowId}: ${refundBody.slice(0, 500)} — manual reconciliation required`);
      throw new Error(`x402 refund failed: invalid facilitator response`);
    }
    let refundGross: bigint;
    try {
      refundGross = refundData.amount != null ? BigInt(String(refundData.amount)) : BigInt(escrow.amount);
    } catch {
      console.error(`[x402] refund invalid facilitator amount for escrow ${escrowId}: ${refundBody.slice(0, 500)} — manual reconciliation required`);
      throw new Error(`x402 refund failed: invalid facilitator amount`);
    }
    const grossAmount = refundGross;

    const bountyId = escrow.bounty_id;
    const fromAgent = await lookupPoster(bountyId);

    const receipt: SettlementReceipt = {
      receiptId: crypto.randomUUID(),
      escrowId,
      txHash: typeof refundData.txHash === "string" ? refundData.txHash : null,
      fromAgent,
      toAgent: to,
      grossAmount,
      feeAmount: 0n,
      netAmount: grossAmount,
      adapter: "x402",
      settledAt: Date.now(),
      source: "live",
    };

    const { error: receiptError } = await supabase.from("settlement_receipts").insert({
      id: receipt.receiptId,
      bounty_id: bountyId,
      escrow_id: receipt.escrowId,
      from_agent: receipt.fromAgent,
      to_agent: receipt.toAgent,
        gross_amount: receipt.grossAmount.toString(),
        fee_amount: receipt.feeAmount.toString(),
        net_amount: receipt.netAmount.toString(),
      tx_hash: receipt.txHash,
      adapter: receipt.adapter,
    });
    if (receiptError) {
      console.error(
        `[x402] refund receipt insert failed for escrow ${escrowId} (tx ${receipt.txHash ?? "unknown"}): payout executed — manual reconciliation required`,
      );
      throw new Error(`Receipt insert failed: ${receiptError.message}`);
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