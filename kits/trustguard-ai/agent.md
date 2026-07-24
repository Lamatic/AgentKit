# TrustGuard AI — Agent Reference

## Overview

TrustGuard AI is a sequential multi-agent pipeline built on Lamatic AI flows. It takes suspicious content (an email, SMS, URL, document, or plain text) as input and runs it through four specialized LLM agents in order. Each agent has a single, clearly scoped responsibility and passes its structured output to the next stage. The pipeline ends with a final JSON response containing the full investigation result.

The design philosophy is strict separation of concerns. No single agent guesses, summarizes, and classifies all at once. Each one does exactly one job, which keeps outputs predictable and makes the system easy to debug or extend.

---

## Purpose

- Detect fraud, phishing, scams, and social engineering attempts in user-submitted content
- Provide a structured, machine-readable investigation result rather than a free-text opinion
- Support integration into any product that needs automated trust scoring on user-submitted content
- Work across multiple input types and languages without requiring separate flows for each

---

## Flow ID

The flow is registered in `lamatic.config.ts` under the step ID `trustguard-ai`. The environment variable `TRUSTGUARD_FLOW_ID` must be set to the deployed flow ID from your Lamatic project dashboard.

---

## Agent Pipeline

### Stage 1: Investigation Planner (`InstructorLLMNode_381`)

**Purpose:** Initialize the investigation and normalize the raw input.

**Responsibilities:**
- Create a new investigation object with a unique ID, title, category, status, and detected language
- Clean and normalize the user's raw input text
- Write a concise summary of what the content appears to be
- Detect the input type (email, SMS, URL, document, text) from context
- Always set `status` to `initialized` and `workflow` to `trustguard-ai`

**Strict limits:** This agent must NOT determine whether the content is a scam, extract entities, classify threats, or generate recommendations. It only initializes and normalizes.

**Output shape:**
```json
{
  "investigation": {
    "id": "string",
    "title": "string",
    "category": "string",
    "status": "initialized",
    "workflow": "trustguard-ai",
    "language": "string"
  },
  "normalized": {
    "clean_text": "string",
    "summary": "string",
    "detected_input_type": "string"
  }
}
```

---

### Stage 2: Evidence Extractor (`InstructorLLMNode_849`)

**Purpose:** Extract all observable structured entities from the normalized content.

**Responsibilities:**
- Pull every URL, domain, email address, phone number, money amount, brand name, urgency phrase, and attachment reference present in the text
- Detect all languages used in the content
- Extract named entities (people, organizations, locations)
- Return only what is present — never invent or infer

**Strict limits:** This agent must NOT re-normalize the input, perform classification, score risk, or recommend actions. It only extracts.

**Output shape:**
```json
{
  "evidence": {
    "urls": ["string"],
    "domains": ["string"],
    "emails": ["string"],
    "phone_numbers": ["string"],
    "money_amounts": ["string"],
    "brands": ["string"],
    "urgency_phrases": ["string"],
    "attachments": ["string"],
    "languages": ["string"],
    "entities": ["string"]
  }
}
```

---

### Stage 3: Threat Analyzer (`InstructorLLMNode_847`)

**Purpose:** Evaluate the extracted evidence and score the threat level.

**Responsibilities:**
- Classify every extracted indicator as HIGH, MEDIUM, or LOW risk
- Compute an overall `risk_score` (0 to 100) and `confidence` (0 to 100) based on the evidence
- Derive a `severity` level from the risk score (LOW / MEDIUM / HIGH / CRITICAL)
- Match the evidence against known threat patterns (e.g. Lottery Scam, Credential Harvesting, Business Email Compromise, Tech Support Scam, Investment Fraud, Remote Access Scam)
- Note any missing information that would help confirm or rule out a threat
- Write a concise `reasoning_summary` explaining what was found and why it looks suspicious

**Strict limits:** This agent must NOT rewrite the investigation, re-extract entities, or produce a final verdict. It only analyzes evidence.

**Output shape:**
```json
{
  "analysis": {
    "risk_score": 0,
    "confidence": 0,
    "severity": "LOW | MEDIUM | HIGH | CRITICAL",
    "indicators": {
      "high": ["string"],
      "medium": ["string"],
      "low": ["string"]
    },
    "matched_patterns": ["string"],
    "missing_information": ["string"],
    "reasoning_summary": "string"
  }
}
```

---

### Stage 4: Decision Engine (`InstructorLLMNode_352`)

**Purpose:** Produce the final verdict and recommended action.

**Responsibilities:**
- Classify the content into one of the following exact values:
  - `SCAM`: Fraudulent schemes (e.g., lottery, investment)
  - `PHISHING`: Attempts to steal sensitive information
  - `MALWARE`: Content delivering malicious software
  - `SPAM`: Unsolicited bulk messaging
  - `CREDENTIAL_THEFT`: Targeted credential harvesting
  - `BUSINESS_EMAIL_COMPROMISE`: CEO fraud or invoice redirection
  - `LEGITIMATE`: Safe, verified content
  - `SUSPICIOUS`: Ambiguous content requiring caution
  - `UNKNOWN`: Insufficient evidence to classify
- Write a clear `final_verdict` statement in plain language
- Recommend a concrete `recommended_action` the user should take
- Explain the `decision_reason` based on the analysis
- Set a `priority` level (LOW, MEDIUM, HIGH, CRITICAL)
- Flag `human_review: true` if the confidence is low or the evidence is ambiguous

**Strict limits:** This agent must NOT re-extract entities, re-score indicators, or re-normalize the input. It only decides.

**Output shape:**
```json
{
  "decision": {
    "classification": "string",
    "final_verdict": "string",
    "recommended_action": "string",
    "decision_reason": "string",
    "priority": "string",
    "human_review": false
  }
}
```

---

## Guardrails

All four agents share these behavioral rules, enforced via system prompts and the constitution:

- Return only valid JSON matching the provided output schema — never return markdown, prose, or explanation
- Never invent information not present in the input
- Never carry out a responsibility that belongs to another stage
- Leave fields empty or as empty arrays when information is unavailable — do not guess
- Never expose or repeat sensitive personal data beyond what is structurally required by the schema

---

## Flow Input Schema

The trigger node accepts the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `input_type` | string | Yes | One of: `email`, `sms`, `url`, `document`, `text` |
| `content` | string | Yes | The raw suspicious content to analyze |
| `attachment_url` | string | No | Optional URL to an attached file |
| `language` | string | No | Language hint: `auto`, `en`, `hi`, `bn` |
| `memory_enabled` | bool | No | Always passed as `false` — memory is disabled |
| `tenant_id` | string | No | Tenant identifier, defaults to `default` |
| `user_id` | string | No | User identifier, defaults to `anonymous` |

---

## Integration Reference

The flow is called from the Next.js app via a server action in `apps/actions/runInvestigation.ts` using the `lamatic` SDK:

```ts
const response = await lamatic.executeFlow(flowId, payload);
```

The full response type is defined in `apps/types/response.ts` as `InvestigationResponse`.

For setup instructions, environment variables, and deployment steps, refer to the [README](./README.md).