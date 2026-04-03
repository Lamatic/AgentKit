# support-triage

## About This Flow

This flow triages incoming support requests into a structured JSON response that can be used by a support dashboard, queue router, or escalation workflow.

## Inputs

- `ticket_text`
- `customer_tier`
- `channel`
- `created_at`
- `past_ticket_context`

## Outputs

- `category`
- `severity`
- `priority_reason`
- `possible_duplicate`
- `recommended_owner`
- `sla_risk`
- `escalation_summary`

## Flow Components

This workflow contains three nodes:

- `API Request`
- `Generate JSON`
- `API Response`

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

## Configuration Requirements

This flow requires one private model configuration, documented in [`inputs.json`](/home/kumarsaurabh27d/lamatic/AgentKit/kits/automation/support-triage/flows/support-triage/inputs.json).
