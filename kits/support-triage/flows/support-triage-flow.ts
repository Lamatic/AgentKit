/*
 * # Support Triage
 * Analyzes an inbound customer support ticket to produce triage-ready insight for the wider support automation pipeline.
 *
 * ## Purpose
 * This flow is responsible for turning raw support ticket text into a form that can be acted on by a support team or calling application. Within the kit, it is the core triage entry point: the place where an unstructured customer message is first normalized into a support-processing context. The repository README states the intended outcomes as category detection, sentiment analysis, urgency assessment, and draft response generation, but the exported flow source currently exposes only the flow contract, metadata, and references rather than the internal execution graph.
 *
 * In operational terms, this flow exists to reduce manual reading and routing effort. A caller submits customer-written text, and the flow is expected to analyze that text so downstream support handling can prioritize the issue, understand the customer’s tone, and prepare an initial reply. That outcome matters because the broader agent system is designed around one-call triage: a support-facing UI or orchestration layer invokes this flow and expects a normalized result it can use for routing, escalation, and response drafting.
 *
 * In the wider chain described by the parent `agent.md`, this flow sits at the very front of the support workflow as the primary on-demand execution unit. It is not described as a downstream summarizer or a post-processing step; it is the main ticket-in, triage-out pipeline that external systems call directly. If the kit later grows into a multi-flow architecture, this flow would remain the intake and analysis stage that feeds routing, escalation, knowledge retrieval, or auto-resolution steps.
 *
 * ## When To Use
 * - Use when an application or operator has an inbound support ticket and needs it analyzed before assigning or replying.
 * - Use when the input is free-form customer complaint, request, or issue text that has not yet been normalized into support labels.
 * - Use when you need a single API call to perform the first-pass support triage task for a ticket.
 * - Use when a support UI, helpdesk bridge, form handler, or email ingestion process wants structured triage information from raw text.
 * - Use when the goal is to prepare the ticket for downstream routing, prioritization, escalation, or draft response generation.
 *
 * ## When Not To Use
 * - Do not use when there is no customer ticket text available; the only declared input is `ticket_text`, and it is required.
 * - Do not use when the payload is already fully triaged and no additional language analysis is needed.
 * - Do not use for non-support content such as general chat, analytics jobs, or knowledge-base retrieval; this flow is scoped to support ticket triage.
 * - Do not use if your workflow depends on guaranteed structured outputs such as `category`, `urgency`, or `draft_response` at integration time without first validating the deployed Lamatic flow, because the exported TypeScript source does not declare runtime nodes or response fields.
 * - Do not use if Lamatic project configuration or LLM provider access has not been set up; the kit README indicates Lamatic execution and a model provider are prerequisites.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `ticket_text` | `string` | Yes | The inbound customer ticket text. |
 *
 * The flow source declares a single required string input, `ticket_text`. No maximum length, schema wrapper, language restriction, or formatting rule is encoded in the source provided. Based on the kit intent, the value should be natural-language customer text containing enough issue detail for meaningful triage. Although the parent `agent.md` discusses a richer logical ticket shape with fields such as subject, body, sender, and metadata, those fields are not part of this exported flow contract and should not be assumed to be accepted unless the deployed Lamatic flow has been extended beyond this source.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | No statically declared response fields in source | Unknown | The provided flow source does not define output mappings, response schema, or terminal node fields. |
 *
 * The exact API response shape cannot be derived from the exported TypeScript because `nodes` and `edges` are both empty and no output contract is declared. From the README and parent `agent.md`, the intended runtime outcome is a structured triage package covering category, sentiment, urgency, and a draft email response. Treat that as design intent rather than a guaranteed schema. Any consumer integrating with this flow should inspect the deployed Lamatic flow run response and lock against the actual returned fields before relying on them in production.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is a standalone entry-point flow in the current kit design.
 * - No prerequisite Lamatic flow is described as needing to run before it.
 * - External callers are expected to provide the raw ticket content directly through `ticket_text`.
 *
 * ### Downstream Flows
 * - No downstream flows are explicitly defined in the provided source.
 * - The parent `agent.md` indicates that this flow’s results are intended to feed downstream handling such as queue assignment, escalation, and initial response workflows, but those are described as operational consumers rather than implemented sibling flows.
 * - If future flows are added, they would likely consume triage outputs such as support category, sentiment, urgency, and draft response content, but those fields are not formally declared in the current source.
 *
 * ### External Services
 * - Lamatic Studio Flow runtime — hosts and executes the flow — requires Lamatic project and flow configuration, typically surfaced through Lamatic API credentials.
 * - Gemini Free Tier — expected LLM provider for language understanding and generation according to the README — requires provider configuration in the deployed Lamatic project; specific variable names are not declared in the provided flow source.
 * - Constitution resource `@constitutions/default.md` — referenced governance or instruction document available to the flow at runtime — no standalone credential indicated.
 *
 * ### Environment Variables
 * - `NEXT_PUBLIC_LAMATIC_FLOW_ID` — identifies the deployed Lamatic flow for client-side invocation as described in the parent kit context — used by the external caller or included UI, not by any named node in the exported source.
 * - `LAMATIC_FLOW_ID` — identifies the deployed Lamatic flow for server-side invocation as described in the parent kit context — used by the external caller or server integration, not by any named node in the exported source.
 * - Lamatic API credential variables — required to authenticate local development and flow execution according to the README, but exact names are not present in the provided flow source, so they cannot be attributed to a specific node.
 * - Gemini provider credential variables — required if the deployed flow uses Gemini as noted in the README, but exact names are not present in the provided flow source, so they cannot be attributed to a specific node.
 *
 * ## Node Walkthrough
 * 1. `Support Triage` (flow trigger) receives the required `ticket_text` string from the caller. This is the only input formally defined in the source, so all analysis must originate from this field.
 * 2. No internal Lamatic nodes are available to document from the exported TypeScript. The `nodes` array is empty and the `edges` array is empty, which means the execution graph, prompt wiring, model configuration, variable mappings, and response construction are not recoverable from the source provided.
 * 3. A referenced constitution file, `@constitutions/default.md`, is attached at the flow level. While the exact consuming node is not visible, this indicates the deployed flow is expected to run under a default governance or instruction framework.
 * 4. Based on the README and parent `agent.md`, the deployed flow is intended to perform support-ticket analysis tasks such as categorization, sentiment assessment, urgency estimation, and draft-response generation before returning a result to the caller. Because no node definitions are present, these should be read as expected runtime behaviors rather than source-verifiable execution steps.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow invocation fails before analysis starts | Missing Lamatic configuration or invalid flow identifier | Verify `NEXT_PUBLIC_LAMATIC_FLOW_ID` or `LAMATIC_FLOW_ID` is set correctly in the calling application and that the referenced flow is deployed. |
 * | Authentication or execution errors from Lamatic | Required Lamatic API credentials are missing or invalid | Populate the local `.env.local` from `.env.example`, confirm credentials are valid, and retry. |
 * | Model call fails or rate-limit errors occur | Gemini Free Tier cooldown requirements not respected | Add request throttling or enforce at least the README’s noted 60-second cooldown between requests. |
 * | Response shape is missing expected fields such as category or urgency | The exported source does not define outputs, or the deployed flow differs from design intent | Inspect the live Lamatic run response, update integration code to match actual outputs, and verify the deployed flow graph in Lamatic Studio. |
 * | Flow produces no useful triage result | `ticket_text` is empty, too short, malformed, or lacks enough context | Validate that `ticket_text` is non-empty human-readable support content and includes enough detail about the issue. |
 * | Integration expects a richer ticket object | Caller is using the logical shape from `agent.md` instead of the actual flow input contract | Map incoming ticket data into the single required `ticket_text` field or update the flow contract to accept structured ticket fields. |
 * | Downstream automation cannot proceed because no upstream flow result exists | Orchestration assumed a prior normalization or enrichment step that does not exist in this kit | Treat this flow as the entry point and provide raw ticket text directly, or add a dedicated upstream preprocessing flow if needed. |
 *
 * ## Notes
 * - The provided TypeScript export contains metadata, input declarations, and a constitution reference, but no executable node graph. This strongly suggests the source is either a placeholder, an incomplete export, or a scaffold awaiting Lamatic Studio node definitions.
 * - Because node-level configuration is absent, any documentation of exact prompt behavior, conditional branches, model settings, or deterministic output fields would be speculative. Integrators should validate against the deployed Lamatic flow rather than this source alone.
 * - The README and parent `agent.md` describe a richer triage capability than the code proves. Treat those documents as product intent and this source as the authoritative contract for currently visible inputs.
 * - If this flow is used in production with Gemini Free Tier, design callers to tolerate latency and rate limiting. Burst execution without backoff is likely to fail.
 */

// Flow: support-triage-flow
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Support Triage",
  "description": "Analyzes customer sentiment and categorizes support tickets.",
  "version": "1.0.0"
};

// ── Inputs ────────────────────────────────────────────
// Deployer-configurable fields, keyed by node ID (matches deep-search pattern).
// This flow is a SCAFFOLD — `nodes` and `edges` are empty arrays awaiting a
// proper Studio export. Once nodes are added (LLMNode for triage, etc.), this
// object should declare each node's required `generativeModelName` etc.
//
// `ticket_text` is the trigger payload field (runtime arg), NOT a deployer
// input — it should live in the trigger node's `advance_schema` once the flow
// graph is exported.
export const inputs = {};

// ── References ────────────────────────────────────────
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [];

export const edges = [];

export default { meta, inputs, references, nodes, edges };
