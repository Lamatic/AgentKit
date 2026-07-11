# Release Notes Generator

Turn raw git commit messages and pull request titles into clean, categorized, human-readable
release notes with a single LLM-powered Lamatic flow.

## Overview

| | |
|---|---|
| **Type** | `template` (single flow) |
| **Flow** | `flows/release-notes-generator.ts` |
| **Input** | `changes` — newline-separated commit messages / PR titles |
| **Output** | `releaseNotes` — Markdown release notes |

The flow sends your raw changes to a language model with a "release manager" system prompt that
groups everything into **Features**, **Fixes**, **Breaking Changes**, and **Maintenance**, and
rewrites each line into a concise, user-facing sentence.

## Structure

```
release-notes-generator/
├── lamatic.config.ts
├── agent.md
├── README.md
├── .gitignore
├── flows/
│   └── release-notes-generator.ts
├── prompts/
│   ├── release-notes-generator_generate-text_system.md
│   └── release-notes-generator_generate-text_user.md
├── model-configs/
│   └── release-notes-generator_generate-text.ts
└── constitutions/
    └── default.md
```

## Setup

1. Create a project in [studio.lamatic.ai](https://studio.lamatic.ai).
2. Recreate the flow using the visual editor:
   - **API Request** trigger with a `changes` string field.
   - **Generate Text (LLM)** node using the prompts in `prompts/` and a model you have connected
     (default in `model-configs/` is `gpt-4o-mini`; change it to any connected provider/model).
   - **API Response** node mapping `releaseNotes` from the LLM output.
3. Click **Deploy** and wait for the green **Deployed** status.

## Usage

Call the deployed flow with a `changes` payload:

```
feat: add dark mode toggle to settings
fix: crash when uploading empty file
chore: bump dependencies
feat!: drop support for Node 16
docs: update README
```

Returns Markdown release notes grouped by category. See [`agent.md`](./agent.md) for a full
example of the output.

## License

Contributed to [Lamatic AgentKit](https://github.com/Lamatic/AgentKit).
