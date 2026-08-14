# Interview Scorecard Calibrator

## Overview
This kit helps hiring managers reconcile fragmented multi-interviewer feedback into a calibrated competency scorecard, disagreement map, hire/no-hire recommendation, and an internal decision-summary email draft. It is a single Lamatic flow invoked by the included Next.js app.

## Purpose
After panel interviews, notes arrive in different formats with uneven scoring rigor. Manual reconciliation is slow and inconsistent. This agent turns a shared rubric plus interviewer notes into a structured decision aid so committees can focus on evidence and disagreements instead of formatting.

## Flows

### `calibrate-scorecard`

- Trigger: on-demand API execution from the kit UI or any Lamatic SDK caller
- Inputs:
  - `job_title` (required)
  - `level` (optional)
  - `rubric` (required) — competency list with weights/expectations
  - `interviewer_notes` (required) — notes from 2–6 interviewers
- Pipeline:
  1. **Normalize Inputs** (`codeNode`) — validates and packages context
  2. **Calibrate Scorecard** (`InstructorLLMNode`) — structured JSON scorecard
  3. **Compose Brief** (`LLMNode`) — markdown hiring-committee brief
  4. **API Response** — returns `scorecard` + `brief`
- Outputs:
  - `scorecard` — competencies, disagreements, recommendation, confidence, follow-ups, email draft
  - `brief` — readable markdown summary for the hiring committee

## Guardrails
- Decision aid only — humans make the final hiring call
- Do not fabricate interview evidence
- Avoid protected-class inferences
- Keep candidate/interviewer content confidential
- See `constitutions/default.md`

## Environment
- `LAMATIC_API_URL`
- `LAMATIC_PROJECT_ID`
- `LAMATIC_API_KEY`
- `CALIBRATE_SCORECARD_FLOW_ID`
