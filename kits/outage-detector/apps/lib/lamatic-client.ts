import { Lamatic } from "lamatic";

// Server-side only. Do not import this into client components —
// it uses the API key, which must never reach the browser.

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "All API credentials must be set in environment variables. Please add them to your .env.local file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
});

export type TicketPayload = {
  ticket_id: string;
  account_id: string;
  account_name: string;
  account_tier: string;
  created_at: string;
  subject: string;
  body: string;
};

export type FlowResult = {
  status: "Condition 1" | "Else";
  confidence: number;
  matched_ticket_ids: string[];
  suspected_component: string;
  reasoning: string;
  internal_note: string;
  customer_message: string;
};

export async function submitTicket(ticket: TicketPayload, workflowId: string): Promise<FlowResult> {
  if (!workflowId) {
    throw new Error("workflowId is required to submit a ticket.");
  }
  const response = await lamaticClient.executeFlow(workflowId, ticket);
  return (response?.result ?? response) as FlowResult;
}
