// STUB — chat widget shell, not yet implemented.
//
// Intended behavior once built:
// - A simple chat interface simulating the customer conversation (MVP; Twilio voice bridge is
//   a stretch goal, not this page).
// - On first message: generate a session_id, POST it + the message to /api/intake.
// - Render the Intake Agent's response — either a clarifying question (keep chatting) or a
//   hand-off confirmation, at which point call /api/scheduling with the structured request.
// - Once the Scheduling Agent returns proposed_slots, let the customer pick one, then call
//   /api/confirmation with the chosen slot.
// - Show the Confirmation Agent's natural-language confirmation message as the final message.
//
// Do not implement this until the Intake Agent flow exists in Lamatic Studio and
// INTAKE_AGENT is set in .env — there is nothing to call yet.

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <div className="max-w-md text-center text-zinc-500 dark:text-zinc-400">
        <h1 className="mb-2 text-xl font-semibold text-black dark:text-zinc-50">
          Local Service Booking Agent
        </h1>
        <p>Chat widget not yet implemented — build the Intake Agent flow first.</p>
      </div>
    </div>
  );
}
