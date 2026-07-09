/*
 * # Confirmation Agent
 * STUB — not yet built in Lamatic Studio. Build this only after Scheduling Agent is fully
 * working and tested on its own. This file will be replaced by the real export
 * (meta/inputs/references/nodes/edges) once the flow is built.
 *
 * ## Purpose
 * Writes the booking once the customer has picked a specific slot, and generates a
 * natural-language confirmation message.
 *
 * ## Trigger
 * API request (graphqlNode), fires when the customer confirms a specific slot from the
 * Scheduling Agent's `proposed_slots`.
 *
 * ## Planned Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `confirmed_slot` | `{date, time}` | Yes | The slot the customer selected. |
 * | `customer` | `{name, phone, email}` | Yes | From the session object. |
 * | `service_type` | `string` | Yes | From the Intake Agent's output. |
 * | `session_id` | `string` | Yes | Session identifier. |
 *
 * ## Planned Node Walkthrough
 * 1. `API Request` (trigger, graphqlNode) — receives the confirmed slot + customer + service.
 * 2. `Write Booking` (codeNode for MVP / apiNode for the Google Calendar stretch goal) —
 *    re-checks the slot is still available immediately before writing, to guard against a
 *    double-booking race between two customers confirming near-simultaneously (see
 *    "Double-booking" under Guardrails in agent.md).
 * 3. `Generate Confirmation` (LLMNode) — produces the natural-language confirmation message.
 *    System prompt: `@prompts/confirmation-agent_generate-message_system.md`.
 * 4. `Send Confirmation` (apiNode, stretch) — sends SMS/email via Twilio. Not built for MVP.
 * 5. `API Response` (responseNode) — returns the confirmation message and updates `status` to
 *    `confirmed` in the shared session contract.
 *
 * ## Planned Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `booked` | `boolean` | False if the re-check found the slot was taken in the meantime. |
 * | `confirmation_message` | `string` | Natural-language message to show/send the customer. |
 *
 * ## Dependencies
 * - Booking store (MVP: mock; stretch: Calendar write).
 * - LLM provider for the Generate Confirmation node.
 * - Twilio (stretch only).
 */

export {};
