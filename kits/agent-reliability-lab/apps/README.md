# Agent Reliability Lab — App

Next.js UI for the Agent Reliability Lab flow: a form to submit a target agent's system prompt (and optionally a live endpoint), and a rendered report view for the audit results.

## Setup

1. Copy `.env.example` to `.env.local` and fill in:
   - `AGENT_RELIABILITY_AUDIT_FLOW_ID` — the deployed flow's Flow ID (Studio → flow → Details panel)
   - `LAMATIC_API_KEY`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID` — from Settings → API Keys in your Lamatic project

2. Install and run:
   ```sh
   npm install
   npm run dev
   ```

3. Open `http://localhost:3000`, paste in a system prompt, and click **Run Audit**.

## Notes

- Leaving the target endpoint URL empty runs a fast static-only audit. Filling it in runs the full adversarial probe battery — the target endpoint must accept `POST { "message": string }` and return a text/JSON response.
- **Auth header:** if your target agent's endpoint requires authentication, put the complete header value in the "Auth header" field exactly as the endpoint expects it — e.g. `Bearer sk-...` or `Basic dXNlcjpwYXNz`. It's sent verbatim as the request's `Authorization` header on every probe call. Leave it blank for unauthenticated endpoints.
- For safety, the flow refuses to send probes to targets that resolve to localhost or private/internal IP ranges (SSRF protection) — point `targetEndpointUrl` at a real, externally reachable agent.
- This app is a thin UI over the flow — all of the actual analysis, probing, and scoring logic lives in the Lamatic flow itself (see [`../flows/agent-reliability-audit.ts`](../flows/agent-reliability-audit.ts) and [`../agent.md`](../agent.md)).
