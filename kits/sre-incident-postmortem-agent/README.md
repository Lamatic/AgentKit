# SRE Incident Postmortem Agent

A full AgentKit kit that helps engineering teams turn raw incident notes into a structured, blameless SRE postmortem. The kit includes a runnable Next.js app, a Lamatic flow definition, and prompt/config assets for generating postmortem summaries, timelines, remediation plans, and follow-up actions.

## Problem Statement

After an incident, responders often have scattered context across alerts, logs, chat threads, timelines, and status updates. Writing a useful postmortem takes time, and rushed drafts can miss customer impact, prevention work, or uncertainty around the suspected root cause.

The SRE Incident Postmortem Agent helps teams create a clear first draft while the incident context is fresh. It standardizes the postmortem structure, reinforces blameless language, and turns operational notes into review-ready sections that humans can verify and refine.

## Who It Is For

- SRE teams writing incident reviews and reliability reports.
- DevOps teams documenting outages, deploy regressions, and operational failures.
- Platform teams tracking infrastructure incidents and prevention work.
- Support teams summarizing customer-facing impact for engineering review.
- Engineering teams that need a repeatable, lightweight post-incident workflow.

## Features

- Incident intake form for service name, title, alerts, symptoms, timeline, impact, and current status.
- Load Sample Incident button for fast demos and validation.
- Generate Postmortem button that calls the Lamatic flow from server-side code.
- Clear button for resetting the workspace.
- Loading and error states for a polished user experience.
- Structured result cards for severity, executive summary, root cause, impact, remediation, prevention, timeline, and follow-ups.
- Markdown postmortem section for direct review or export.
- Copy Markdown button for moving the generated draft into docs, tickets, or incident review tools.
- Server-only credential handling. `LAMATIC_API_KEY` is read only from `process.env.LAMATIC_API_KEY`.

## Architecture

```text
Next.js Frontend
  Incident form, sample loader, result cards, Markdown preview
        |
        | Server Action
        v
Lamatic GraphQL API
  executeWorkflow(workflowId, payload)
        |
        v
Lamatic Flow
  sre-incident-postmortem-agent
        |
        v
LLM Postmortem Generator
  Blameless postmortem JSON + Markdown draft
```

### Components

- **Next.js frontend:** Collects incident context and renders the generated report.
- **Server action:** Keeps Lamatic credentials on the server and submits the GraphQL request.
- **Lamatic flow:** Defines the workflow contract and response shape.
- **LLM postmortem generator:** Produces the structured postmortem using blameless SRE guardrails.

## Input Schema

| Field | Type | Required | Description |
|---|---|---:|---|
| `service_name` | string | Yes | Affected service, product area, or system. |
| `incident_title` | string | Yes | Short incident title. |
| `alert_details` | string | No | Alert name, threshold, trigger time, severity, or monitoring context. |
| `logs_or_symptoms` | string | No | Logs, metrics, traces, user symptoms, or responder observations. |
| `timeline_notes` | string | No | Detection, acknowledgement, escalation, mitigation, and recovery notes. |
| `impact_description` | string | No | Customer, business, internal, or operational impact. |
| `current_status` | string | No | Active, mitigated, resolved, pending verification, or follow-up status. |

## Output Schema

```json
{
  "postmortem": {
    "severity": "High",
    "executive_summary": "string",
    "suspected_root_cause": "string",
    "timeline": ["string"],
    "customer_impact": "string",
    "immediate_remediation": "string",
    "long_term_prevention": ["string"],
    "owner_followups": ["string"],
    "markdown_postmortem": "string"
  }
}
```

## Example Input

```json
{
  "service_name": "checkout-api",
  "incident_title": "Elevated checkout latency after deployment",
  "alert_details": "p95 latency exceeded 2.5s for 15 minutes. Error budget burn alert fired from the payments dashboard.",
  "logs_or_symptoms": "Database connection pool saturation, increased 504 responses, slow payment confirmations, and retry storms from background workers.",
  "timeline_notes": "10:05 deployment completed. 10:12 latency alert fired. 10:18 on-call acknowledged. 10:23 database pool saturation identified. 10:27 rollback started. 10:38 latency recovered.",
  "impact_description": "Some customers could not complete checkout or saw delayed payment confirmation. Support volume increased during the incident window.",
  "current_status": "Mitigated by rollback. Database metrics are stable. Follow-up verification and query review are pending."
}
```

## Example Output

