# PR Companion

Turns a git diff (or list of changed files) plus commit messages into a
review-ready pull request: a conventional-commit title, a structured
description (Summary / What changed / Why / How to test), a reviewer
checklist tailored to the change, and a one-line changelog entry.

## Why

Writing a clear PR description is a two-minute task that's easy to skip when
you're mid-flow on a feature — and that costs reviewers time later. PR
Companion takes what you already have (a diff and your commit messages) and
turns it into something a reviewer can actually use, in seconds.

## How it works

1. A single Lamatic flow (` flows/pr-flow/ `) with one LLM node.
2. The node takes `diff_or_files`, `commit_messages`, and an optional
   `intent` string as input.
3. It returns structured Markdown following the four-section format defined
   in `prompts/pr-companion_llm-node_system.md`.
4. A small Next.js app (`apps/`) provides a form for pasting in the diff and
   commits, and displays/copies the result.
5. The exported Lamatic flow configuration is included in `flows/pr-flow/` so it can be imported and reused.
   
## Features

- Generate conventional commit PR titles
- Create structured PR descriptions
- Produce reviewer checklists
- Generate changelog entries
- Works from git diffs or changed file lists
- Runs locally or with a deployed Lamatic flow

## Run it locally

```bash
cd kits/pr-companion/apps/app
cp .env.example .env.local   
npm install
npm run dev
# open http://localhost:3000
```

## Deploy your own flow

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai)
2. Create a project, create a new flow
3. Add an LLM node with the system/user prompts from `prompts/`
4. Set the input schema to `diff_or_files`, `commit_messages`, `intent`
5. Deploy the flow, grab the Flow ID, API key, project ID, and endpoint
6. Put those into `apps/.env.local` as shown in `apps/.env.example`

## What this kit does NOT do

- Does not call the GitHub API or read your repo directly — you paste the
  diff/commits in yourself. No repo access is ever granted.
- Does not review code for bugs/security (see the `code-review` kit for that).
- Does not open the PR for you — output is copy/paste ready.

## Tech

- Lamatic flow (single LLM node)
- Next.js 14 (App Router) + TypeScript
- Lamatic JavaScript SDK (`lamatic`)
