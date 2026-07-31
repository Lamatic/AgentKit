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

// Matches responseNode_triggerNode_1's outputMapping exactly, plus a client-side
// "Error" state (never returned by the flow itself) used when the flow call
// fails outright — see actions/orchestrate.ts. Keeping this distinct from
// "Else" matters: "Else" means the flow genuinely ran and found no
// correlation; "Error" means the flow never ran at all.
// internal_note / customer_message are only populated on the "Condition 1"
// branch — legitimately empty strings on "Else"/"Error", not a bug.
export type FlowResult = {
  status: "Condition 1" | "Else" | "Error";
  confidence: number;
  matched_ticket_ids: string[];
  suspected_component: string;
  reasoning: string;
  internal_note: string;
  customer_message: string;
};

// The only status values the real flow itself can ever return. "Error" is
// deliberately excluded here — it's a client-side-only state synthesized by
// orchestrate.ts's catch block, never something the flow response contains.
const FLOW_STATUSES = ["Condition 1", "Else"] as const;

export async function submitTicket(ticket: TicketPayload, workflowId: string): Promise<FlowResult> {
  if (!workflowId) {
    throw new Error("workflowId is required to submit a ticket.");
  }

  const response = await lamaticClient.executeFlow(workflowId, ticket);
  const raw = (response?.result ?? response) as unknown;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(
      `Malformed flow response: expected a JSON object, got ${Array.isArray(raw) ? "an array" : typeof raw}.`
    );
  }

  const rawRecord = raw as Record<string, unknown>;

  // The real flow response returns `status` wrapped in a single-element
  // array (e.g. ["Condition 1"], ["Else"]), not a plain string — this
  // normalizes it so the rest of the app can rely on FlowResult.status
  // being a plain string as declared.
  const rawStatus = rawRecord.status;
  const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;

  if (
    typeof status !== "string" ||
    status.length === 0 ||
    !(FLOW_STATUSES as readonly string[]).includes(status)
  ) {
    throw new Error(
      `Malformed flow response: unsupported status value ${JSON.stringify(
        status
      )}. Expected one of: ${FLOW_STATUSES.join(", ")}.`
    );
  }

  return { ...rawRecord, status } as FlowResult;
}
