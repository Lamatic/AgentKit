# Git Commit Message Generator

## Overview
Git Commit Message Generator is a single-flow Lamatic template that converts a raw `git diff` into a clean conventional commit message. It removes the friction of writing consistent commit messages by hand.

## Purpose
Developers routinely write vague commit messages ("fixes", "update", "wip") because writing good ones is tedious. This agent reads the actual code changes in a diff and produces a correctly-typed, imperative-mood conventional commit message header with optional scope and description inferred strictly from the diff.

It is designed to be called as an API step in any developer workflow (Git hook, CI job, IDE task, or a thin UI).

## Flows

### `commit-message-generator`
- **Trigger:** API Request (GraphQL). Accepts a JSON body with a input field `git_diff` (string).
- **Processing:** A Generate Text (LLM) node running GPT-4o-mini receives the diff. A system prompt instructs it to infer the commit `type` and `scope` strictly from the changes present in the diff, never inventing changes, and to emit plain text of the Conventional Commit.
- **Response:** API Response returns `{ "response": "<commit message>" }`.
- **When to use:** Right before committing, to standardize messages across a team.
- **Output:** A single `response` string containing the conventional commit message.
- **Dependencies:** An OpenAI model credential configured in Lamatic Studio.

## Guardrails
- **Prohibited:** Inventing changes not present in the diff; producing anything other than the conventional commit.
- **Input constraints:** Expects a valid unified `git diff`.
- **Operational limits:** Stateless, single-shot generation. No repository access, no network calls, no data persistence.

## Integration Reference
- **OpenAI** (via Lamatic model credential) — performs the text generation. Requires an OpenAI API key added as a credential in Lamatic Studio.

## Environment Setup
This is a **template** (single flow, no app). It has no `.env` file. The only requirement is an OpenAI credential configured on the flow inside Lamatic Studio.

## Quickstart
1. Import / open the `commit-message-generator` flow in Lamatic Studio.
2. Attach an OpenAI model credential to the Generate Text node.
3. Deploy the flow.
4. Call the flow's API endpoint with a JSON body: `{ "git_diff": "<your git diff>" }`.
5. Read the `response` field from the response.

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| Response is empty | Output mapping points to the wrong node/field | Ensure API Response maps `response` to `{{generateText.output.response}}` |
| `429` / rate-limit errors | OpenAI quota hit | Wait and retry, or use a higher-tier key |
| Wrong commit type | Diff was ambiguous or truncated | Provide the full diff, not a snippet |
