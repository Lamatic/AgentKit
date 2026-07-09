// STUB — session state store, not yet implemented.
//
// Holds the shared session object (see the data contract in ../../README.md) that gets passed
// between the Intake, Scheduling, and Confirmation flow calls. This is the thing that makes
// the 3 flows a coordinated system instead of isolated calls — see docs/decision-log.md for
// why the app (not flow-to-flow chaining) owns this.
//
// Planned shape:
//
// type Session = {
//   session_id: string;
//   customer: { name: string; phone: string; email: string | null };
//   request: {
//     service_type: string;
//     preferred_date: string;
//     preferred_window: string;
//     notes: string | null;
//   };
//   status:
//     | "intake"
//     | "scheduling"
//     | "awaiting_confirmation"
//     | "confirmed"
//     | "reminded"
//     | "no_show";
//   proposed_slots: { date: string; time: string }[];
//   confirmed_slot: { date: string; time: string } | null;
// };
//
// Planned functions: createSession(), getSession(id), updateSession(id, patch).
//
// MVP implementation should be a simple in-memory Map (single dev server) or a JSON file on
// disk — no need for Postgres/Supabase until this is a real multi-instance deployment. Build
// this once the Intake Agent flow exists and app/api/intake/route.ts needs somewhere to write
// the first session.

export {};
