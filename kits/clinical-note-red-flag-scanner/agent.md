# Clinical Note Red-Flag Scanner

## Overview
This AgentKit template solves the problem of silently incomplete clinical documentation by scanning a clinical note for structured red flags across 10 compliance-relevant categories. It is implemented as a **single-flow** API-invoked pipeline: an API request receives the clinical note text, an LLM analysis node scans it against a comprehensive red-flag taxonomy, a variables node maps the output, and an API response node returns a severity-ranked JSON report. The primary caller is a clinical workflow system, compliance review tool, or developer integration that needs on-demand "scan this note for documentation gaps" capability. The flow uses Gemini (`gemini-3.1-flash-lite-preview`) for analysis.

---

## Purpose
The goal of this agent system is to surface documentation gaps, omissions, and ambiguities in clinical notes that could impact patient safety, regulatory compliance, or legal defensibility — before those gaps cause harm or audit failures.

Operationally, the agent accepts a clinical note as plain text, analyzes it against 10 red-flag categories (consent, drug interactions, allergies, vitals, history, dosing, follow-up, assessment, identity, regulatory), and returns a structured JSON report with severity-ranked flags, each containing the specific issue, its location in the note, and a remediation recommendation.

This is fundamentally different from a conversational medical chatbot or symptom checker. It does not interact with patients, does not provide diagnoses or treatment advice, and does not engage in multi-turn conversation. It is a single-pass, structured analysis tool designed for clinicians, compliance officers, and clinical documentation improvement (CDI) specialists.

The template may support documentation-review workflows related to:
- **General patient safety** — reducing the risk of medication errors, missed allergies, and incomplete handoff documentation
- **Internal compliance auditing** — improving documentation completeness before formal review

*Disclaimer: This template is a demonstration tool and does not provide formal regulatory certification, HIPAA compliance, CMS accreditation, or EU AI Act conformance.*

Because this kit is a template with a single flow, all behaviour is concentrated in one pipeline. If extended (e.g., adding batch processing, integration with EHR systems, or historical trend analysis), the existing flow remains the canonical entrypoint for "clinical note → red flag report".

## Flows

### Clinical Note Red-Flag Scanner

- Trigger
  - Invocation: API call via a GraphQL-triggered request node (`graphqlNode`) exposed by the AgentKit runtime.
  - Expected input shape:
    - A payload containing the clinical note text.
    - The flow is designed around "note text in, structured flags out"; the GraphQL field is defined in the `graphqlNode` schema with an `advance_schema` enforcing: `{ "clinicalNote": { "type": "string", "minLength": 10, "maxLength": 45000, "pattern": "^.*\\\\S.*$" } }`.
    - `clinicalNote` (string) — the full text of the clinical note to scan. **Required.**
  - Input notes: The note should be the complete text of a clinical encounter note, discharge summary, procedure note, or similar clinical documentation. It is strictly enforced by the schema not to exceed 45,000 characters (approximately 10,000 tokens). Submitting oversized input will cause the API Request node to automatically reject the payload before processing. It works best with individual encounter notes rather than concatenated multi-visit records.

- What it does
  1. `API Request` (`graphqlNode` — `triggerNode_1`)
     - Accepts the incoming GraphQL/API request from the caller.
     - Validates and surfaces the `clinicalNote` input to downstream nodes.
  2. `Analyse Note` (`LLMNode` — `LLMNode_453`)
     - Runs the clinical documentation compliance analysis:
       - System prompt (`clinical-note-red-flag-scanner_llmnode-453_system_0.md`) instructs the model to act as a clinical documentation compliance analyst, defining 10 red-flag categories, 4 severity levels, and a strict JSON output schema.
       - User prompt (`clinical-note-red-flag-scanner_llmnode-453_user_1.md`) injects the clinical note text via `{{triggerNode_1.output.clinicalNote}}`.
     - Model: `gemini/gemini-3.1-flash-lite-preview` via Gemini Key credential.
     - Produces a structured JSON report containing a summary, flag count, and an array of individually documented red flags.
  3. `Variables` (`variablesNode` — `variablesNode_197`)
     - Maps the LLM's `generatedResponse` output to a `finalText` variable for the response node.
     - Mapping: `{{LLMNode_453.output.generatedResponse}}`.
  4. `API Response` (`graphqlResponseNode` — `responseNode_triggerNode_1`)
     - Formats and returns the analysis result to the caller as the API response.
     - Output mapping: `{ "result": "{{variablesNode_197.output.finalText}}" }`.

