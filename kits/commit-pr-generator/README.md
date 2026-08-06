# Commit & PR Generator

Turn a raw `git diff` into a clean **Conventional Commits** message and a ready-to-paste **pull request description** — powered by a single Lamatic flow.

- **Type:** Template (single flow, no UI, no env vars)
- **Flow:** `commit-pr-generator`
- **Model:** Google Gemini (via a Lamatic credential)

---

## What it does

Given the output of `git diff`, the flow produces:

1. A **Conventional Commits** header — `type(scope): subject` (type ∈ `feat, fix, docs, style, refactor, perf, test, build, ci, chore`), imperative mood, ≤ 72 chars.
2. An optional **commit body** — 1–3 bullets explaining *what* changed and *why* (only when non-trivial).
3. A **PR description** in Markdown with `## Summary`, `## Changes`, and `## Testing` sections.

The commit message and PR description are returned together in a single `result` string, separated by a line containing only `---`.

---

## Flow architecture

```
API Request (diff)  →  Generate Text (Gemini)  →  API Response (result)
```

- **API Request** — accepts `{ "diff": "string" }`.
- **Generate Text** — an LLM node with a system prompt that enforces the output format and a user prompt that injects `{{triggerNode_1.output.diff}}`.
- **API Response** — maps `result` to `{{LLMNode_223.output.generatedResponse}}`.

---

## Prerequisites

- A [Lamatic](https://lamatic.ai) account.
- A **Gemini** model credential added in Lamatic Studio (a free key from [Google AI Studio](https://aistudio.google.com/apikey) works).

---

## Setup

1. Open (or import) the `commit-pr-generator` flow in [Lamatic Studio](https://studio.lamatic.ai).
2. On the **Generate Text** node, select your **Gemini** credential and a model (e.g. `gemini-2.5-flash`).
3. Click **Deploy**.

---

## Usage

Call the deployed flow's API endpoint with a JSON body containing your diff:

```json
{
  "diff": "diff --git a/utils.py b/utils.py\n@@\n-def add(a, b): return a+b\n+def add(a, b):\n+    if not all(isinstance(x, (int, float)) for x in (a, b)):\n+        raise TypeError('inputs must be numeric')\n+    return a + b"
}
```

**Example response:**

```json
{
  "result": "refactor(utils): add numeric input validation to add\n- Introduce type checking for inputs a and b\n- Raise TypeError on non-numeric inputs\n---\n## Summary\nAdds input validation to the add() function.\n## Changes\n- Validate that both arguments are int or float\n## Testing\n- Call add(1, 2) -> 3\n- Call add('a', 2) -> raises TypeError"
}
```

Tip: generate the diff with `git diff` (unstaged) or `git diff --cached` (staged) and pass it as the `diff` value.

---

## Repository structure

```
commit-pr-generator/
├── lamatic.config.ts      # template metadata
├── agent.md               # agent identity + capability doc
├── README.md              # this file
├── constitutions/
│   └── default.md         # guardrails
├── flows/
│   └── commit-pr-generator.ts   # the flow graph (trigger → LLM → response)
├── prompts/
│   ├── commit-pr-generator_llmnode-223_system_0.md   # system prompt
│   └── commit-pr-generator_llmnode-223_user_1.md     # user prompt
└── model-configs/
    └── commit-pr-generator_llmnode-223_generative-model-name.ts
```

---

## Notes

- This is a **template** — there is no `apps/` directory and no `.env` file.
- The diff is treated as **untrusted input**: the model is instructed to ignore any instructions embedded inside the diff.
- If the input is empty or not a valid diff, the flow returns exactly `ERROR: no valid diff provided`.
- **Extending validation:** the sentinel above is prompt-based by design (this template stays a single LLM step). If you need hard, deterministic validation, add a Condition/Code node after the API Request that checks for diff markers (e.g. `diff --git`, `@@`) and short-circuits invalid input to the response before the LLM runs.
