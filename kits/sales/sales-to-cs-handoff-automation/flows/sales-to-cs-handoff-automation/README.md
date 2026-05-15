# Sales-to-CS Handoff Automation Flow

This Lamatic flow automates the Sales → Customer Success handoff when a deal closes.

## What it does

Accepts a raw deal payload via GraphQL and:

1. **Validates & structures** the input using an InstructorLLM node — gates bad data before anything else runs
2. **Generates deal intelligence** — complexity score, onboarding tier, risks, technical requirements, promise audit
3. **Routes deterministically** — enterprise (complexity > 7) or standard (complexity ≤ 7) via branch nodes
4. **Generates four parallel outputs** — CS brief, engineering brief, customer kickoff email, management summary
5. **Escalates on failure** — generates a structured escalation report if validation fails

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `company_name` | string | Name of the customer company |
| `deal_value` | string | Deal value in dollars |
| `sales_transcript` | string | Raw sales call transcript |
| `crm_notes` | string | CRM notes from the AE |
| `timeline` | string | Promised onboarding timeline |

## Outputs

| Field | Description |
|-------|-------------|
| `validation_status` | `passed` or `failed` |
| `continue_pipeline` | Boolean — whether downstream nodes ran |
| `complexity_score` | 1–10 deal complexity |
| `onboarding_tier` | `enterprise` or `standard` |
| `confidence_score` | 0–100 AI confidence |
| `onboarding_risks` | Array of risk flags |
| `onboarding_route` | Final routing decision |
| `cs_brief` | CS Handoff Brief (markdown) |
| `engineering_brief` | Engineering Brief (markdown) |
| `customer_email` | Customer Kickoff Email (markdown) |
| `management_summary` | Executive Summary (markdown) |
| `escalation_summary` | Escalation report (only on validation failure) |
