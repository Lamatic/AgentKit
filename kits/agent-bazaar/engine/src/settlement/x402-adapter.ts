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
    const response = await fetch(`${X402_FACILITATOR}/lock`, {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${X402_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        escrowId,
        amount: amount.toString(),
        chain: "base-sepolia",
        token: "USDC",
        decimals: USDC_DECIMALS,
      }),
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
    if (escrow.status === "settled") {
      throw new Error(`Escrow ${escrowId} already settled`);
    }
    if (escrow.status === "refunded") {
      throw new Error(`Escrow ${escrowId} already refunded`);
    }

    // Atomically claim the escrow before paying out.
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

    const response = await fetch(`${X402_FACILITATOR}/settle`, {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${X402_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        escrowId,
        to,
        chain: "base-sepolia",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`x402 settle failed: ${text}`);
    }

    const data = await response.json() as { amount: string; txHash?: string };
    const grossAmount = BigInt(data.amount);
    const feeAmount = (grossAmount * 10n) / 100n;
    const netAmount = grossAmount - feeAmount;

    const bountyId = escrow.bounty_id;
    const fromAgent = await lookupPoster(bountyId);

    const receipt: SettlementReceipt = {
      receiptId: crypto.randomUUID(),
      escrowId,
      txHash: data.txHash || null,
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
      gross_amount: Number(receipt.grossAmount),
      fee_amount: Number(receipt.feeAmount),
      net_amount: Number(receipt.netAmount),
      tx_hash: receipt.txHash,
      adapter: receipt.adapter,
    });
    if (receiptError) throw new Error(`Receipt insert failed: ${receiptError.message}`);

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
    if (escrow.status === "settled") {
      throw new Error(`Escrow ${escrowId} already settled`);
    }
    if (escrow.status === "refunded") {
      throw new Error(`Escrow ${escrowId} already refunded`);
    }

    // Atomically claim the escrow before refunding.
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

    const response = await fetch(`${X402_FACILITATOR}/refund`, {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${X402_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        escrowId,
        to,
        chain: "base-sepolia",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`x402 refund failed: ${text}`);
    }

    const data = await response.json() as { amount: string; txHash?: string };
    const grossAmount = BigInt(data.amount);

    const bountyId = escrow.bounty_id;
    const fromAgent = await lookupPoster(bountyId);

    const receipt: SettlementReceipt = {
      receiptId: crypto.randomUUID(),
      escrowId,
      txHash: data.txHash || null,
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
      gross_amount: Number(receipt.grossAmount),
      fee_amount: Number(receipt.feeAmount),
      net_amount: Number(receipt.netAmount),
      tx_hash: receipt.txHash,
      adapter: receipt.adapter,
    });
    if (receiptError) throw new Error(`Receipt insert failed: ${receiptError.message}`);

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