import { Lamatic } from "lamatic";
import lamaticConfig from "../../lamatic.config";

// Server-side only. Do not import this into client components —
// it uses the API key, which must never reach the browser.

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "All API credentials must be set in environment variables. Please add them to your .env.local file."
  );
}

const outageDetectorStep = lamaticConfig.steps.find((s) => s.id === "outage-detector");
const workflowEnvKey = outageDetectorStep?.envKey ?? "OUTAGE_DETECTOR";

if (!process.env[workflowEnvKey]) {
  throw new Error(
    `Workflow ID environment variable "${workflowEnvKey}" is not set. Please add it to your .env.local file.`
  );
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL,
  projectId: process.env.LAMATIC_PROJECT_ID,
  apiKey: process.env.LAMATIC_API_KEY,
});

export const OUTAGE_DETECTOR_WORKFLOW_ID = process.env[workflowEnvKey]!;

// Matches triggerNode_1's advance_schema in flows/outage-detector.ts exactly.
export type TicketPayload = {
  ticket_id: string;
  account_id: string;
  account_name: string;
  account_tier: string;
  created_at: string;
  subject: string;
  body: string;
};

// Matches responseNode_triggerNode_1's outputMapping exactly.
// internal_note / customer_message are only populated on the "Condition 1"
// branch — legitimately empty strings on "Else", not a bug.
export type FlowResult = {
  status: "Condition 1" | "Else";
  confidence: number;
  matched_ticket_ids: string[];
  suspected_component: string;
  reasoning: string;
  internal_note: string;
  customer_message: string;
};

export async function submitTicket(ticket: TicketPayload): Promise<FlowResult> {
  const response = await lamaticClient.executeFlow(OUTAGE_DETECTOR_WORKFLOW_ID, ticket);
  return (response?.result ?? response) as FlowResult;
}
