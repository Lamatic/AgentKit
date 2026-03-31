# Cold Email Personalisation Flow

## What This Flow Does

Takes structured profile and student context as inputs and generates a hyper-personalized cold outreach email for engineering internship applications. Powered by Gemini 2.5 Flash.

## Flow Nodes

| Node | Type | Purpose |
|------|------|---------|
| API Request | GraphQL Trigger | Receives 7 input fields from the app |
| Generate Text | LLM (Gemini 2.5 Flash) | Generates subject line, email body, and personalization hook as JSON |
| API Response | GraphQL Response | Returns `generatedResponse` containing the structured JSON output |

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `profile_data` | string | LinkedIn bio or any context about the recipient |
| `prospect_name` | string | Recipient's full name |
| `prospect_role` | string | Recipient's job title |
| `company_name` | string | Company the student is applying to |
| `product_description` | string | Student's background — skills, school, projects |
| `value_proposition` | string | Why the student is a strong fit |
| `call_to_action` | string | What the student is asking for (e.g. "a 15-minute chat") |

## Output

The `generatedResponse` field contains a JSON object with:

```json
{
  "subject_line": "UC Berkeley CS Student - Payments Infrastructure Interest - Summer 2026",
  "email_body": "Dear Sarah Chen, ...",
  "personalized_hook": "I referenced Sarah Chen's specialization in payments infrastructure..."
}
```

## Setup

1. Import `config.json` into Lamatic Studio
2. In the **Generate Text** node, connect your Gemini API key credential
3. Deploy the flow
4. Copy the Flow ID into `AUTOMATION_COLD_EMAIL` in your `.env.local`

## Variable Paths

All input variables use `triggerNode_1.output.xxx` paths in the LLM prompt (e.g. `{{triggerNode_1.output.prospect_name}}`). These must be set via the variable picker in Studio, not typed manually.
