# license-compliance-auditor

## Overview

The License Compliance Auditor is an automated assistant that reviews a project's declared open-source dependency licenses, flags copyleft/GPL-family risk against a configurable allow-list, and generates a structured compliance report for engineering teams.

## Core Capabilities

- **License Classification:** Deterministically classifies each dependency as `OK`, `BLOCKED` (copyleft/high-risk), or `REVIEW_NEEDED` (missing or unrecognized license).
- **Configurable Allow-List:** Merges a sensible default allow-list (MIT, Apache-2.0, BSD, ISC, etc.) with an optional caller-supplied allow-list.
- **Compliance Report Generation:** Converts the structured classification into a clear, actionable markdown report with remediation guidance, using an LLM.

## Flow Architecture

1. **Input Payload:** Receives `dependency_licenses` (a JSON array of dependency objects) and an optional `allow_list`. Each dependency needs a `name`/`Name`, `version`/`Version`, and `license`/`License` field — both casings are accepted, so `pip-licenses --format=json`'s native capitalized output (`Name`/`Version`/`License`) and a lowercase `{name, version, license}` shape (e.g. hand-built from `license-checker --json`) both work without pre-transforming field names.
2. **Code Node:** Parses the input, classifies every dependency deterministically, and outputs a structured JSON findings report.
3. **LLM Node:** Consumes the findings securely and writes a markdown compliance report.

## Guardrails & Security

- **Prompt Hardening:** Treats incoming dependency names/license strings strictly as untrusted data to protect against prompt injection. `<`/`>` characters are escaped in every dependency field before they reach the report prompt, so a crafted value can never break out of the data tag boundary.
- **Strict Typing:** Validates input structure before processing and rejects missing/empty/malformed input with descriptive errors.
- **Not Legal Advice:** Output is automated screening guidance against a configured allow-list, not a legal determination. `BLOCKED` is a conservative policy classification — final decisions require legal/compliance sign-off.
