# api-breaking-change-detector

## Overview

The API Breaking Change Detector is an automated assistant designed to compare v1 and v2 REST API JSON schemas, detect breaking modifications (such as removed endpoints, type changes, or missing required fields), and generate structured developer migration guides.

## Core Capabilities

- **Schema Diffing:** Programmatically extracts and compares two versions of API payloads.
- **Breaking Change Categorization:** Classifies modifications into critical, warning, and safe updates.
- **Migration Guide Generation:** Automatically drafts technical migration documentation for developers using Gemini.

## Flow Architecture

1. **Input Payload:** Receives `v1_schema` and `v2_schema` JSON inputs.
2. **Code Node:** Parses schemas, computes programmatic field-level differences, and outputs a structured JSON diff.
3. **LLM Node:** Consumes the JSON diff securely and structures a markdown migration report.

## Guardrails & Security

- **Prompt Hardening:** Treats incoming schema keys and values strictly as untrusted data to protect against prompt injection.
- **Strict Typing:** Validates input structure before processing to handle missing fields or unexpected formats cleanly.