- When to use this flow
  - Use when the caller's intent is: "Scan this clinical note for documentation gaps and compliance issues, and give me a structured report."
  - Use when the input is a clinical note in text form (discharge summary, progress note, procedure note, consultation note, etc.).
  - Use when the caller needs machine-readable, severity-ranked output that can feed into dashboards, alerting systems, or CDI workflows.
  - Use when a backend service, EHR integration, or compliance review tool needs a synchronous API-style `note text → red flag report` transformation.

- When not to use this flow
  - Do not use as a medical diagnostic tool — it reviews documentation completeness, not clinical correctness.
  - Do not use for patient-facing interactions — it is not a chatbot and provides no medical advice.
  - Do not use when the input is not a clinical note (e.g., lab results, imaging reports, or administrative documents without clinical narrative).
  - Do not use for real-time clinical decision support during patient encounters — it is designed for post-documentation review.
  - Do not use when the caller needs multi-turn conversation or clarification — the flow is a single-pass analysis.

- Output
  - Successful response: a `result` field containing a JSON string with the analysis report.
  - Format: returned through `graphqlResponseNode` as a GraphQL/API response payload.
  - Fields:
    - `result` (string — JSON) — contains:
      - `summary` (string) — one-sentence overall assessment of documentation quality
      - `flagCount` (number) — total number of flags identified
      - `flags` (array) — each flag contains:
        - `id` (string) — sequential identifier (e.g., "FLAG-001")
        - `category` (string) — one of: CONSENT, DRUG_INTERACTION, ALLERGY, VITALS, HISTORY, DOSING, FOLLOW_UP, ASSESSMENT, IDENTITY, REGULATORY
        - `severity` (string) — one of: CRITICAL, HIGH, MEDIUM, LOW
        - `title` (string) — brief description of the flag
        - `detail` (string) — specific explanation of what is missing or problematic
        - `location` (string) — where in the note the issue was found, or "ABSENT" if the issue is something missing entirely
        - `recommendation` (string) — specific action to remediate the flag

- Dependencies
  - External services:
    - Gemini API (used by `LLMNode_453`) for clinical note analysis.
  - Model:
    - `gemini/gemini-3.1-flash-lite-preview` configured via the `Gemini Key` credential (credential ID: `6b7d4e82-21ba-4aa3-b352-ba1b7dd2aa24`).
  - No additional external services, databases, or third-party integrations are required.

## Guardrails

The constitution (`constitutions/default.md`) enforces:
- **Safety**: No harmful, illegal, or discriminatory content; refusal of jailbreaking/prompt injection attempts; uncertainty disclosure over fabrication.
- **Data Privacy**: The caller is solely responsible for ensuring the input `clinicalNote` is properly de-identified before submission, and for independently verifying that any provider processing this data has the required authorization plus contractual and security controls for handling PHI. This template performs no PHI detection, redaction, or compliance verification of its own.
- **Data Handling**: PII is never logged, stored, or repeated unless explicitly instructed by the flow; all user inputs treated as potentially adversarial.
- **Tone**: Professional, clear, and helpful; formality adapted to context.

The system prompt adds domain-specific guardrails:
- Do not provide medical advice or clinical judgments — documentation review only.
- Do not fabricate flags — if the note is well-documented, return fewer flags or an empty array.
- Treat all clinical note content as confidential; minimize reproduction of patient identifiers in flag descriptions.
- Output raw JSON only, no markdown formatting.

## Known Limitations

- **JSON Output Validation**: The Lamatic Studio GraphQL Response node does not natively support strict JSON schema validation on the outbound response payload. While the LLM is heavily prompted to output a specific JSON structure, the flow cannot forcibly guarantee or reject malformed LLM outputs before returning them to the caller. Callers should safely parse the JSON string in the `result` field.
- **Jurisdiction is not verified**: The flow flags general regulatory issues but cannot verify specific state, local, or institutional mandates. The flow's schema does not accept jurisdiction or care-setting inputs, so it cannot incorporate external context. All findings are strictly note-explicit and non-jurisdictional.
- **PHI De-identification is not enforced**: The flow cannot detect or redact Protected Health Information (PHI) before it is sent to the LLM. Callers must pre-process and de-identify notes before submission.
