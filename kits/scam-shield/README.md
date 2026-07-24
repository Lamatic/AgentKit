# Scam Shield

> A Lamatic AgentKit bundle that detects common UPI/banking fraud patterns in India. Given a description of a suspicious call, message, or interaction, it returns a structured risk assessment grounded in a retrieved knowledge base of known scam patterns.

---

## What This Kit Does

India-focused UPI/banking scams tend to follow a small set of well-known social-engineering patterns — fake KYC updates, OTP-request calls, screen-sharing scams, malicious QR codes, fake collect requests, spoofed customer care numbers, fake loan apps, SIM swap fraud, phishing pages, and task-based job scams. This kit:

1. **Retrieves matching scam patterns via RAG** - embeds the user's message and searches a vector store of known fraud patterns.
2. **Classifies the risk** - returns a `risk_score` (0-100), specific `red_flags` found in the message, a plain-language `explanation`, a `recommended_action`, and the correct `report_channel`.
3. **Never asks for sensitive data** - guardrails in `constitutions/default.md` ensure the agent never requests OTP/PIN/CVV/account numbers and never provides exploit detail on named banks.

**Two flows, one knowledge base, no database setup beyond a vector store.**

---

## Quickstart

### Step 1: Import the Flows

1. Log in to your [Lamatic workspace](https://studio.lamatic.ai).
2. Navigate to **Flows → Import Flow**.
3. Upload `flows/index-scam-patterns.ts` and `flows/scam-message-triage.ts`.
4. Configure your LLM/embedding API key (e.g. Gemini) under **Settings → Secrets**.
5. Create a vector store named `scampatterns`.

### Step 2: Populate the Knowledge Base

Run `index-scam-patterns` once with either a single pattern:

```json
{ "pattern_name": "Fake KYC Update", "content": "..." }
```

or a batch:

```json
{
  "patterns": [
    { "pattern_name": "Fake KYC Update", "content": "Caller claims your KYC has expired and asks you to click a link or share an OTP to 're-verify' your account." },
    { "pattern_name": "Screen-Sharing Scam", "content": "Caller poses as bank support and asks you to install a remote-access app, then walks you through 'fixing' an issue while capturing your credentials." }
  ]
}
```

### Step 3: Deploy and Retrieve the API Endpoint

Deploy `scam-message-triage`, then open its Trigger Node (API Request) to copy the GraphQL endpoint URL and Bearer token.

### Environment Variables

Copy `.env.example` to `.env` and fill in your project credentials from **Settings → API Keys** in Lamatic Studio:

- `LAMATIC_API_URL` - your Lamatic API endpoint.
- `LAMATIC_PROJECT_ID` - your Lamatic project ID.
- `LAMATIC_API_KEY` - your Lamatic API key.

---

## Test

Once `scam-message-triage` is deployed, you can call it directly via its GraphQL trigger endpoint (found in the flow's Trigger Node details panel) using your API key as the bearer token.

Load the variables from `.env` into your shell before running the example, otherwise `LAMATIC_API_URL` and `LAMATIC_API_KEY` will be empty:

```bash
export $(grep -v '^#' .env | xargs)

curl -X POST "$LAMATIC_API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LAMATIC_API_KEY" \
  -d '{
    "message": "I got a call from someone saying they are from my bank and my account will be blocked unless I share the OTP I just received"
  }'
```

**Example response:**

```json
{
  "modelResponse": {
    "risk_score": 100,
    "red_flags": ["caller claimed to be from the bank", "threatened account block", "requested OTP"],
    "explanation": "This interaction matches the 'OTP Request Call' scam pattern. The caller is using high-pressure tactics to manipulate you into revealing a sensitive OTP.",
    "recommended_action": "Hang up immediately, do not share the OTP, and contact your bank using the official number on your card.",
    "report_channel": "cybercrime.gov.in or helpline 1930"
  },
  "references": [ { "pattern_name": "OTP Request Call", "certainty": 0.899 } ]
}
```

---

## Folder Structure

```text
kits/scam-shield/
├── flows/
│   ├── index-scam-patterns.ts        # Ingests fraud patterns into the vector store
│   └── scam-message-triage.ts        # User-facing RAG-based risk classifier
├── prompts/                          # Node system/user prompts
├── model-configs/                    # Embedding + generative model configs
├── scripts/                          # Code-node logic (batch/single ingestion handling)
├── constitutions/
│   └── default.md                    # Safety guardrails
├── agent.md                          # Agent identity and context
├── lamatic.config.ts                 # Kit metadata
├── .env.example                      # Env var template for calling the deployed flow
└── README.md                         # This guide
```

---

## Author

**Raz**