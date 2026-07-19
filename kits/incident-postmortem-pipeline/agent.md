# Incident Postmortem Pipeline

## Overview

An agentic pipeline that turns raw, unstructured production incident logs into a structured, evidence-graded postmortem — with no dependency on pre-existing runbooks, an incident ID, or repo/commit access. Paste a raw log dump and get back ranked root causes, an immediate mitigation checklist, a non-technical stakeholder update, and an assembled postmortem draft.

## Purpose

The first minutes of an incident are dominated by noisy, unstructured signal: stack traces, timestamps, service names, retries, and unrelated warnings mixed together. Most incident-response tooling assumes this noise has already been triaged into a structured alert. This kit solves the step *before* that: converting raw log noise into the structured evidence a human (or another tool) can act on.

## Flow Architecture

Single flow, 5 sequential/parallel LLM steps:

1. **Log Extractor** — parses raw noisy logs into structured JSON (errors, affected services, time window, notable events). No root-cause speculation at this stage.
2. **Root Cause Ranker** — produces ranked root-cause hypotheses from the extracted signals. Every hypothesis is tagged **Evidence-based** (directly supported by log data), **Inferred** (plausible but not directly evidenced), or **Unknown** (insufficient data) — with reasoning that cites specific log signals.
3. **Mitigation Checklist** — immediate, actionable mitigation steps derived from the ranked hypotheses.
4. **Stakeholder Summary** — a plain-English, non-technical status update, generated in parallel with the mitigation checklist, both sourced from the Root Cause Ranker's output.
5. **Postmortem Assembler** — combines the outputs of steps 2–4 into one coherent markdown postmortem document, preserving the evidence tags verbatim.

## Guardrails

- The Log Extractor is explicitly instructed not to infer root cause — it only reports what is directly present in the logs, keeping evidence and inference cleanly separated across pipeline stages.
- The Root Cause Ranker must justify every hypothesis with reasoning tied to specific log evidence, and must use the `Unknown` tag rather than fabricate confidence when evidence is insufficient.
- The Postmortem Assembler is instructed to preserve evidence tags exactly as produced upstream, rather than smoothing them into uniform confident language.

## Integration Reference

- **Trigger:** API Request (`logs`, `serviceName`, `recentDeployTime`)
- **Output:** Single `postmortem` field (markdown string) returned via API Response
- See `flows/incident-postmortem-pipeline.ts` for the full node graph and `@reference` paths to prompts and model configs.