```json
{
  "postmortem": {
    "severity": "High",
    "executive_summary": "Checkout latency increased shortly after a deployment and caused degraded purchase completion. The incident was mitigated by rollback, and database metrics returned to normal.",
    "suspected_root_cause": "The deployment likely introduced a database access pattern or retry behavior that saturated the connection pool. This should be verified through query review and deployment diff analysis.",
    "timeline": [
      "10:05 deployment completed",
      "10:12 latency alert fired",
      "10:18 on-call acknowledged",
      "10:23 database pool saturation identified",
      "10:27 rollback started",
      "10:38 latency recovered"
    ],
    "customer_impact": "Some customers experienced slow checkout or failed payment confirmation during the incident window.",
    "immediate_remediation": "The team rolled back the deployment and monitored latency, error rate, and database connection pool health until metrics stabilized.",
    "long_term_prevention": [
      "Add deployment guardrails for checkout latency and database connection saturation.",
      "Review retry behavior in checkout workers to prevent retry amplification.",
      "Add pre-release load checks for database connection usage."
    ],
    "owner_followups": [
      "Checkout team: review the deployment diff and identify the connection pool regression.",
      "Platform team: add dashboard annotations for deployments and connection pool alerts.",
      "SRE team: define rollback criteria for checkout latency burn alerts."
    ],
    "markdown_postmortem": "# Incident Postmortem: Elevated checkout latency after deployment\n\n## Summary\nCheckout latency increased shortly after deployment..."
  }
}
```

## Local Setup

### 1. Install Dependencies

```bash
cd kits/sre-incident-postmortem-agent/apps
npm install
```

### 2. Create Local Environment File

```bash
cp .env.example .env.local
```

### 3. Fill Lamatic Credentials

Edit `.env.local`:

```env
LAMATIC_API_KEY=your-api-key
LAMATIC_API_URL=https://your-project.lamatic.dev
LAMATIC_PROJECT_ID=your-project-id
SRE_POSTMORTEM_FLOW_ID=your-flow-id
```

Do not commit `.env.local`.

### 4. Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Lamatic Studio Setup And Export Notes

1. Create or open a Lamatic project in Studio.
2. Build and deploy a flow named `sre-incident-postmortem-agent`.
3. Configure the flow to accept the input fields documented above.
4. Configure the LLM node to return the documented `postmortem` object.
5. Export the flow from Lamatic Studio.
6. Keep prompt text, model configs, and flow resources externalized through `@reference` files when possible.
7. Ensure `lamatic.config.ts` contains `type: "kit" as const` and maps the flow step to `SRE_POSTMORTEM_FLOW_ID`.

The included app calls the deployed flow through Lamatic GraphQL using the flow ID from `SRE_POSTMORTEM_FLOW_ID`.

## Vercel Deployment Notes

1. Import the repository into Vercel.
2. Set the root directory to:

```text
kits/sre-incident-postmortem-agent/apps
```

3. Add these environment variables in Vercel:

```env
LAMATIC_API_KEY
LAMATIC_API_URL
LAMATIC_PROJECT_ID
SRE_POSTMORTEM_FLOW_ID
```

4. Deploy the app.

The API key remains server-side because the Lamatic request is made from a Next.js server action.

## Limitations

- The root cause is a suspected root cause unless the provided evidence proves it.
- The generated postmortem needs human review before publication.
- The kit does not replace an incident commander, SRE lead, or engineering judgment.
- The agent does not inspect live dashboards, logs, traces, tickets, or deploy systems.
- Output quality depends on the specificity and accuracy of the submitted incident notes.
- The generated owner follow-ups use roles unless specific owners are included in the input.

## Tradeoffs

- A single synchronous Lamatic flow keeps the kit simple and demo-friendly, but very long incidents may benefit from asynchronous processing.
- Structured JSON output makes the UI predictable, but some nuanced incidents may need manual editing.
- Server-side GraphQL protects credentials, but requires a backend-capable deployment target.
- The app focuses on a strong first draft rather than exhaustive incident forensics.
- The workflow prioritizes blameless SRE best practices, which may require editing for organizations with highly specific postmortem templates.

## Future Improvements

- Add file upload support for incident notes or exported chat transcripts.
- Add integrations for observability tools, ticketing systems, and incident management platforms.
- Add severity scoring based on configurable service impact rules.
- Add editable postmortem sections before copying Markdown.
- Add export options for PDF, Markdown file download, or ticket creation.
- Add action item tracking with owner, priority, due date, and verification status.
- Add support for organization-specific postmortem templates.
- Add multi-incident comparison to identify recurring reliability patterns.
