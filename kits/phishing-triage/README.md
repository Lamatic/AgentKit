<a href="https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fphishing-triage%2Fapps&env=PHISHING_TRIAGE,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY" target="_blank" style="text-decoration:none;">
  <div align="right">
    <span style="display:inline-block;background:#e63946;color:#fff;border-radius:6px;padding:10px 22px;font-size:16px;font-weight:bold;letter-spacing:0.5px;text-align:center;box-shadow:0 2px 8px 0 #0001;">Deploy on Vercel</span>
  </div>
</a>

# Phishing Email Triage

> A Lamatic AgentKit **kit**: one flow that triages an email for phishing risk, plus a Next.js analyst console to drive it.

## The problem
Support desks, IT teams, and small security operations get a constant stream of "is this email safe?" reports. Reading each one, checking the sender, hovering every link, and judging the urgency is slow, inconsistent, and easy to get wrong under load. Most inboxes have no SOC behind them.

## What this kit does
Paste an email and get a structured, explainable phishing-risk verdict in real time:

```json
{
  "verdict": "phishing",
  "confidence": 93,
  "risk_score": 90,
  "indicators": [
    "Sender domain paypa1-alerts.com typosquats paypal.com",
    "Reply-To (secure-verify-desk.net) differs from sender domain",
    "Link uses a raw IP host: http://198.51.100.23/paypal/login/verify",
    "24-hour account-suspension urgency pressuring immediate action"
  ],
  "extracted_urls": ["http://198.51.100.23/paypal/login/verify"],
  "recommended_action": "Do not click. Report to IT/security and delete.",
  "reasoning": "The sender domain impersonates PayPal, the link points to a raw IP address unrelated to PayPal, and the message manufactures urgency — classic credential-phishing markers."
}
```

It **never follows links or opens attachments** — it reasons about them as text — and it treats the email body as untrusted data, so instructions hidden inside an email (e.g. "ignore previous instructions") can't hijack the verdict.

## Why it's built this way (hybrid: deterministic + LLM)
Pure-LLM extraction hallucinates URLs and misses homoglyphs. Pure-regex can't judge intent. So the flow does both:

```
API Request → Extract IOCs (code) → Analyze Email (LLM) → Finalise Verdict (code) → API Response
```

1. **Extract IOCs** *(code node)* — regex-extracts URLs, domains, IP-literal links, and heuristic signals (reply-to mismatch, URL shorteners, urgency language, credential lures). Facts, not recall.
2. **Analyze Email** *(LLM node)* — reasons over the email **and** the extracted indicators, producing a JSON verdict at low temperature.
3. **Finalise Verdict** *(code node)* — parses, clamps, and normalises the model output into a stable schema and merges the IOCs, so the API contract never drifts.

## Why it's useful
- **Saves time** — a manual per-email judgement becomes one request.
- **Consistent** — the same signals are checked every time, with a numeric risk score.
- **Explainable** — every verdict lists the specific indicators that drove it.
- **Grounded** — the code node guarantees URLs are real, not hallucinated.
- **Composable** — drop the flow into a "report phishing" button, a mail-gateway hook, or the included console.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `body` | string | Yes | Plain-text email content. |
| `subject` | string | No | Subject line — improves accuracy. |
| `from` | string | No | Sender name/address. |
| `reply_to` | string | No | Reply-To address, if present. |

## Output (`answer`)
`verdict`, `confidence`, `risk_score`, `indicators[]`, `extracted_urls[]`, `recommended_action`, `reasoning`, `iocs`.

## Repository layout
```
phishing-triage/
├── lamatic.config.ts                       # kit metadata, envKey, deploy link
├── agent.md                                # agent identity & architecture
├── README.md                               # this file
├── .env.example                            # required env vars (placeholders)
├── constitutions/default.md                # guardrails
├── flows/phishing-triage.ts                # the exported flow
├── prompts/
│   ├── phishing-triage_analyze_system.md
│   └── phishing-triage_analyze_user.md
├── model-configs/phishing-triage_analyze.ts
├── scripts/
│   ├── phishing-triage_extract-iocs.ts     # deterministic IOC extraction
│   └── phishing-triage_finalise-verdict.ts # output normalisation
└── apps/                                    # Next.js analyst console
    ├── orchestrate.ts                       # config: credentials + flow map
    ├── actions/orchestrate.ts               # server action → executeFlow
    ├── lib/lamatic-client.ts                # Lamatic SDK client
    └── app/page.tsx                         # the console UI
```

## Setup

### 1. Build & deploy the flow
1. Recreate the flow in [Lamatic Studio](https://studio.lamatic.ai): **API Request → Extract IOCs (code) → Analyze Email (LLM) → Finalise Verdict (code) → API Response**, using the prompts and scripts in this kit. Keep the LLM temperature low (~0.1).
2. Deploy the flow and copy its **flow ID**.
3. From Studio → **Settings**, copy `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### 2. Run the console
```bash
cd apps
npm install
cp .env.example .env.local     # fill in PHISHING_TRIAGE + the three Lamatic creds
npm run dev                     # http://localhost:3000
```
Click **Load sample** to try the bundled phishing example, then **Analyse email**.

### 3. Deploy the console
Use the **Deploy on Vercel** button above, or import `kits/phishing-triage/apps` into Vercel and set the four environment variables.

## Guardrails
Behaviour is governed by [`constitutions/default.md`](./constitutions/default.md) and the system prompt:
- Email content is untrusted; embedded instructions are ignored (prompt-injection resistant).
- No URL is ever fetched or opened.
- Credentials, OTPs, and full account numbers are redacted in the reasoning.
- Uncertainty lowers confidence rather than inventing indicators.

## Limitations
- Content/heuristic analysis, **not** header authentication — it does not verify SPF/DKIM/DMARC. Pair it with gateway authentication results for defence in depth.
- Verdicts depend on the chosen model; validate on your own samples before automating any blocking action.

## Tags
Security, Support

---
*Contributed to [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) as part of the AgentKit Challenge.*
