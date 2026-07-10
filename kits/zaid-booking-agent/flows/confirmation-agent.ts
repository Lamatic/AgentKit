/*
 * # Confirmation Agent
 * BUILT AND TESTED in Lamatic Studio (Zaid's Organization / ZaidsProject406, model
 * claude-haiku-4-5), both branches verified end-to-end. Not yet exported into this file — do
 * that via Studio's export menu once the flow's Flow ID is copied into .env as
 * CONFIRMATION_AGENT. Until then this remains a doc-only stub describing the real,
 * already-built node graph.
 *
 * ## Purpose
 * Writes the booking once the customer has picked a specific slot, and generates a
 * natural-language confirmation message — or, if the slot was taken in the meantime, a
 * same-shape decline message instead of a false confirmation.
 *
 * ## Trigger
 * API request (graphqlNode). Schema: `{ confirmed_date: string, confirmed_time: string,
 * service_type: string, customer_name: string, session_id: string }`.
 *
 * ## Node Walkthrough (as built)
 * 1. `API Request` (trigger) — receives `confirmed_date`, `confirmed_time`, `service_type`,
 *    `customer_name`, `session_id`.
 * 2. `Write Booking` (codeNode) — re-checks the confirmed slot is still present in the inline
 *    `OPEN_SLOTS` array (see `scripts/mock-availability.js`) immediately before "writing", to
 *    guard against a double-booking race between two customers confirming near-simultaneously.
 *    Sets `output.booked` (boolean). Always executes regardless of which branch fires
 *    downstream, so `booked` is safe to source directly from this node for the response.
 * 3. `Condition` — checks `{{codeNode_672.output.booked}} == "true"`.
 *    - `Condition 1` (true) → `Generate Confirmation` (Generate Text LLM node,
 *      claude-haiku-4-5): produces a short, warm confirmation message restating service, date,
 *      time, and customer name. System prompt:
 *      `@prompts/confirmation-agent_generate-message_system.md`. Output field:
 *      `generatedResponse` (string).
 *    - `Else` (false) → `Prepare Failure Message` (codeNode): sets `booked: false` and a fixed
 *      `confirmation_message` apologizing that the slot was taken and asking the customer to
 *      pick another time. No LLM call needed here — the message is a static string since there
 *      is nothing to personalize about a failed booking.
 * 4. `API Response` — output mapping:
 *    - `booked` ← `{{codeNode_672.output.booked}}` (Write Booking runs on every execution).
 *    - `confirmation_message` ←
 *      `{{codeNode_676.output.confirmation_message}}{{LLMNode_440.output.generatedResponse}}`
 *      — both branch outputs concatenated in sequence. Only one of the two ever executes per
 *      run, and an unexecuted node's referenced output resolves to an empty string, so the
 *      concatenation always yields exactly the one message that actually ran. Same
 *      undefined-as-falsy merge pattern used in the Scheduling Agent's `message` field — see
 *      decision log.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `confirmed_date` | `string` | Yes | The date the customer selected, `YYYY-MM-DD`. |
 * | `confirmed_time` | `string` | Yes | The time the customer selected. |
 * | `service_type` | `string` | Yes | From the Intake Agent's output. |
 * | `customer_name` | `string` | Yes | From the session object / Intake Agent's output. |
 * | `session_id` | `string` | Yes | Session identifier. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `booked` | `boolean` | False if the re-check found the slot was taken in the meantime. |
 * | `confirmation_message` | `string` | Natural-language confirmation (LLM-generated) or a
 *   fixed decline message, depending on `booked`. |
 *
 * ## Dependencies
 * - `scripts/mock-availability.js` (MVP: `OPEN_SLOTS` inline array) / Google Calendar API
 *   (stretch — same interface, `Write Booking` becomes an `apiNode`).
 * - LLM provider for the Generate Confirmation node (Anthropic credential, claude-haiku-4-5).
 * - Twilio (stretch only, not built) for actually sending the confirmation as SMS/email.
 *
 * ## Known limitation
 * `Write Booking`'s re-check reads the same static `OPEN_SLOTS` array every time — it doesn't
 * actually remove a slot once booked, since there's no persistent store on the Lamatic side
 * (the Next.js app's session object is the source of truth for booking status across the
 * pipeline). This means the double-booking guard only catches slots that were never in
 * `OPEN_SLOTS` to begin with, not slots booked by an earlier request in the same session run.
 * Acceptable for MVP; a real implementation would back this with the same store the Scheduling
 * Agent reads from.
 */

export {};
