import { describe, it, expect } from "vitest";
import {
  canTransition,
  transition,
  type BountyStatus,
} from "../src/state-machine.js";

describe("State Machine", () => {
  it("allows legal transitions: draft → open → awarded → in_escrow → delivered → qa_pass → settled", () => {
    let state: BountyStatus = { status: "draft" };
    expect(canTransition("draft", "post")).toBe(true);
    state = transition(state, "post", {});
    expect(state.status).toBe("open");

    expect(canTransition("open", "award")).toBe(true);
    state = transition(state, "award", { bidId: "bid-1" });
    expect(state.status).toBe("awarded");

    expect(canTransition("awarded", "lock_escrow")).toBe(true);
    state = transition(state, "lock_escrow", { escrowId: "esc-1", lockRef: "lock-1" });
    expect(state.status).toBe("in_escrow");

    expect(canTransition("in_escrow", "deliver")).toBe(true);
    state = transition(state, "deliver", { deliveryId: "del-1", attempt: 1 });
    expect(state.status).toBe("delivered");

    expect(canTransition("delivered", "qa_pass")).toBe(true);
    state = transition(state, "qa_pass", {
      verdict: { score: 0.85, verdict: "pass", rationale: "good", rubric_hash: "h" },
    });
    expect(state.status).toBe("qa_pass");

    expect(canTransition("qa_pass", "settle")).toBe(true);
    state = transition(state, "settle", { receiptId: "rec-1" });
    expect(state.status).toBe("settled");
  });

  it("rejects illegal transitions: draft → settled should throw", () => {
    const state: BountyStatus = { status: "draft" };
    expect(canTransition("draft", "settle")).toBe(false);
    expect(() => transition(state, "settle", {})).toThrow("Illegal transition");
  });

  it("expire transition from open with no bids goes to refunded:no_bids", () => {
    const open: BountyStatus = { status: "open", bids: [], closeAt: 0 };
    expect(canTransition("open", "expire")).toBe(true);
    const expired = transition(open, "expire", {});
    expect(expired.status).toBe("refunded");
    if (expired.status === "refunded") {
      expect(expired.reason).toBe("no_bids");
    }
  });

  it("enforces revise limit: delivered (attempt 3) + qa_fail → both revise and refund legal", () => {
    const delivered: BountyStatus = {
      status: "delivered",
      deliveryId: "d1",
      attempt: 3,
    };
    expect(canTransition("delivered", "qa_fail")).toBe(true);
    const qaFail = transition(delivered, "qa_fail", {
      verdict: { score: 0.3, verdict: "fail", rationale: "poor", rubric_hash: "abc" },
      revisionOf: 3,
    });
    expect(qaFail.status).toBe("qa_fail");
    expect(canTransition("qa_fail", "revise")).toBe(true);
    expect(canTransition("qa_fail", "refund")).toBe(true);
  });

  it("supports idempotent settled state: no transitions out", () => {
    const settled: BountyStatus = { status: "settled", receiptId: "r1" };
    expect(canTransition("settled", "settle")).toBe(false);
    expect(canTransition("settled", "refund")).toBe(false);
    expect(canTransition("settled", "post")).toBe(false);
  });
});
