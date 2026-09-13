# License Compliance Auditor Kit

An automated workflow template built on Lamatic that scans a project's dependency licenses, flags copyleft/GPL-family risk against a configurable allow-list, and generates an action-oriented compliance report.

## Features

- **Deterministic License Classifier:** Classifies every dependency as `OK`, `BLOCKED`, or `REVIEW_NEEDED` using custom JavaScript execution logic (`codeNode_210`) — no hallucinated verdicts. Understands SPDX compound expressions (`"GPL-3.0 OR MIT"`, `"Apache-2.0 AND MIT"`), not just single license ids.
- **Configurable Allow-List:** Ships with a sensible default allow-list (MIT, Apache-2.0, BSD, ISC, 0BSD, Unlicense, CC0-1.0) and merges in any caller-supplied allow-list.
- **LLM Compliance Report Generation:** Converts the structured findings into a clear, markdown-formatted compliance report using Gemini.
- **GraphQL Integration:** Programmatically triggerable via Lamatic's GraphQL endpoint.
- **CI Ready:** Designed to run in CI/CD pipelines to automatically comment license-risk analysis on Pull Requests before a new dependency ships.

---

## The Problem

Teams add open-source dependencies constantly, but rarely check what license each one carries. A single transitive GPL/AGPL dependency can impose reciprocal source-disclosure obligations on an entire proprietary codebase — a risk that's invisible until legal or a customer's due-diligence team finds it. Manually auditing `package.json`/`requirements.txt` against a license policy doesn't scale and is easy to skip under deadline pressure.

This kit acts as an automated license-compliance guardrail: it consumes a machine-readable dependency/license list (the standard output shape of tools like `license-checker` or `pip-licenses`), classifies every entry deterministically, and produces a human-readable report explaining exactly what's blocked, what needs manual review, and what to do about it.

---

## How It Works

1. **Input:** The flow takes `dependency_licenses` and an optional `allow_list` (comma-separated SPDX ids) via GraphQL. `dependency_licenses` is declared as a `string` in the trigger schema, so over the wire it must be a **JSON-encoded string** containing an array of `{name, version, license}` — not a nested JSON array. See `samples/test_flow.js`, which reads the sample fixture file as raw text (already a JSON string) and sends it as-is.
2. **Classification (`codeNode_210`):** Custom JS logic parses that string, merges the default allow-list with any caller-supplied one, and classifies every dependency as `OK`, `BLOCKED` (copyleft/high-risk), or `REVIEW_NEEDED` (missing/unrecognized license) — correctly handling SPDX `OR`/`AND` compound expressions (dual-licensed packages are `OK` if any option is allow-listed; compound `AND` expressions are `BLOCKED` if any component is copyleft).
3. **Report Generation (`LLMNode_430`):** Gemini consumes the structured findings and writes a full compliance report.
4. **Output:** Returns the structured findings (`has_violations`, `total_deps`, `blocked_count`, `review_count`, `findings[]`) alongside a ready-to-post markdown `report` — the structured fields let a CI step gate on `has_violations` programmatically without parsing markdown, while `report` is for humans.

```text
dependency_licenses + allow_list ──▶ codeNode_210 (JS classifier) ──▶ Structured Findings ──▶ LLMNode_430 (Gemini) ──▶ Markdown Compliance Report
```

---

## Tradeoffs & Assumptions

- **Deterministic Classification:** License classification is computed via deterministic JavaScript (`codeNode_210`), not the LLM — this avoids hallucinated license verdicts. The LLM's job is purely to explain and format the already-computed findings.
- **No Live Registry Lookup:** The flow trusts the `license` field passed in on each dependency object; it does not call out to npm/PyPI registries itself. Pair it with a tool that already resolves licenses (`license-checker --json`, `pip-licenses --format=json`, a Syft/CycloneDX SBOM, etc.) as an upstream step.
- **Conservative Default Allow-List:** Only well-known permissive licenses are pre-approved. Anything unrecognized is routed to `REVIEW_NEEDED` rather than silently allowed.
- **Flat SPDX Expressions Only:** `classify()` parses flat `"A OR B"` / `"A AND B"` expressions with correct precedence, but does not parse nested/parenthesized or mixed `AND`+`OR` expressions (e.g. `"GPL-3.0 AND (MIT OR Apache-2.0)"`) — those are conservatively routed to `REVIEW_NEEDED` rather than guessed at, since a naive split could silently drop a copyleft obligation. Upgrade to a real precedence-aware SPDX expression parser if nested expressions turn out to be common in your dependency tree.

---

## Disclaimer

