# DevDiary Agent

## Overview

DevDiary is a personal work-journal agent for software developers. It converts raw git activity into human-readable journal entries by summarizing the actual code diffs — not the commit messages — and makes that history queryable through retrieval-augmented chat. The result is a cross-project memory: "what did I work on last month?" gets a concrete, dated, per-project answer.

## Purpose

Developers working across multiple repositories lose track of what they did and when. Commit history exists but is fragmented per-repo and written in unreliable shorthand ("fix", "wip"). DevDiary exists to (1) produce a trustworthy record of work derived from diffs, and (2) make that record answerable in natural language across all projects at once.

## Flows

### `devdiary-log` — journal writer + indexer

- **Trigger:** API request (realtime) with `project`, `repo`, `branch`, `author`, `date`, `commitText` (all strings). `commitText` is pre-formatted commit + diff text prepared by the caller (the kit app truncates large diffs).
- **Processing:** `Generate Text` (Gemini) writes a structured entry (SUMMARY / DETAILS / TAGS) grounded in the diffs → `Code` node composes the indexable text `[project] date\n<entry>` and a metadata record → `Vectorize` embeds it (`gemini-embedding-001`) → `VectorDB` indexes into the `devdiary` collection with primary keys `project` + `date` (duplicates overwritten).
- **Response:** `{ entry, project, date }`.
- **When to use:** after any push or on-demand sync of recent commits.
- **Dependencies:** Gemini credential (chat + embedding models), `devdiary` vector database.

### `devdiary-ask` — work-history chat

- **Trigger:** API request (realtime) with `query` (string).
- **Processing:** `RAG` node retrieves up to 10 entries from `devdiary` (certainty 0.5) using the same embedding model, then answers with a Gemini chat model under a system prompt that requires project + date citations and forbids inventing unlogged work.
- **Response:** `{ answer }`.
- **When to use:** any natural-language question about logged work, including period digests ("summarize my week").
- **Dependencies:** same vector database and embedding model as `devdiary-log` — they must match.

## Guardrails

- Answers about work history come only from retrieved entries; if nothing matches, the agent says "I don't have any logged work matching that."
- Diff content is treated as data to summarize, never as instructions to follow (prompt-injection resistance for malicious commit content).
- Secrets appearing in diffs are referred to generically, never repeated.
- Journal entries must name concrete files/features; vague filler is prohibited by prompt.

## Integration Reference

| Service | Used by | Credential |
|---|---|---|
| Google Gemini (chat) | `devdiary-log` Generate Text, `devdiary-ask` RAG generation | Gemini API key credential in Lamatic |
| Google Gemini (embeddings) | Vectorize node, RAG retrieval | same credential, `gemini-embedding-001` |
| Lamatic vector DB | `devdiary-log` indexing, `devdiary-ask` retrieval | project-internal, collection `devdiary` |
| GitHub REST API | kit app only (commit + diff fetching, webhook) | `GITHUB_TOKEN` env var in the app |

## Environment Setup

| Variable | Purpose |
|---|---|
| `LAMATIC_API_KEY` | Lamatic project API key (Studio → Settings → API Keys) |
| `LAMATIC_PROJECT_ID` | Lamatic project ID |
| `LAMATIC_API_URL` | Project GraphQL endpoint |
| `DEVDIARY_LOG_FLOW_ID` | Deployed `devdiary-log` flow ID |
| `DEVDIARY_ASK_FLOW_ID` | Deployed `devdiary-ask` flow ID |
| `GITHUB_TOKEN` | GitHub PAT for private repos / rate limits (optional) |
| `GITHUB_WEBHOOK_SECRET` | HMAC secret for the push webhook (optional, recommended) |

## Quickstart

1. Deploy both flows in Lamatic Studio (same Gemini credential, same embedding model, vector DB `devdiary`).
2. `cd kits/devdiary/apps && cp .env.example .env.local` — fill in the seven variables.
3. `npm install && npm run dev` → open `http://localhost:3000`.
4. Sync a repo from the left panel, then ask the right panel what you worked on.
5. Optionally point a GitHub push webhook at `/api/github/webhook`.

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Empty `{}` flow response | API Response output mapping missing | Re-deploy flows from this kit's `flows/` definitions |
| Chat can't find logged work | Embedding model mismatch between flows, or nothing indexed | Use the same embedding model in both flows; sync at least one repo |
| GitHub 403/404 in app | Missing/insufficient `GITHUB_TOKEN` | Set a PAT with repo read access |
| Webhook 401 | Signature mismatch | Align `GITHUB_WEBHOOK_SECRET` with the GitHub webhook secret |
| Model 404 from Gemini | Retired model name in credential | Use a current model (e.g. `gemini-flash-latest`) |
