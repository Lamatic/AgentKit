"use server";

import { submitTicket, TicketPayload, FlowResult } from "@/lib/lamatic-client";

export async function processTicket(ticket: TicketPayload): Promise<FlowResult> {
  try {
    return await submitTicket(ticket);
  } catch (err) {
    console.error("Flow execution failed:", err);
    // Fallback shape mirrors the real "Else" branch shape so the UI doesn't
    // need a separate error-state renderer — surfaced via `reasoning`.
    return {
      status: "Else",
      confidence: 0,
      matched_ticket_ids: [],
      suspected_component: "unknown",
      reasoning:
        "Flow call failed — check OUTAGE_DETECTOR, LAMATIC_API_KEY, LAMATIC_PROJECT_ID, and LAMATIC_API_URL in .env.local",
      internal_note: "",
      customer_message: "",
    };
  }
}