This kit provides **automated screening guidance, not legal advice**. A `BLOCKED` verdict is a conservative policy classification against the configured allow-list — not a deterministic legal prohibition. Real-world license risk also depends on license *version*, how the dependency is used (static/dynamic linking, modification, network use), your distribution model, and applicable exceptions. Always get a final sign-off from legal/compliance before shipping — use this report to triage what needs their attention, not to replace it.

---

## Usage Example

### 1. Running the Local Classifier Self-Check

```bash
node samples/test_classifier.js
```

### 2. Sample Input & Output

**`dependency_licenses` tested** (see `samples/sample_dependency_licenses.json`):

```json
[
  { "name": "react", "version": "18.3.1", "license": "MIT" },
  { "name": "express", "version": "4.19.2", "license": "MIT" },
  { "name": "lodash", "version": "4.17.21", "license": "MIT" },
  { "name": "chalk", "version": "5.3.0", "license": "Apache-2.0" },
  { "name": "readline-sync", "version": "1.4.10", "license": "MIT" },
  { "name": "gnu-diff-tool", "version": "2.1.0", "license": "GPL-3.0" },
  { "name": "some-internal-fork", "version": "0.0.1", "license": "" }
]
```

**API Response Shape** (`findings` abbreviated below to the 2 non-`OK` entries for brevity — the real response includes all 7):

```json
{
  "has_violations": true,
  "total_deps": 7,
  "blocked_count": 1,
  "review_count": 1,
  "findings": [
    { "name": "gnu-diff-tool", "version": "2.1.0", "license": "GPL-3.0", "status": "BLOCKED", "reason": "'GPL-3.0' is a copyleft license that may impose reciprocal obligations on this project." },
    { "name": "some-internal-fork", "version": "0.0.1", "license": "unknown", "status": "REVIEW_NEEDED", "reason": "No license declared for this dependency." }
  ],
  "report": "### 1. Status\n..."
}
```

**The `report` field, rendered:**

````markdown
### 1. Status
- **Overall Status:** ⚠️ VIOLATIONS DETECTED
- **Summary:** 5 of 7 dependencies use approved permissive licenses; one copyleft dependency and one dependency with no declared license need attention before this can ship.

---

### 2. Blocked Dependencies
1. **gnu-diff-tool@2.1.0** — `GPL-3.0`. GPL-3.0 is a strong copyleft license: distributing a derivative work may require releasing your combined source code under the same terms.

---

### 3. Needs Manual Review
1. **some-internal-fork@0.0.1** — no license declared. Cannot confirm usage rights without checking the source or contacting the maintainer.

---

### 4. Compliant Summary
- 5 of 7 dependencies are compliant: `react` (MIT), `express` (MIT), `lodash` (MIT), `chalk` (Apache-2.0), `readline-sync` (MIT).

---

### 5. Remediation Steps
- **gnu-diff-tool:** Find a permissively-licensed alternative, isolate it behind a service boundary instead of linking it in-process, or get legal sign-off before shipping.
- **some-internal-fork:** Confirm the license with the maintainer/source, or remove it if usage rights can't be established.

---

### 6. Conclusion
- **Blocked pending review** — do not ship until `gnu-diff-tool` is replaced or cleared, and `some-internal-fork`'s license is confirmed.
````

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- Active Lamatic AI Studio account and deployed workflow

### 1. Configure Environment Variables

```bash
cp samples/.env.example samples/.env
# then fill in LAMATIC_API_URL and LAMATIC_API_KEY from Settings → API Keys
```

### 2. Run the Local Classifier Self-Check (no deployment needed)

```bash
node samples/test_classifier.js
```

### 3. Run the Live Flow Smoke Test (requires a deployed flow)

```bash
node samples/test_flow.js
```

---

## Project Structure

```text
kits/license-compliance-auditor/
├── lamatic.config.ts        # Project metadata, steps, and links
├── agent.md                 # Agent capability and guardrails document
├── README.md                # Kit setup and integration guide
├── .gitignore                # Ignored local files
├── flows/                   # Exported flow definition files (.ts)
├── prompts/                 # Externalized prompt templates (.md)
├── scripts/                 # Externalized code node logic (.ts)
├── model-configs/           # Externalized LLM model configuration (.ts)
├── constitutions/           # Safety and operational guardrails (.md)
└── samples/
    ├── .env.example              # Sample environment variables
    ├── sample_dependency_licenses.json  # Realistic fixture (MIT/Apache/GPL/missing)
    ├── test_classifier.js        # Local, no-deploy-needed self-check
    └── test_flow.js              # Live integration runner against a deployed flow
```

---

## Contributing & Community

This kit is part of the [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) repository. Please refer to [CONTRIBUTING.md](../../CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for contribution guidelines and community standards.
