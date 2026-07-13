# Release Notes Generator

Turn a messy list of merged pull requests and commit messages into clean, categorized, human-readable release notes — in seconds.

> **Type:** Kit (Lamatic flow + Next.js app) · **Flow:** `release-notes-generator`

## The problem

Every release, someone copies a wall of commit messages and hand-writes a changelog: grouping features vs. fixes, spotting breaking changes, rewriting `fix: npe` into something a human understands, and deleting `wip` noise. It's tedious and easy to get wrong.

## What this kit does

Paste your merged PR titles / commit messages (optionally a version and date) and get back Markdown release notes with:

- **📌 Highlights** — a 1–3 sentence summary of the release
- **✨ Features**, **🐛 Fixes**, **⚠️ Breaking Changes**, **🧹 Chore & Internal** — every change grouped and rewritten for a reader
- Preserved `#123` issue/PR references, collapsed duplicates, and no invented entries

### Example

**Input**

```text
Add dark mode toggle to settings page (#412)
fix: crash when uploading empty CSV (#419)
BREAKING: rename `apiKey` config option to `token`
bump next from 15.1 to 16.0
wip refactor auth middleware
Add retry with backoff to webhook delivery (#421)
```

**Output**

```markdown
# v1.2.0 — 2026-07-10

## 📌 Highlights
This release adds dark mode and more reliable webhook delivery, and renames the
`apiKey` configuration option to `token` (breaking).

## ✨ Features
- Add a dark mode toggle to the settings page (#412)
- Add automatic retry with backoff to webhook delivery (#421)

## 🐛 Fixes
- Fix a crash when uploading an empty CSV file (#419)

## ⚠️ Breaking Changes
- Rename the `apiKey` configuration option to `token`

## 🧹 Chore & Internal
- Upgrade Next.js from 15.1 to 16.0
```

## How it works

```text
API Request (changes, version?, date?)
      │
      ▼
Generate Notes (LLM)  ──uses──▶ prompts/*  ·  constitutions/default.md  ·  model-configs/*
      │
      ▼
API Response → { releaseNotes }
```

A single flow, one LLM node. Prompts, guardrails, and model settings are externalized via `@references` so each can be tuned independently.

## Project structure

```text
release-notes-generator/
├── lamatic.config.ts                # metadata (type: kit, steps, links)
├── agent.md                         # agent capability doc
├── README.md                        # this file
├── .env.example                     # flow ID + project credentials
├── flows/
│   └── release-notes-generator.ts   # the flow graph
├── constitutions/
│   └── default.md                   # grounding / anti-fabrication rules
├── prompts/
│   ├── release-notes-generator_generate-notes_system.md
│   └── release-notes-generator_generate-notes_user.md
├── model-configs/
│   └── release-notes-generator_generate-notes.ts
└── apps/                            # runnable Next.js UI
```

## Run it locally

**Prerequisites:** Node 18+, a Lamatic account, and the `release-notes-generator` flow deployed in Studio with a text model attached to the `Generate Notes` node.

```bash
cd apps
cp .env.example .env.local     # fill in the 4 values below
npm install
npm run dev                    # http://localhost:3000
```

`.env.local`:

| Variable | Where to find it |
|---|---|
| `RELEASE_NOTES_GENERATOR` | Studio → your deployed flow ID |
| `LAMATIC_API_URL` | Studio → Project Settings → API |
| `LAMATIC_PROJECT_ID` | Studio → Project Settings → API |
| `LAMATIC_API_KEY` | Studio → Project Settings → API |

### Try the UI without a flow (demo mode)

Want to see the interface before wiring up Studio? Set `DEMO_MODE="true"` in `apps/.env.local` and run `npm run dev` — the **Generate** button returns sample release notes so you can explore the full UI with zero setup. Turn it off (remove the line) to use your real deployed flow.

## Deploy

Use the **Deploy to Vercel** link in `lamatic.config.ts` (`links.deploy`). It clones the repo with `root-directory=kits/release-notes-generator/apps` and prompts for the four environment variables above.

## Tips

- Feed it output from `git log --pretty=format:'%s'` or a copy of your merged PR list — one change per line works best.
- Set a version/date to get a proper `# vX.Y.Z — date` heading.
- Nothing is fabricated: if a change isn't in the input, it won't appear in the notes.
