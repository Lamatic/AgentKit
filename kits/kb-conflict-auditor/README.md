# KB Conflict Auditor

Finds facts that contradict each other across a documentation set, for example a request timeout of `30s` in the API guide and `60 seconds` in the SDK guide. Code extracts the facts, an AI model judges each suspicious pair, and code verifies every answer before anything is reported.

Documentation drifts. A setting gets changed in one file and not in the others, and the next person or RAG chatbot that reads the folder gets two different answers. Existing kits ingest documents and answer questions about them. This kit checks whether the documents agree with each other.

## What you get

- A **Lamatic flow** (`audit-kb`) that takes a set of documents and returns confirmed conflicts, each with evidence (file, line, date), the authoritative source, and a ready-to-apply patch.
- A **web app** where you paste a public GitHub repo URL (or a JSON payload) and read the findings.
- A **GitHub Action** that audits `docs/` on every pull request and comments the findings.
- A small **benchmark** with seeded conflicts and decoys, so you can measure what the tool finds and what it wrongly flags.

## How it works

```
documents_json (JSON array of { path, content })
        |
        v
 Extract Candidates   code     finds "name: value / name = value / name is value" facts,
        |                      normalizes units, pairs the same setting across files
        v
 Has Candidates       branch   no candidates -> End (the AI is never called)
        |
        v
 Judge Conflicts      AI       Generate JSON: is it a real conflict, how severe, drafted fix
        |
        v
 Verify Findings      code     decides authority from dates, drops patches that quote
        |                      text that is not in the file, discards unknown candidate IDs
        v
 API Response         findings, stats, candidate_count, docs_scanned
```

**Design rule: code decides, the model advises.**

- Authority is never the model's call. The document with the newer `last_updated`, `updated_at` or `date` front-matter value wins. If dates are missing or equal, the answer is `unclear` and no patch is offered.
- A patch is kept only if it targets the outdated file and quotes text that really exists in it.
- Documents are untrusted input. The model sees only the matched line of each document, framed as data, and its output is re-checked by code. A prompt-injection line inside a document cannot change authority or invent a patch.
- The model call is bounded: at most 10 candidate pairs per audit, ranked so that pairs with differing dates come first.

## Example

Input documents:

```
docs/api.md   (last_updated: 2026-01-15)   The request timeout = 30s.
docs/sdk.md   (last_updated: 2024-05-10)   The default request timeout is 60 seconds.
```

Finding returned:

```
request_timeout   Medium
  docs/api.md  line 5  (2026-01-15)  The request timeout = 30s.
  docs/sdk.md  line 5  (2024-05-10)  The default request timeout is 60 seconds.
  Authoritative: docs/api.md (newer last_updated date)
  - The default request timeout is 60 seconds.
  + The default request timeout is 30s.
```

## Quick start

Prerequisites: Node.js 20 or newer, a [Lamatic](https://lamatic.ai) account, and an API key for the model provider you pick inside Lamatic (the flow is tested with Gemini 3.1 Flash Lite).

1. **Set up the flow.** Flows are stored in `flows/` exactly as Lamatic Studio exports them, with prompts, scripts and model settings next to them. Create a project in [Lamatic Studio](https://studio.lamatic.ai), bring in the `audit-kb` flow, pick a model credential, and deploy it.
2. **Collect your values.** From the deployed flow: the API URL, project ID and flow ID. From Studio settings: an API key.
3. **Run the app.**

   ```bash
   cd kits/kb-conflict-auditor/apps
   cp .env.example .env.local        # then fill in the values
   npm install
   npm run dev                       # http://localhost:3000
   ```

   Without any Lamatic values the app runs in **demo mode** and shows sample findings with a clear banner. It never presents sample data as the result for your docs.

| Variable | Required | Purpose |
|---|---|---|
| `LAMATIC_API_URL` | yes | Your Lamatic project endpoint |
| `LAMATIC_PROJECT_ID` | yes | Your Lamatic project ID |
| `LAMATIC_API_KEY` | yes | Your Lamatic API key |
| `AUDIT_KB_FLOW_ID` | yes | ID of the deployed `audit-kb` flow |
| `GITHUB_TOKEN` | no | Raises GitHub's rate limit from 60 to 5,000 requests per hour and allows private repos |

## Using it

**Web app.** Paste a repository URL such as `https://github.com/owner/repo/tree/main/docs`, or switch to "Paste JSON". The app downloads `.md`, `.mdx` and `.txt` files (at most 60 files, 100 KB each, 1 MB in total) and shows skipped files and truncation notices.

**API.** The flow takes one input, `documents_json`, a string containing a JSON array of `{ "path": "...", "content": "..." }`. It returns:

```json
{
  "findings": [ { "id": "c1", "key": "request_timeout", "severity": "Medium", "authoritative_source": "docs/api.md",
                  "evidence": { "docA": {}, "docB": {} }, "patch": { "file_to_update": "docs/sdk.md", "current_text": "", "replacement_text": "" } } ],
  "stats": { "candidates": 2, "judged": 2, "confirmed": 2, "dismissed": 0, "patches_withheld": 0 },
  "candidate_count": 2,
  "docs_scanned": 3
}
```

When no candidates exist, `findings` and `stats` are empty strings and the model is never called.

**GitHub Action.** See [`github-action/README.md`](github-action/README.md). It audits `docs/` on pull requests, shows only findings that touch files changed in the PR, and fails the check at severity `High` or above (configurable). Pull requests from forks have no access to secrets, so the audit is skipped there instead of failing.

## Testing

```bash
cd apps
npm test                       # unit tests (GitHub fetcher, result parsing)
node benchmark/run.mjs         # offline benchmark of the shipped extractor, no account needed
node benchmark/run.mjs --live  # same corpus through your deployed flow (needs apps/.env.local)
cd ../github-action && node --test kb-audit.test.mjs
```

The benchmark corpus has 10 documents with three seeded conflicts, six decoys and two conflicts the extractor cannot see. Offline result: all three seeded conflicts found (9 candidate pairs), none of the six decoys flagged. The decoys include `10 min` against `600s`, `50 MB` against `50MB`, a mobile-specific timeout that shares words with the main one, and an unrelated unitless number in a code sample. The benchmark fails if any of these regress.

## Limits

- It only sees **numeric settings** written as `name: value`, `name = value` or `name is value`. Prose contradictions ("supports X" against "does not support X") are not detected.
- A conflict is found only when both files use the same setting name. In the benchmark, "Max upload size: 50 MB" against "Upload limit raised to 100 MB" and "connection pool" against "pool size" are **missed**. That is 2 of the 5 real conflicts in the corpus.
- Authority needs a `last_updated`, `updated_at` or `date` front-matter value. Without it the tool says `unclear`.
- It reports conflicts and drafts patches. It never edits your files.
- The model's severity rating can vary between runs.

## Project structure

```
flows/                 audit-kb flow, as exported from Lamatic Studio
prompts/ scripts/      prompts and code nodes referenced by the flow
model-configs/         model settings
constitutions/         agent guardrails
apps/                  Next.js web app, GitHub fetcher, benchmark, tests
github-action/         workflow and script for pull requests
```

## Security

- Never commit `.env.local`. Only `.env.example` (placeholders) is tracked.
- Document text is treated as untrusted and passed to the model as data.
- The server action never returns environment values in errors.
- The Action uses `pull_request`, not `pull_request_target`, so untrusted code never sees your secrets.
