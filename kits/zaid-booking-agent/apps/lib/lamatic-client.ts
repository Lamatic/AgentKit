// STUB — Lamatic API client, not yet implemented.
//
// Thin wrapper for invoking a deployed Lamatic flow via its GraphQL API, using
// LAMATIC_API_URL / LAMATIC_PROJECT_ID / LAMATIC_API_KEY from the environment (see
// .env.example). Modeled on the runFlow mutation pattern used by other AgentKit kits:
//
//   mutation RunFlow($flowId: ID!, $input: JSON!) {
//     runFlow(flowId: $flowId, input: $input) { status runId output }
//   }
//
// Planned function: runFlow(flowId: string, input: Record<string, unknown>) -> Promise<...>
//
// Each API route (app/api/intake, app/api/scheduling, app/api/confirmation) will call this
// with the corresponding flow-ID env var (INTAKE_AGENT, SCHEDULING_AGENT, CONFIRMATION_AGENT).
//
// Do not implement this until at least the Intake Agent flow is deployed in Lamatic Studio and
// has a real Flow ID to call — there's nothing to test this against yet.

export {};
