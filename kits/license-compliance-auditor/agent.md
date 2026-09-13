# license-compliance-auditor

## Overview

The License Compliance Auditor is an automated assistant that reviews a project's declared open-source dependency licenses, flags copyleft/GPL-family risk against a configurable allow-list, and generates a structured compliance report for engineering teams.

## Core Capabilities

- **License Classification:** Deterministically classifies each dependency as `OK`, `BLOCKED` (copyleft/high-risk), or `REVIEW_NEEDED` (missing or unrecognized license).
- **Configurable Allow-List:** Merges a sensible default allow-list (MIT, Apache-2.0, BSD, ISC, etc.) with an optional caller-supplied allow-list.
- **Compliance Report Generation:** Converts the structured classification into a clear, actionable markdown report with remediation guidance, using an LLM.

## Flow Architecture

1. **Input Payload:** Receives `dependency_licenses` (a JSON array of `{name, version, license}`, e.g. the output of `license-checker --json` or `pip-licenses --format=json`) and an optional `allow_list`.
2. **Code Node:** Parses the input, classifies every dependency deterministically, and outputs a structured JSON findings report.
3. **LLM Node:** Consumes the findings securely and writes a markdown compliance report.

## Guardrails & Security

- **Prompt Hardening:** Treats incoming dependency names/license strings strictly as untrusted data to protect against prompt injection.
- **Strict Typing:** Validates input structure before processing and rejects missing/empty/malformed input with descriptive errors.
