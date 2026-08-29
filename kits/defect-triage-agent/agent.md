# Manufacturing Defect Triage Agent

**Purpose:** Given a written defect observation from a manufacturing quality control inspection, assess its severity, hypothesize the root cause, recommend an action, and explain the reasoning — as structured JSON.

## Overview

This agent is built for factories, production lines, and manufacturing QC teams who need to quickly triage defect reports without a human manually judging severity for every observation. It's designed to sit downstream of either a human inspector or an automated vision system (e.g. a YOLOv8-based defect detector) — either can produce the text description this agent consumes.

## Flow

**defect-triage**: `API Request → Generate JSON → API Response`

1. Accepts `defectDescription` (string) — a free-text defect observation
2. A Gemini 3.5 Flash Lite model, constrained to a structured output schema, assesses severity, root cause, recommended action, and reasoning
3. Returns the structured result directly

## Guardrails

- The model is instructed to base its assessment strictly on what the description states, never inventing details not present in the input
- If the input is vague or incomplete, the agent defaults to `severity: medium` and `recommended_action: escalate` rather than guessing confidently
- Output is constrained to a fixed schema (severity, root_cause_hypothesis, recommended_action, reasoning) so downstream systems can rely on consistent structure

## Integration

Intended to be called via API with a single `defectDescription` field. Fits naturally as a step after an image-based defect detector, or as a direct entry point for manual QC notes.