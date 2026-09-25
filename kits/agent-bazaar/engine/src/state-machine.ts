export type BountyStatus =
  | { status: "draft" }
  | { status: "open"; bids: Bid[]; closeAt: number }
  | { status: "awarded"; bidId: string }
  | { status: "in_escrow"; escrowId: string; lockRef: string }
  | { status: "delivered"; deliveryId: string; attempt: 1 | 2 | 3 }
  | { status: "qa_pass"; verdict: QAVerdict }
  | { status: "qa_fail"; verdict: QAVerdict; revisionOf: number }
  | { status: "settled"; receiptId: string }
  | { status: "refunded"; reason: string };

export type Transition =
  | "post"
  | "award"
  | "lock_escrow"
  | "deliver"
  | "qa_pass"
  | "qa_fail"
  | "revise"
  | "settle"
  | "refund"
  | "expire";

export interface Bid {
  id: string;
  agent_id: string;
  price: number;
  eta_hours: number;
  pitch: string;
  capability: string;
  reputation: number;
  balance: number;
}

export interface QAVerdict {
  score: number;
  verdict: "pass" | "fail";
  rationale: string;
  rubric_hash: string;
}

const VALID_TRANSITIONS: Record<string, Transition[]> = {
  draft: ["post"],
  open: ["award", "expire"],
  awarded: ["lock_escrow"],
  in_escrow: ["deliver", "refund"],
  delivered: ["qa_pass", "qa_fail"],
  qa_pass: ["settle"],
  qa_fail: ["revise", "refund"],
  settled: [],
  refunded: [],
};

/** Check whether a state-machine transition is legal. */
export function canTransition(from: string, transition: Transition): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(transition);
}

/** Apply a validated bounty state transition. */
export function transition(
  state: BountyStatus,
  t: Transition,
  payload: Record<string, unknown>,
): BountyStatus {
  if (!canTransition(state.status, t)) {
    throw new Error(`Illegal transition: ${state.status} → ${t}`);
  }

  switch (t) {
    case "post":
      return { status: "open", bids: [], closeAt: Date.now() + 86400_000 };
    case "award":
      return { status: "awarded", bidId: payload.bidId as string };
    case "lock_escrow":
      return {
        status: "in_escrow",
        escrowId: payload.escrowId as string,
        lockRef: payload.lockRef as string,
      };
    case "deliver":
      return {
        status: "delivered",
        deliveryId: payload.deliveryId as string,
        attempt: (payload.attempt as number) as 1 | 2 | 3,
      };
    case "qa_pass":
      return { status: "qa_pass", verdict: payload.verdict as QAVerdict };
    case "qa_fail":
      return {
        status: "qa_fail",
        verdict: payload.verdict as QAVerdict,
        revisionOf: payload.revisionOf as number,
      };
    case "settle":
      return { status: "settled", receiptId: payload.receiptId as string };
    case "refund":
      return { status: "refunded", reason: payload.reason as string };
    case "expire":
      return { status: "refunded", reason: "no_bids" };
    case "revise": {
      const qaFail = state as { status: "qa_fail"; revisionOf: number };
      if (qaFail.revisionOf >= 3) {
        throw new Error('Cannot revise: max attempts (3) exceeded. Use "refund" instead.');
      }
      return {
        status: "delivered",
        deliveryId: payload.deliveryId as string,
        attempt: (qaFail.revisionOf + 1) as 1 | 2 | 3,
      };
    }
  }
}
