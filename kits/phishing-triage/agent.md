# Phishing Email Triage — Agent Card

## Identity
A focused security agent that reads a single email and returns a structured, explainable phishing-risk verdict. It is a decision primitive: one input (an email), one output (a JSON verdict). It never sends mail, quarantines messages, or follows links.

## Architecture
This is a **kit** — a single Lamatic flow plus a Next.js analyst console.

```
API Request → Extract IOCs (code) → Analyze Email (LLM) → Finalise Verdict (code) → API Response
```

- **Extract IOCs** — a deterministic code node that regex-extracts URLs, domains, IP-literal links, and heuristic signals (reply-to mismatch, urgency language, credential lures). Grounds the verdict in facts, not model recall.
- **Analyze Email** — an LLM that reasons over the email *and* the extracted indicators, returning a JSON verdict.
- **Finalise Verdict** — a code node that parses/clamps/normalises the model output into a stable schema and merges the IOCs, so callers always get the same shape.

## Inputs
| Field | Required | Notes |
|---|---|---|
| `body` | Yes | Plain-text email content. |
| `subject`, `from`, `reply_to` | No | Improve accuracy when supplied. |

## Output (`answer`)
`{ verdict ("phishing"|"suspicious"|"legitimate"), confidence (0–100), risk_score (0–100), indicators[], extracted_urls[], recommended_action, reasoning, iocs }`

## Guardrails
- Treats the email as untrusted data; ignores instructions embedded in it (prompt-injection resistant).
- Never follows or fetches URLs or attachments.
- Redacts credentials, OTPs, and full account numbers in its reasoning.
- Reports uncertainty by lowering confidence instead of fabricating indicators.

## When to route here
Use when you have a raw or user-reported email and need a fast, consistent triage decision — not when you need summarisation, reply drafting, or full header-authentication forensics (SPF/DKIM/DMARC).
