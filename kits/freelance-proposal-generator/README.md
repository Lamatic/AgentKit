# Freelance Proposal Generator

Generates a tailored, professional freelance project proposal from a client name, project description, and budget range.

## What it does

This template takes three inputs — `client_name`, `project_description`, and `budget_range` — and uses an LLM to generate a structured proposal with the following sections:

- Introduction
- Scope of Work
- Timeline
- Pricing
- Next Steps

## Inputs

| Field | Type | Description |
|---|---|---|
| `client_name` | string | Name of the client or company |
| `project_description` | string | Brief description of the project |
| `budget_range` | string | Estimated budget range (e.g. "$3,000 - $5,000") |

## Usage

1. Import this template into your Lamatic project.
2. Deploy the flow.
3. Call the API with your input fields to receive a generated proposal.

## Example

**Input:**
```json
{
  "client_name": "Acme Corp",
  "project_description": "Build a responsive marketing website with a blog and contact form",
  "budget_range": "$3,000 - $5,000"
}
```

**Output:** A full proposal draft with Introduction, Scope of Work, Timeline, Pricing, and Next Steps sections.