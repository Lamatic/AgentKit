# Cold Email Personalization — Lamatic AgentKit

AI-assisted outreach for **college students** targeting **engineering internships**, co-ops, and new-grad roles. Paste LinkedIn-style profile text and structured fields; get a **subject line**, **email body**, and **personalization hook**.

Flow exported from Lamatic lives in `flows/cold-email-personalisation/` (`config.json`, `inputs.json`, `meta.json`).

---

## Prerequisites

- Node.js 18+
- [Lamatic](https://lamatic.ai) account — deploy this flow (or import from export) in Studio
- LLM credentials configured on the **Generate Text** node in Studio

---

## Environment variables

Copy `.env.example` to `.env` or `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `AUTOMATION_COLD_EMAIL` | Deployed workflow ID (UUID from Lamatic) |
| `LAMATIC_API_URL` | GraphQL endpoint (e.g. `https://<org>-<project>.lamatic.dev/graphql`) |
| `LAMATIC_PROJECT_ID` | Project ID from Lamatic Settings |
| `LAMATIC_API_KEY` | API key from Lamatic Settings → API Keys |

---

## Run locally

```bash
cd kits/automation/cold-email-personalization
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy (Vercel)

1. Import this repository and set **Root Directory** to `kits/automation/cold-email-personalization`.
2. Add the same environment variables in the Vercel project settings.
3. Deploy.

---

## Flow inputs (API payload)

The app sends these keys to `executeWorkflow`:

- `profile_data` — pasted profile / LinkedIn context  
- `prospect_name`, `prospect_role`, `company_name`  
- `product_description` — your student pitch  
- `value_proposition` — why you’re a fit  
- `call_to_action` — what you’re asking for  

**Outputs:** `subject_line`, `email_body`, `personalized_hook` (parsed from the API result or from `generatedResponse` JSON when needed).

---

## Troubleshooting

### Error: schema `type` / `properties` / `required` in the API result (no real email text)

If `executeWorkflow` returns something like:

```json
{
  "type": "object",
  "properties": {
    "subject_line": { "type": "string" },
    "email_body": { "type": "string" },
    "personalized_hook": { "type": "string" }
  },
  "required": [...]
}
```

then the **API Response** node in Lamatic is emitting the **JSON Schema** only, not the **values** from **Generate Text**.

**Fix in Lamatic Studio**

1. Open the flow → **API Response** node → **Config** (and any **Mapping** / binding UI).
2. For each output field (`subject_line`, `email_body`, `personalized_hook`), bind the value to the **Generate Text** node — e.g. map from parsed LLM JSON or from `generatedResponse` (you may need a small parse/transform step in Studio if the UI requires it).
3. The schema defines the *shape*; each field must still have a *data source* from the LLM step.
4. **Save** and **redeploy** the flow.

Until the live API returns real strings for those three keys (or a parseable `generatedResponse` blob), this app cannot show the email.

---

## License

MIT — see repository root [LICENSE](https://github.com/Lamatic/AgentKit/blob/main/LICENSE).
