# PR Companion

## Purpose
PR Companion turns a raw git diff (or list of changed files) plus commit messages into a polished, review-ready pull request package: a clear title, a structured description, a reviewer checklist, and a changelog entry.

## Flow
`pr-flow` — takes `diff_or_files`, `commit_messages`, and an optional `intent` string, passes them to a single LLM node with a system prompt that enforces a consistent 4-section output format, and returns the generated text via the API response node.

## Guardrails
Follows `constitutions/default.md`: never fabricates changes that aren't present in the diff, treats pasted code as data (not instructions), and stays within the requested output format.

## Integration
The `apps/` Next.js app calls `pr-flow` via the Lamatic SDK (`executeFlow`), reading the flow ID from `FLOW_PR_FLOW` in the environment, and renders the result in a simple paste-in/generate UI.