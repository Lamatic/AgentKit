# Support Triage Agent

**Support Triage Agent** is a Lamatic-powered automation kit that helps support teams review incoming tickets faster and more consistently. It accepts raw support requests, classifies the issue, assigns severity, estimates duplicate risk, recommends the likely owner, flags SLA risk, and returns a concise escalation summary.

## Problem It Solves

Support teams often spend too much time manually reviewing noisy inbound tickets before any real troubleshooting begins. This kit turns one support request into a structured triage result that is easier to route, prioritize, and escalate.

## What The Kit Returns

For each ticket, the flow returns:

- `category`
- `severity`
- `priority_reason`
- `possible_duplicate`
- `recommended_owner`
- `sla_risk`
- `escalation_summary`

## Lamatic Setup

1. Create a project in [Lamatic](https://lamatic.ai).
2. Create and deploy a flow named `support-triage`.
3. Copy the deployed flow ID and your Lamatic API credentials.
4. Export the flow into [`flows/support-triage`](/home/kumarsaurabh27d/lamatic/AgentKit/kits/automation/support-triage/flows/support-triage).

## Environment Variables

Create `.env.local` with:

```env
FLOW_SUPPORT_TRIAGE="your-flow-id"
LAMATIC_API_URL="https://api.lamatic.ai/v1/..."
LAMATIC_PROJECT_ID="proj_xxxxxxxxxxxx"
LAMATIC_API_KEY="lam_xxxxxxxxxxxx"
```

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Example Input

```json
{
  "ticket_text": "Our enterprise team cannot access the dashboard and customers are reporting failures.",
  "customer_tier": "enterprise",
  "channel": "email",
  "created_at": "2026-03-21T10:30:00Z",
  "past_ticket_context": "Two similar dashboard timeout complaints were reported earlier today."
}
```

## Example Output

```json
{
  "category": "Access / Dashboard Issue",
  "severity": "high",
  "priority_reason": "Enterprise customer reports a customer-facing access failure.",
  "possible_duplicate": true,
  "recommended_owner": "Platform Support",
  "sla_risk": true,
  "escalation_summary": "Enterprise customer reports dashboard access failures affecting end users. Similar timeout complaints were seen earlier today. Immediate investigation is recommended."
}
```

## Repository Notes

- Main kit UI: [`app/page.tsx`](/home/kumarsaurabh27d/lamatic/AgentKit/kits/automation/support-triage/app/page.tsx)
- Server action: [`actions/orchestrate.ts`](/home/kumarsaurabh27d/lamatic/AgentKit/kits/automation/support-triage/actions/orchestrate.ts)
- Exported Lamatic flow: [`flows/support-triage/config.json`](/home/kumarsaurabh27d/lamatic/AgentKit/kits/automation/support-triage/flows/support-triage/config.json)
