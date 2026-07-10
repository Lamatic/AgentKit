/*
 * # Scheduling Agent
 * BUILT AND TESTED in Lamatic Studio (Zaid's Organization / ZaidsProject406, model
 * claude-haiku-4-5). Not yet exported into this file — do that via Studio's export menu once
 * the flow's Flow ID is copied into .env as SCHEDULING_AGENT. Until then this remains a doc-only
 * stub describing the real, already-built node graph.
 *
 * ## Purpose
 * Checks the requested date/window against availability and either confirms the slot is open
 * or proposes 2-3 natural-language alternatives.
 *
 * ## Trigger
 * API request (graphqlNode). Schema: `{ preferred_date: string, preferred_window: string,
 * session_id: string }`.
 *
 * ## Node Walkthrough (as built)
 * 1. `API Request` (trigger) — receives `preferred_date`, `preferred_window`, `session_id`.
 * 2. `Check Availability` (codeNode_970) — filters the inline `OPEN_SLOTS` array (see
 *    `scripts/mock-availability.js`) for same-day matches against `preferred_date`. Always
 *    executes regardless of which branch fires downstream. Sets:
 *    - `slot_available` (boolean) — true if any same-day slot exists.
 *    - `open_slots` (array) — same-day matches (empty when no slot is available).
 *    - `nearby_slots` (array) — first 3 entries of the full `OPEN_SLOTS` list, used as
 *      fallback suggestions on the no-availability path (see decision log: the `open_slots`
 *      gap).
 * 3. `Condition` — checks `{{codeNode_970.output.slot_available}} == "true"`.
 *    - `Condition 1` (true) → `Prepare Availability Response` (codeNode_594): sets
 *      `slot_available: true`, `proposed_slots` (= `open_slots`), and a `message` confirming
 *      the requested date.
 *    - `Else` (false) → `Suggest Alternatives` (LLMNode_969, Generate Text, claude-haiku-4-5):
 *      generates a natural-language message offering 2-3 alternatives drawn from
 *      `nearby_slots`. System prompt: `@prompts/scheduling-agent_suggest-alternatives_system.md`.
 *      Explicitly instructed to never invent a slot not present in the provided list. Output
 *      field: `generatedResponse` (string).
 * 4. `API Response` — output mapping:
 *    - `slot_available` ← `{{codeNode_970.output.slot_available}}` (Check Availability runs on
 *      every execution, so this is sourced directly rather than from either branch node).
 *    - `proposed_slots` ← `{{codeNode_594.output.proposed_slots}}` (empty/falsy on the Else
 *      branch, since that codeNode never runs).
 *    - `message` ← `{{codeNode_594.output.message}}{{LLMNode_969.output.generatedResponse}}`
 *      — both branch outputs concatenated in sequence. Only one of the two ever executes per
 *      run, and an unexecuted node's referenced output resolves to an empty string, so the
 *      concatenation always yields exactly the one message that actually ran. See decision log:
 *      this is the same undefined-as-falsy pattern used in the Intake Agent's response merge,
 *      extended to a single field that can come from either of two different branch nodes.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `preferred_date` | `string` | Yes | From the Intake Agent's output, `YYYY-MM-DD`. |
 * | `preferred_window` | `string` | No | From the Intake Agent's output. Not currently used by
 *   `Check Availability` (date-only matching for MVP); passed through for the LLM's context. |
 * | `session_id` | `string` | Yes | Session identifier. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `slot_available` | `boolean` | True if the originally requested date has an open slot. |
 * | `proposed_slots` | `{date, time}[]` | The same-day open slot(s) when available; empty
 *   array when not. |
 * | `message` | `string` | Natural-language message to show the customer — either a
 *   confirmation (available path) or an LLM-generated alternatives offer (unavailable path). |
 *
 * ## Dependencies
 * - `scripts/mock-availability.js` (MVP) / Google Calendar API (stretch — same interface,
 *   `Check Availability` becomes an `apiNode`).
 * - LLM provider for the Suggest Alternatives node (Anthropic credential, claude-haiku-4-5).
 *
 * ## Known limitation
 * `Check Availability` matches on `preferred_date` only, not `preferred_window` — a customer
 * asking for "morning" gets any same-day slot, not just morning ones. Acceptable for MVP; the
 * mock data set is small enough that window filtering wasn't worth the added complexity yet.
 */

export {};
