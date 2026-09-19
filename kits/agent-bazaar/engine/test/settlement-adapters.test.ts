import { describe, it, expect, vi, beforeEach } from "vitest";
import { LedgerAdapter } from "../src/settlement/ledger-adapter.js";
import { X402Adapter } from "../src/settlement/x402-adapter.js";

const { mockState, mockFrom } = vi.hoisted(() => {
  const state = {
    escrowStatus: "locked" as string,
    escrowData: { amount: 1000, bounty_id: "bounty-001", bid_id: "bid-001" },
  };

  const from = vi.fn((table: string) => {
    const getEscrow = () => ({
      ...state.escrowData,
      status: state.escrowStatus,
    });

    const escrowSelectEq = vi.fn().mockReturnValue({
      single: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: getEscrow(), error: null }),
      ),
      maybeSingle: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: getEscrow(), error: null }),
      ),
    });

    if (table === "escrows") {
      return {
        select: vi.fn().mockReturnValue({ eq: escrowSelectEq }),
        insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        update: vi.fn().mockImplementation((changes: Record<string, unknown>) => ({
          eq: vi.fn().mockImplementation(() => {
            if (typeof changes.status === "string") {
              state.escrowStatus = changes.status;
            }
            return Promise.resolve({ data: {}, error: null });
          }),
        })),
        eq: escrowSelectEq,
        single: vi.fn().mockImplementation(() =>
          Promise.resolve({ data: getEscrow(), error: null }),
        ),
        maybeSingle: vi.fn().mockImplementation(() =>
          Promise.resolve({ data: getEscrow(), error: null }),
        ),
      };
    }

    if (table === "credit_ledger") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      };
    }

    if (table === "bounties") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { posted_by: "agent-client-1" },
              error: null,
            }),
          }),
        }),
      };
    }

    return {
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
  });

  return { mockState: state, mockFrom: from };
});

vi.mock("../src/supabase.js", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("../src/scripts/uuid.js", () => ({
  deterministicUUID: vi.fn((s: string) => `uuid-${s}`),
}));

describe("Settlement Adapters", () => {
  beforeEach(() => {
    mockState.escrowStatus = "locked";
    vi.clearAllMocks();
  });

  describe("LedgerAdapter", () => {
    it("quote fee math: 10% of gross", async () => {
      const adapter = new LedgerAdapter();
      const quote = await adapter.quote(1000n);
      expect(quote.fee).toBe(100n);
      expect(quote.total).toBe(1000n);
    });

    it("settle produces receipt with correct amounts", async () => {
      const adapter = new LedgerAdapter();
      const receipt = await adapter.settle("escrow-001", "agent-worker-1");
      expect(receipt.adapter).toBe("ledger");
      expect(receipt.txHash).toBeNull();
      expect(receipt.grossAmount).toBe(1000n);
      expect(receipt.feeAmount).toBe(100n);
      expect(receipt.netAmount).toBe(900n);
    });

    it("double-settle throws", async () => {
      const adapter = new LedgerAdapter();
      await adapter.settle("escrow-001", "agent-worker-1");
      await expect(adapter.settle("escrow-001", "agent-worker-1")).rejects.toThrow(
        "already settled",
      );
    });
  });

  describe("X402Adapter", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    it("settle produces receipt with tx hash", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ txHash: "0xabc123", amount: "1000000" }),
      } as Response);

      const adapter = new X402Adapter();
      const receipt = await adapter.settle("escrow-001", "agent-worker-1");
      expect(receipt.adapter).toBe("x402");
      expect(receipt.txHash).toBe("0xabc123");
    });

    it("double-settle throws", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ txHash: "0xabc123", amount: "1000000" }),
      } as Response);

      const adapter = new X402Adapter();
      await adapter.settle("escrow-001", "agent-worker-1");
      await expect(adapter.settle("escrow-001", "agent-worker-1")).rejects.toThrow(
        "already settled",
      );
    });
  });
});
