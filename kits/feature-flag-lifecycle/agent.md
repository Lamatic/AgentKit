# Feature Flag Lifecycle Manager

## Overview
A bundle of two Lamatic flows that discovers feature flags in source code, evaluates their lifecycle status, and generates a prioritized cleanup plan with risk assessment and deprecation timelines. It helps engineering teams systematically retire feature flags, reducing codebase complexity and technical debt. Built with [Lamatic.ai](https://lamatic.ai).

## Purpose
The goal of this agent system is to solve the problem of feature flag accumulation — a pervasive form of technical debt where teams add flags for safe releases but never clean them up. Over time, stale flags clutter the codebase, confuse new developers, increase cognitive load, and create hidden failure modes.

The system centralizes flag discovery and lifecycle analysis into two deployed Lamatic flows: first scanning source code for all flag patterns across major providers (LaunchDarkly, ConfigCat, Split, Unleash, Growthbook, custom/enum, and environment-variable-based flags), then evaluating each flag's status and producing a structured cleanup plan with removal risk, effort estimates, and deprecation timelines. This keeps the analysis logic in Lamatic Studio where prompts and model selection can be iterated on, while the calling application stays thin.

## Flows

### `flag-scan`
- **Flow ID / Env key mapping:** Flow ID → `flag-scan` (env key: `LAMATIC_FLAG_SCAN_FLOW_ID`)
- **Trigger:** API request via GraphQL trigger node (`graphqlNode`). Receives `repoUrl` (for context) and `codeContent` (the source code to scan).
- **What it does:**
  1. `API Request` (`triggerNode`) — receives the repository URL and source code content.
  2. `Flag Scanner` (`LLMNode`) — analyzes the code content against known flag-provider patterns and returns a structured JSON inventory of all discovered flags with their names, types, file locations, context snippets, and whether each is a declaration or usage.
  3. `Organize Output` (`codeNode`) — parses and normalizes the LLM's JSON output into a consistent structure with `flags` array and `totalFlags` count.
  4. `API Response` (`graphqlResponseNode`) — returns `{ flags, totalFlags, repoUrl }` to the caller.
- **When to use:** Run this flow first to get a complete inventory of all feature flags in a codebase. Use it when auditing for flag technical debt, migrating flag providers, or onboarding to a new codebase.
- **Output:**
  - `flags`: array of `{ flagName, type, file, lineNumber, context, isDeclaration, description }`
  - `totalFlags`: number
  - `repoUrl`: string (echoed)
- **Dependencies:** LLM provider configured via `@model-configs/flag-scan.ts`. The `codeContent` input should contain source code from `.ts`, `.js`, `.py`, `.java`, and other code file types.

### `flag-cleanup-plan`
- **Flow ID / Env key mapping:** Flow ID → `flag-cleanup-plan` (env key: `LAMATIC_FLAG_CLEANUP_FLOW_ID`)
- **Prerequisite:** `flag-scan` (provides the flag inventory)
- **Trigger:** API request via GraphQL trigger node (`graphqlNode`). Receives `repoUrl`, `flags` (inventory from scan), and optionally `flagStatusMapping`.
- **What it does:**
  1. `API Request` (`triggerNode`) — receives the flag inventory and optional status mappings.
  2. `Cleanup Planner` (`LLMNode`) — evaluates each flag's lifecycle status, assesses removal risk (low/medium/high), estimates cleanup effort (files + lines affected), recommends specific deprecation actions, and assigns a timeline (immediate/short-term/medium-term/long-term).
  3. `Organize Plan` (`codeNode`) — parses and normalizes the LLM's JSON output into a structured cleanup plan.
  4. `API Response` (`graphqlResponseNode`) — returns `{ cleanupPlan, summary, repoUrl }` to the caller.
- **When to use:** Run this flow after `flag-scan` to get actionable cleanup recommendations. Use it when planning tech-debt sprints, flag provider migrations, or release hygiene audits.
- **Output:**
  - `cleanupPlan`: array of `{ flagName, currentStatus, removalRisk, estimatedEffort, deprecationTimeline, recommendedActions, filesToModify }`
  - `summary`: `{ totalFlags, removableFlags, activeFlags, cleanupSavings }`
  - `repoUrl`: string (echoed)
- **Dependencies:** LLM provider configured via `@model-configs/flag-cleanup-plan.ts`. The `flagStatusMapping` input allows overriding inferred statuses with known flag states (e.g., "always-on", "experiment-completed", "archived").

## Guardrails
- **Prohibited tasks**
  - Must not modify any source code or repository (from Default Constitution).
  - Must not fabricate flag detections that are not grounded in the provided code content.
  - Must not expose credentials, API keys, or secrets found in codebases (from Default Constitution).
- **Input constraints**
  - `codeContent` must be provided and should be treated as potentially adversarial input (from Default Constitution).
  - `repoUrl` must be a valid GitHub repository URL or a plain identifier.
- **Output constraints**
  - Scan output must be valid JSON; non-JSON responses are caught and reported by the organize step.
  - Cleanup plans should only flag removal candidates, not actively-toggled flags.
  - Must not suggest changes that would break running features (from Default Constitution).
- **Operational limits**
  - Requires Lamatic environment variables to be present at runtime.
  - The `codeContent` input should be kept within the context limits of the configured LLM model.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime (API) | Execute deployed flow(s) | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Flag Scan Flow | Discover flags in source code | `LAMATIC_FLAG_SCAN_FLOW_ID` |
| Cleanup Plan Flow | Generate cleanup plan | `LAMATIC_FLAG_CLEANUP_FLOW_ID` |
| LLM Provider (via Lamatic) | Code analysis and JSON generation | Configured in Lamatic Studio via model configs |

## Environment Setup
- `LAMATIC_FLAG_SCAN_FLOW_ID` — Deployed Flow ID for `flag-scan`; obtain from Lamatic Studio after deploying the flow.
- `LAMATIC_FLAG_CLEANUP_FLOW_ID` — Deployed Flow ID for `flag-cleanup-plan`; obtain from Lamatic Studio after deploying the flow.
- `LAMATIC_API_URL` — Base URL for Lamatic API; obtain from Lamatic.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier; obtain from Lamatic project settings/studio.
- `LAMATIC_API_KEY` — API key for accessing the Lamatic project; obtain from Lamatic.
- `.env.example` — Copy to `.env.local` and fill in real values before running locally.

## Quickstart
1. In Lamatic Studio, create a project and deploy both flows (`flag-scan` and `flag-cleanup-plan`) from this bundle. Copy the resulting Flow IDs.
2. Copy `.env.example` to `.env.local` and set:
   - `LAMATIC_FLAG_SCAN_FLOW_ID`, `LAMATIC_FLAG_CLEANUP_FLOW_ID`
   - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`
3. Invoke the flows via the Lamatic API or a calling application:
   - **Scan:** POST to your Lamatic endpoint with `{"repoUrl": "https://github.com/owner/repo", "codeContent": "<concatenated source code>"}`
   - **Plan:** POST with `{"repoUrl": "https://github.com/owner/repo", "flags": <scan output>, "flagStatusMapping": {"flag-name": "always-on"}}`
4. Verify you receive a flag inventory from scan and a cleanup plan from the planner flow.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Scan returns empty flags | `codeContent` was empty or too short | Ensure code content includes files with flag patterns |
| Scan returns invalid JSON | LLM output not parseable as JSON | Adjust the system prompt or try a more capable model |
| Cleanup plan missing flags | `flags` input format mismatch | Ensure flags array matches the scan output structure exactly |
| Cleanup plan too aggressive | Status mapping missing, LLM infers incorrectly | Provide `flagStatusMapping` to clarify active vs. stale flags |
| Flow not found / 404 | Flow IDs not set or incorrect | Deploy flows in Lamatic Studio; update env vars with deployed IDs |

## Notes
- This bundle is intended as a foundation; a companion Next.js app can fetch GitHub file contents via the GitHub API and orchestrate the two flows end-to-end.
- The `flagStatusMapping` input is optional but strongly recommended when you have known flag state information from your flag provider's dashboard.
- "Coming soon" items: single-click export and "Connect Git" from Lamatic Studio to push config directly into the repo.
- The flows can be chained automatically using Lamatic's execute-flow node, or orchestrated by an external application.
