# Why This Code — Agent Identity

## Overview

Why This Code is a Lamatic AgentKit kit that explains *why* a specific function or class reference exists in a codebase. Given a single GitHub permalink, the agent crawls Git blame history, historical pull requests, linked tracker issues, JSDoc/docstrings, and cross-file invocation patterns to synthesize the structural intent and origin narrative of the code reference.

## Purpose

Developers working on unfamiliar codebases — particularly during onboarding or refactoring/deprecation phases — frequently encounter functions or classes and question *why* they were built. Answering this usually requires a tedious, manual search across Git commits, PR descriptions, issue trackers, and consuming files.

This agent automates that exploration into a single cohesive narrative:

1. **Origin & History**: Pinpoints whether a symbol was introduced in a single commit or evolved across multiple commits.
2. **Linked Discussions**: Pulls context from PRs and tracker issues to explain the problem the code was introduced to solve.
3. **Usage Patterns**: Maps external import paths, local symbol aliases, and invocation slices across the repository.
4. **Architectural Role**: Synthesizes constructor dependencies, design patterns, and explicit caveats into a structural summary.

## Flows

### 1. `why-this-code` (main analysis flow)

- **Trigger**: API Request / GraphQL endpoint input containing `url` (e.g. `https://github.com/owner/repo/blob/main/path/to/file.ts#L7`).
- **Processing**:
  1. `codeNode_360` (Resolve Reference & Validation): Validates permalink format, fetches target file content via GitHub API, checks declaration boundaries for supported language profiles (TypeScript/JavaScript or Python), and extracts symbol name and docstrings.
  2. `codeNode_366` (Explore Repo): Scans repository file and directory layout for context.
  3. `codeNode_171` (Find Docs): Checks documentation and README files for symbol references.
  4. `codeNode_325` (Trace History): Tracks commit history, diff hunks, and origin commit SHAs.
  5. `codeNode_561` (Trace Discussions): Crawls linked GitHub PRs and tracker issues for prose rationale.
  6. `codeNode_616` (Search Codebase): Searches consuming files for import statements, symbol aliases, and invocation slices.
  7. `codeNode_508` (Trim Larger Files): Formats and bounds large file context buffers for prompt efficiency.
  8. `InstructorLLMNode_662` (LLM Call): Performs AI inference to synthesize findings into a structured schema (`aiResponse` and `context`).
- **Response**: `{ aiResponse, context, status, validationError }`.
- **Dependencies**: `prompts/why_this_code_instructor_llmnode_662_system_0.md`, `prompts/why_this_code_instructor_llmnode_662_user_1.md`, `constitutions/default.md`.

## Guardrails

The system prompts and script nodes enforce strict guardrails:

- **Non-fabrication Rule**: The LLM must not invent reasoning. If evidence (PR/issue bodies, commit messages) lacks prose explanation, `purposeBasis` is set to `"insufficient-evidence"`.
- **Language Scope**: Restricted to TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`) and Python (`.py`).
- **Error Normalization**: Non-error indicators (`validationError: "none"`) are normalized so valid workflow results render the 50/50 dashboard, while real errors route cleanly to the Error view.

## Integration Reference

- **LLM Provider**: Configured via Lamatic flow integrations (`generativeModelName`).
- **GitHub API**: Uses GitHub REST & GraphQL APIs with authentication header `Authorization: Bearer {{ secrets.project.GITHUB_TOKEN }}`.
- **Lamatic Studio**: Hosts the flow behind a GraphQL API endpoint.

## Environment Setup

The Next.js app in `apps/` requires the following environment variables (see `apps/.env`):

| Variable | Source |
|---|---|
| `LAMATIC_API_URL` | Lamatic Studio → Settings → API Keys → API URL |
| `LAMATIC_PROJECT_ID` | Lamatic Studio → Settings → API Keys → Project ID |
| `LAMATIC_API_KEY` | Lamatic Studio → Settings → API Keys → API Key |
| `WHY_THIS_CODE` | Lamatic Studio → `why-this-code` flow → Flow ID |

## Quickstart

1. Navigate to `kits/why-this-code/apps`.
2. Configure `.env` with your Lamatic deployment credentials.
3. Run `npm install` and `npm run dev`.
4. Open `http://localhost:3000`.
5. Paste a supported GitHub permalink (e.g. `https://github.com/suu-b/renaissance/blob/main/apps/remote-service/src/services/bootstrap/bootstrap-service.ts#L7`).
6. View the 50/50 split canvas dashboard showing symbol definition, usage slices, commit history, and linked discussions.

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| `Lamatic credentials missing` on startup | Environment variables not set in `.env` | Verify `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, `WHY_THIS_CODE`. |
| Flow routes to error screen with `"none"` | `validationError` string `"none"` treated as truthy | Handled via `extractValidationError()` helper in `apps/actions/orchestrate.ts`. |
| Unsupported file format error in UI | URL points to non-JS/TS or non-Python file | Input validator enforces `.ts`, `.tsx`, `.js`, `.jsx`, and `.py`. |
| GitHub API rate limit error | `GITHUB_TOKEN` secret missing in Lamatic project | Add `GITHUB_TOKEN` in Lamatic Studio project secrets. |

## MVP Scope & Architectural Choices

1. **Static Workflow vs. Agentic Loop**: The flow currently runs as a static node sequence ending with a single LLM synthesis call. This was a deliberate design choice to ensure predictable execution latency and compatibility with free-tier LLM rate limits.
2. **GitHub API Focus**: Built specifically around GitHub URLs, REST APIs, and GraphQL endpoints.
3. **Language Profiles**: Scoped to TypeScript/JavaScript and Python language profiles for exact declaration matching.

## Files of Note

- `flows/why-this-code.ts` — exported flow definition from Lamatic Studio.
- `scripts/why-this-code_code-node-*.ts` — code node scripts for resolution, tracing, searching, and trimming.
- `prompts/*.md` — system & user prompts for intent synthesis.
- `constitutions/default.md` — non-negotiable rules shared across flow executions.
- `apps/app/page.tsx` — single-page UI: landing view → dynamic loading timeline → 50/50 split canvas dashboard / error view.
- `apps/actions/orchestrate.ts` — server action orchestrator for executing the flow and parsing responses.
- `sample_input.json` & `sample_output.json` — reference input and output payloads.
