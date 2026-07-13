# Commit & PR Generator

## Overview
Commit & PR Generator is a single-flow Lamatic template that converts a raw `git diff` into a clean [Conventional Commits](https://www.conventionalcommits.org/) message and a ready-to-paste pull request description. It removes the friction of writing consistent commit messages and PR write-ups by hand.

## Purpose
Developers routinely write vague commit messages ("fixes", "update", "wip") and skip proper PR descriptions because doing them well is tedious. This agent reads the actual code changes in a diff and produces:
- a correctly-typed, imperative-mood commit header,
- an optional short body explaining *what* changed and *why*, and
- a structured PR description (Summary / Changes / Testing).

It is designed to be called as an API step in any developer workflow (Git hook, CI job, IDE task, or a thin UI).

## Flows

### `commit-pr-generator`
- **Trigger:** API Request (GraphQL). Accepts a JSON body with a single field `diff` (string).
- **Processing:** A Generate Text (LLM) node running Google Gemini receives the diff. A system prompt instructs it to infer the commit `type` and `scope` strictly from the changes present in the diff, never inventing changes, and to emit plain text: the commit message, a `---` separator, then the Markdown PR description.
- **Response:** API Response returns `{ "result": "<commit message>\n---\n<pr description>" }`.
- **When to use:** Right before committing or opening a PR, to standardize messages across a team.
- **Output:** A single `result` string containing both artifacts.
- **Dependencies:** A Gemini model credential configured in Lamatic Studio.

## Guardrails
- **Prohibited:** Inventing changes not present in the diff; producing anything other than the commit + PR artifacts.
- **Input constraints:** Expects a valid unified `git diff`. If the input is empty or not a valid diff, the agent replies exactly `ERROR: no valid diff provided`.
- **Operational limits:** Stateless, single-shot generation. No repository access, no network calls, no data persistence.

## Integration Reference
- **Google Gemini** (via Lamatic model credential) — performs the text generation. Requires a Gemini API key added as a credential in Lamatic Studio.

## Environment Setup
This is a **template** (single flow, no app). It has no `.env` file. The only requirement is a Gemini credential configured on the flow inside Lamatic Studio.

## Quickstart
1. Import / open the `commit-pr-generator` flow in Lamatic Studio.
2. Attach a Gemini model credential to the Generate Text node.
3. Deploy the flow.
4. Call the flow's API endpoint with a JSON body: `{ "diff": "<your git diff>" }`.
5. Read the `result` field from the response.

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| `result` is `ERROR: no valid diff provided` | The `diff` field was empty or not a real diff | Send actual `git diff` output in the `diff` field |
| `result` is empty | Output mapping points to the wrong node/field | Ensure API Response maps `result` to `{{LLMNode_223.output.generatedResponse}}` |
| `429` / rate-limit errors | Gemini free-tier quota hit | Wait and retry, or use a higher-tier key |
| Wrong commit `type` | Diff was ambiguous or truncated | Provide the full diff, not a snippet |
