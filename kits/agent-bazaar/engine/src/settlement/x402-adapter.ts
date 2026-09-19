import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { supabase } from "../supabase.js";
import type { SettlementAdapter, Quote, LockRef, SettlementReceipt } from "./types.js";

const X402_FACILITATOR = process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator";
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

  async quote(amount: bigint): Promise<Quote> {
    const fee = (amount * 10n) / 100n;
    return { amount, fee, total: amount + fee, currency: "USDC" };
  }

  async lock(escrowId: string, amount: bigint, extra?: LockExtra): Promise<LockRef> {
    const response = await fetch(`${X402_FACILITATOR}/lock`, {
      method: "POST",
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

  async settle(escrowId: string, to: string): Promise<SettlementReceipt> {
    const { data: escrow } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .maybeSingle();

    if (escrow && escrow.status === "settled") {
      throw new Error(`Escrow ${escrowId} already settled`);
    }
    if (escrow && escrow.status === "refunded") {
      throw new Error(`Escrow ${escrowId} already refunded`);
    }

    const response = await fetch(`${X402_FACILITATOR}/settle`, {
      method: "POST",
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

    const bountyId = escrow?.bounty_id;
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

    await supabase.from("settlement_receipts").insert({
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

    if (escrow) {
      await supabase
        .from("escrows")
        .update({ status: "settled", settled_at: new Date().toISOString() })
        .eq("id", escrowId);
    }

    return receipt;
  }

  async refund(escrowId: string, to: string): Promise<SettlementReceipt> {
    const { data: escrow } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .maybeSingle();

    if (escrow && escrow.status === "settled") {
      throw new Error(`Escrow ${escrowId} already settled`);
    }
    if (escrow && escrow.status === "refunded") {
      throw new Error(`Escrow ${escrowId} already refunded`);
    }

    const response = await fetch(`${X402_FACILITATOR}/refund`, {
      method: "POST",
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

    const bountyId = escrow?.bounty_id;
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

    await supabase.from("settlement_receipts").insert({
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

    if (escrow) {
      await supabase
        .from("escrows")
        .update({ status: "refunded", settled_at: new Date().toISOString() })
        .eq("id", escrowId);
    }

    return receipt;
  }
}

async function lookupPoster(bountyId: string | undefined): Promise<string> {
  if (!bountyId) return "";
  const { data } = await supabase
    .from("bounties")
    .select("posted_by")
    .eq("id", bountyId)
    .maybeSingle();
  return data?.posted_by || "";
}