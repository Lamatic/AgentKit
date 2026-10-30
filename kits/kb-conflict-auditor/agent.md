# KB Conflict Auditor

## Purpose

Audits a documentation set for facts that contradict each other and reports only what code has verified. It does not answer questions about the documents and does not edit them.

## Flow

One flow, `audit-kb`.

| Step | Node | Responsibility |
|---|---|---|
| 1 | API Request | Receives `documents_json`, a JSON array of `{ path, content }` |
| 2 | Extract Candidates (Code) | Finds numeric settings, normalizes units, pairs the same setting across files, keeps at most 10 pairs |
| 3 | Has Candidates (Condition) | Continues only when `candidate_count > 0`, otherwise ends without calling the model |
| 4 | Judge Conflicts (Generate JSON) | Decides per pair whether it is a real conflict, rates severity, drafts a replacement |
| 5 | Verify Findings (Code) | Decides authority from dates, validates patches against the file text, drops unknown candidate IDs |
| 6 | API Response | Returns `findings`, `stats`, `candidate_count`, `docs_scanned` |

## Inputs

- `documents_json` (string): JSON array of `{ "path": string, "content": string }`. Up to 200 documents of up to 200,000 characters each.
- Dates are read from front matter: `last_updated`, `updated_at` or `date`, formatted `YYYY-MM-DD`.

## Outputs

- `findings`: confirmed conflicts. Each has `id`, `key`, `severity` (Critical, High, Medium, Low), `summary`, `authoritative_source` (a file path or `unclear`), `authority_basis`, `reasoning`, `evidence` (both files with line, date and text), `patch` (or `null`) and `patch_note`.
- `stats`: counts of candidates, judged, confirmed, dismissed, discarded unknown IDs, authority overrides and withheld patches.
- `candidate_count`, `docs_scanned`.
- When there are no candidates, `findings` and `stats` come back as empty strings.

## Guardrails

- The model never decides which document is authoritative. Dates do. Missing or equal dates give `unclear` and no patch.
- A patch is returned only when it targets the outdated file and quotes text that exists in that file.
- Document text is untrusted. The model receives only the matched line of each document, as data, and is told to ignore instructions inside it. Code verifies the authority, patch target, and exact quote against both the raw file and conflicting line; suggested replacement text remains advisory and needs human review.
- The tool states its limits: it sees numeric settings only, and a conflict is found only when both files use the same setting name.

## Integrations

- **Web app** (`apps/`): GitHub repo URL or pasted JSON, with demo mode when no Lamatic credentials are set.
- **GitHub Action** (`github-action/`): audits `docs/` on pull requests and comments the findings.

## Configuration

`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, `AUDIT_KB_FLOW_ID`, and optionally `GITHUB_TOKEN`.

## Model

The flow is tested with Gemini 3.1 Flash Lite. The model credential is chosen in Lamatic Studio and can be swapped without code changes, as long as the model supports structured JSON output.
