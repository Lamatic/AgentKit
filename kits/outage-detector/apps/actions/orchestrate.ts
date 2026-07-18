"use server";

import { submitTicket, TicketPayload, FlowResult } from "@/lib/lamatic-client";
import lamaticConfig from "../../lamatic.config";

export async function processTicket(ticket: TicketPayload): Promise<FlowResult> {
  try {
    const step = lamaticConfig.steps.find((s) => s.id === "outage-detector");
    const workflowEnvKey = step?.envKey ?? "OUTAGE_DETECTOR";
    const workflowId = process.env[workflowEnvKey];

    if (!workflowId) {
      throw new Error(
        `Workflow ID environment variable "${workflowEnvKey}" is not set. Please add it to your .env.local file.`
      );
    }

    return await submitTicket(ticket, workflowId);
  } catch (err) {
    console.error("Flow execution failed:", err);
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
