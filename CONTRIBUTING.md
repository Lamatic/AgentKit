# Contributing to Lamatic AgentKit

Thank you for your interest in improving AgentKit! This guide walks you through building flows in Lamatic, exporting them, and contributing **kits**, **bundles**, or **templates** to the repository.

---

## Table of Contents

- [Quick Start (TL;DR)](#quick-start-tldr)
- [Prerequisites](#prerequisites)
- [Step 1: Fork the Repository](#step-1-fork-the-repository)
- [Step 2: Build Your Flow in Lamatic](#step-2-build-your-flow-in-lamatic)
- [Step 3: Deploy Your Flow](#step-3-deploy-your-flow)
- [Step 4: Get Your API Credentials](#step-4-get-your-api-credentials)
- [Step 5: Export Your Flow](#step-5-export-your-flow)
- [Step 6: Choose Your Contribution Type](#step-6-choose-your-contribution-type)
- [Repository Layout](#repository-layout)
- [The `lamatic.config.ts` Schema](#the-lamaticconfigts-schema)
- [The `@reference` System](#the-reference-system)
- [Adding a Template](#adding-a-template-single-flow)
- [Adding a Bundle](#adding-a-bundle-multiple-flows-no-ui)
- [Adding a Kit](#adding-a-kit-full-app--flows)
- [Examples & References](#examples--references)
- [PR Checklist](#pr-checklist)
- [Troubleshooting](#troubleshooting)
- [Community & Support](#community--support)

---

## Quick Start (TL;DR)

1. **Fork** the [AgentKit repository](https://github.com/Lamatic/AgentKit)
2. **Build** your flow(s) in [Lamatic Studio](https://studio.lamatic.ai) and deploy them
3. **Export** from Studio → you get `lamatic.config.ts` + `flows/<name>.ts` + supporting directories
4. **Copy** into `kits/<your-name>/` (kebab-case, unique)
5. **Fill in** `lamatic.config.ts` (type, author, tags, GitHub link)
6. **Commit** and open a PR titled `feat: Add <name> <type>`

---

## Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Comes with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com) |
| GitHub Account | — | [github.com](https://github.com) |
| Lamatic Account | — | [lamatic.ai](https://lamatic.ai) |
| Vercel Account | — | [vercel.com](https://vercel.com) *(only for kit deployment)* |

> Node.js and npm are only required for **kit** contributions (which ship a Next.js app). Bundles and templates are flow-only — no local runtime needed.

---

## Step 1: Fork the Repository

### 1.1 Fork on GitHub

![GitHub fork button highlighted](public/contributing/images/github_fork.png)

1. Go to [github.com/Lamatic/AgentKit](https://github.com/Lamatic/AgentKit)
2. Click the **Fork** button in the top-right corner

### 1.2 Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/AgentKit.git
cd AgentKit
```

### 1.3 Add Upstream Remote

```bash
git remote add upstream https://github.com/Lamatic/AgentKit.git
```

---

## Step 2: Build Your Flow in Lamatic

### 2.1 Sign In to Lamatic Studio

![Lamatic sign-in page](public/contributing/images/lamatic_sign_in.png)

1. Go to [studio.lamatic.ai](https://studio.lamatic.ai)
2. Sign in or create a free account

### 2.2 Create a New Project

![Dashboard with "Create Project" button highlighted](public/contributing/images/project_dashboard.png)

1. From the dashboard, click **"Create Project +"**
2. Enter a project name (e.g., "My Content Generator") and particulars

![Create project page](public/contributing/images/create_project_page.png)

3. Click **"Create"**

### 2.3 Create a New Flow

1. Navigate: **Dashboard → Your Project** and open the project you just created

![Project dashboard](public/contributing/images/projects_dashboard.png)

2. Click **"+ Create"**

![Create flow button](public/contributing/images/create_flow_button.png)

3. Choose your starting point:
   - **Templates:** Select a pre-built template to customize
   - **Flow:** Build from a blank canvas

![New Flow options](public/contributing/images/flow_gen_options.png)

### 2.4 Configure Your Flow

![Flow editor](public/contributing/images/flow_editor.png)

1. Add nodes for your workflow (triggers, LLM, conditions, RAG, memory, etc.)
2. Configure providers and API integrations
3. Set up input/output schemas
4. Externalize reusable resources:
   - **Prompts** → saved as markdown files and referenced via `@prompts/...`
   - **Code nodes** → saved as `.ts` files and referenced via `@scripts/...`
   - **Model configs** → saved as `.ts` files and referenced via `@model-configs/...`

---

## Step 3: Deploy Your Flow

![Deployed status](public/contributing/images/test_deployment.png)

1. Click **"Deploy"** in the top-right of the flow editor
2. Select the flow(s) you want to deploy and wait for completion
3. A green **"Deployed"** status indicates success

---

## Step 4: Get Your API Credentials

Navigate: **Settings → API Keys** (in the left sidebar)

![API Keys](public/contributing/images/api_key_section.png)

You'll need these values for kits that ship with a Next.js app:

| Key | Where to Find It | Screenshot |
|-----|------------------|------------|
| `LAMATIC_API_KEY` | **Settings → API Keys → Copy** | ![API Key](public/contributing/images/api_key.png) |
| `LAMATIC_PROJECT_ID` | **Settings → Project → Project ID** | ![Project ID](public/contributing/images/project_id.png) |
| `LAMATIC_API_URL` | **Settings → API Docs Button → API → Endpoint** | ![Endpoint](public/contributing/images/endpoint.png) |

### Get Your Flow ID

1. Open your deployed flow
2. Look at the URL or open the details panel (three-dot menu)
3. Copy the **Flow ID** — you'll map this to an env key declared by `envKey` in your `lamatic.config.ts` steps

Navigate: **Flow → Details Panel → Flow ID**

![Flow ID](public/contributing/images/copy_id.png)

---

## Step 5: Export Your Flow

1. Open your flow in the editor
2. Click the **three-dot menu (⋮)** → **"Export"**
3. Studio packages your flow into the unified TypeScript format

![Export menu option](public/contributing/images/export_flow.png)

### What You Get From Export

Studio exports a folder with this structure:

```
<exported-folder>/
├── lamatic.config.ts         # project metadata (name, type, author, steps, links)
├── agent.md                  # agent identity + capability doc
├── README.md                 # human-readable setup guide
├── flows/
│   └── <flow-name>.ts        # self-contained flow (meta + inputs + references + nodes + edges)
├── prompts/                  # externalized LLM prompts (optional)
│   └── <flow>_<node>_<role>.md
├── scripts/                  # externalized code from codeNode nodes (optional)
│   └── <flow>_<node>.ts
├── model-configs/            # externalized LLM/RAG/ImageGen configs (optional)
│   └── <flow>_<node>.ts
├── constitutions/            # guardrails / identity rules
│   └── default.md
└── triggers/                 # widget UI settings (optional)
    └── widgets/<flow>_<node>.ts
```

All inline prompts, code, and model settings are replaced with `@reference` paths — see [The `@reference` System](#the-reference-system) below.

---

## Step 6: Choose Your Contribution Type

There are three types. What the `type` field in your `lamatic.config.ts` says (and whether `apps/` is present) determines which one you're contributing.

| Type | What it is | When to use |
|------|-----------|-------------|
| **Template** | A single flow. No UI. No env vars. | You built one flow you want to share. |
| **Bundle** | Multiple related flows. No UI. | You built a pipeline (e.g., "indexer + chatbot") with no dedicated UI. |
| **Kit** | Flows + a runnable Next.js web app. | You built a complete deployable project around your flows. |

---

## Repository Layout

Every contribution lives under `kits/<name>/`. There are no categories, no separate `bundles/` or `templates/` folders — the `type` field is the discriminator.

```
kits/<name>/
├── lamatic.config.ts         # REQUIRED: project metadata
├── agent.md                  # REQUIRED: agent identity + capability doc
├── README.md                 # REQUIRED: human-readable setup guide
├── .gitignore
│
├── flows/                    # REQUIRED: one or more flow .ts files
│   └── <flow-name>.ts        # Self-contained flow
│
├── constitutions/            # REQUIRED: guardrails / identity rules
│   └── default.md
│
├── prompts/                  # OPTIONAL: externalized LLM prompts
│   └── <flow>_<node>_<role>.md   # role = system | user | assistant
│
├── scripts/                  # OPTIONAL: externalized code from codeNode nodes
│   └── <flow>_<node>.ts
│
├── model-configs/            # OPTIONAL: externalized LLM/RAG/ImageGen settings
│   └── <flow>_<node>.ts
│
├── triggers/                 # OPTIONAL: widget settings (chat/search UI config)
│   └── widgets/<flow>_<node>.ts
│
├── memory/                   # OPTIONAL: memory node configs
│   └── <flow>_<node>.ts
│
├── tools/                    # OPTIONAL: tool ID arrays referenced by nodes
│   └── <flow>_<node>_tools.ts
│
├── apps/                     # KIT-ONLY: the Next.js app — the runnable project
│   ├── package.json
│   ├── app/                  # Next.js App Router
│   ├── components/
│   ├── actions/orchestrate.ts   # Calls Lamatic flows via the SDK
│   ├── lib/lamatic-client.ts    # Imports from ../../lamatic.config
│   ├── .env.example          # Required env vars
│   └── next.config.mjs, tsconfig.json, etc.
│
└── assets/                   # OPTIONAL: static images/documents used by flows
```

---

## The `lamatic.config.ts` Schema

This is the metadata file for your contribution. Every kit has exactly one.

```typescript
export default {
  name: "My Flow Name",
  description: "Short description of what this does.",
  version: "1.0.0",
  type: "template" as const,          // "kit" | "bundle" | "template"
  author: { name: "You", email: "you@example.com" },
  tags: ["generative", "support"],
  steps: [
    { id: "my-flow-name", type: "mandatory" as const, envKey: "MY_FLOW_ENV_KEY" }
    // For bundles, also use "any-of" steps with options[] and prerequisiteSteps
  ],
  links: {
    demo: "https://...",                                          // optional
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/<name>",
    deploy: "https://vercel.com/new/clone?...",                   // kits only
    docs: "https://lamatic.ai/docs/..."                           // optional
  }
};
```

**Rules:**
- `type` discriminates the contribution type
- `steps[].id` must match a `flows/<id>.ts` file exactly
- `envKey` is only required for kits whose app reads the flow ID from an env var
- `links.github` must point to `kits/<name>`
- `links.deploy` (kits only) should have `root-directory=kits/<name>/apps`

---

## The `@reference` System

Flow `.ts` files don't inline their prompts, code, model configs, widget settings, or tools. Everything that changes independently from the flow graph lives in its own directory and is referenced via `@`.

Example inside a flow node:

```typescript
{
  "nodeId": "LLMNode",
  "values": {
    "prompts": [
      { "role": "system", "content": "@prompts/my-flow_llm-node_system.md" },
      { "role": "user",   "content": "@prompts/my-flow_llm-node_user.md" }
    ],
    "generativeModelName": "@model-configs/my-flow_llm-node.ts"
  }
}
```

Reference scheme:

| Syntax | Resolves to |
|---|---|
| `@prompts/<file>.md` | `prompts/<file>.md` |
| `@scripts/<file>.ts` | `scripts/<file>.ts` |
| `@model-configs/<file>.ts` | `model-configs/<file>.ts` |
| `@constitutions/<file>.md` | `constitutions/<file>.md` |
| `@triggers/widgets/<file>.ts` | `triggers/widgets/<file>.ts` |
| `@memory/<file>.ts` | `memory/<file>.ts` |
| `@tools/<file>.ts` | `tools/<file>.ts` |

Lamatic resolves these at build/run time. Studio's export already writes them correctly — you usually don't author these by hand.

---

## Adding a Template (Single Flow)

1. Build and test your flow in Lamatic Studio.
2. Use Studio's **Export** — you'll get a folder with `lamatic.config.ts`, `flows/<name>.ts`, plus `prompts/`, `model-configs/`, `constitutions/`, etc. as needed.
3. Move the folder into `kits/<your-name>/` (kebab-case, unique).
4. Open `lamatic.config.ts` and set:
   - `type: "template"`
   - `author` (your name and email)
   - `tags` (lowercase, plain strings — no emojis)
   - `description` (one sentence)
   - `links.github` → `https://github.com/Lamatic/AgentKit/tree/main/kits/<your-name>`
5. Write/update `README.md` explaining what the flow does.
6. Commit and open a PR titled `feat: Add <name> template`.

**Reference:** mirror the shape of [`kits/article-summariser/`](./kits/article-summariser/).

---

## Adding a Bundle (Multiple Flows, No UI)

Same as a template, but:

- Export each flow from Studio → each becomes its own `flows/<name>.ts`.
- Set `type: "bundle"` in `lamatic.config.ts`.
- Use a mix of `mandatory` and `any-of` steps to describe onboarding choices (e.g., "pick one data source, then run the main flow").
- Include `.env.example` at the kit root with any required env vars.

**Reference:** mirror the shape of [`kits/knowledge-chatbot/`](./kits/knowledge-chatbot/).

---

## Adding a Kit (Full App + Flows)

Same as a bundle, but:

- Set `type: "kit"` in `lamatic.config.ts`.
- Add an `apps/` directory containing a complete Next.js app — this is the runnable project.
- `apps/package.json` is the project's `package.json`. `apps/.env.example` is its env template.
- `apps/actions/orchestrate.ts` is the server action that calls your flows via the Lamatic SDK, reading flow IDs from env vars declared by `envKey` in your `lamatic.config.ts` steps.
- `apps/lib/lamatic-client.ts` imports from `../../lamatic.config` to read step definitions.
- `links.deploy` in `lamatic.config.ts` must include `root-directory=kits/<name>/apps` so Vercel deploys the app correctly.

### Run Your Kit Locally

```bash
cd kits/<your-name>/apps
cp .env.example .env.local              # fill in real values
npm install
npm run dev
```

**Reference:** mirror the shape of [`kits/content-generation/`](./kits/content-generation/) (simple kit) or [`kits/deep-search/`](./kits/deep-search/) (complex kit with many flows).

---

## Examples & References

### Reference Kits to Copy From

| Type | Reference |
|---|---|
| Template (single flow) | [`kits/article-summariser/`](./kits/article-summariser/) |
| Bundle (multi-flow, no UI) | [`kits/knowledge-chatbot/`](./kits/knowledge-chatbot/) |
| Kit (simple Next.js app) | [`kits/content-generation/`](./kits/content-generation/) |
| Kit (complex, many flows) | [`kits/deep-search/`](./kits/deep-search/) |

### Key Files to Understand

| File | Purpose |
|---|---|
| [`kits/content-generation/lamatic.config.ts`](./kits/content-generation/lamatic.config.ts) | Kit metadata example |
| [`kits/content-generation/apps/actions/orchestrate.ts`](./kits/content-generation/apps/actions/orchestrate.ts) | Server action calling Lamatic flows |
| [`kits/content-generation/apps/lib/lamatic-client.ts`](./kits/content-generation/apps/lib/lamatic-client.ts) | Lamatic SDK client setup |
| [`kits/content-generation/flows/agentic-generate-content.ts`](./kits/content-generation/flows/agentic-generate-content.ts) | Flow `.ts` with `@references` |
| [`kits/content-generation/apps/.env.example`](./kits/content-generation/apps/.env.example) | Env vars template |
| [`registry.json`](./registry.json) | Auto-generated index of all kits |

---

## Naming Conventions

- **Folder names:** `kebab-case`, must be unique across `kits/`
- **Flow files:** `<flow-name>.ts` — matches the step `id` in `lamatic.config.ts`
- **Extracted resources** follow `<flow>_<node>` or `<flow>_<node>_<role>`:
  - `prompts/my-flow_llm-node_system.md`
  - `scripts/my-flow_code-node.ts`
  - `model-configs/my-flow_llm-node.ts`
  - `triggers/widgets/my-flow_chat-widget.ts`
- **Env vars** in `.env.example`: `UPPER_SNAKE_CASE`
- **Tags** in `lamatic.config.ts`: lowercase plain strings, no emojis

---

## PR Checklist

- [ ] Folder is at `kits/<name>/` (kebab-case, unique)
- [ ] `lamatic.config.ts` present with valid `type`, `name`, `author`, `tags`, `steps`, `links`
- [ ] `agent.md` present
- [ ] `README.md` present, describes what the contribution does and how to use it
- [ ] `flows/<name>.ts` exists for every step in `lamatic.config.ts`
- [ ] `constitutions/default.md` present
- [ ] `.env.example` present (bundles + kits only)
- [ ] `apps/package.json` works with `npm install && npm run dev` (kits only)
- [ ] `links.github` in `lamatic.config.ts` points to `kits/<name>` (not an old category path)
- [ ] `links.deploy` has `root-directory=kits/<name>/apps` (kits only)
- [ ] No `.env` or `.env.local` committed — only `.env.example` with placeholders
- [ ] All `@reference` paths resolve to files that actually exist in your kit
- [ ] PR touches only files inside your `kits/<your-name>/` folder

---

## What NOT to Do

- ❌ Don't create directories outside `kits/<name>/`
- ❌ Don't modify other kits in your PR
- ❌ Don't inline prompts, code, or model settings — they must be externalized and `@referenced`
- ❌ Don't commit `.env` or `.env.local`
- ❌ Don't use the old `config.json` format — Studio now exports `lamatic.config.ts`
- ❌ Don't use old category paths like `kits/agentic/` or `kits/embed/` — the structure is flat

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| `npm run dev` fails | Check Node.js version: `node --version` (needs 18+). Make sure you're in `kits/<name>/apps/`. |
| Flow not responding | Verify `.env.local` values match your deployed flow IDs in Lamatic Studio. |
| `Cannot find module '../../lamatic.config'` | Your folder structure is wrong. It must be exactly `kits/<name>/apps/...`. |
| `@reference` not resolving | The file path is case-sensitive and must exist relative to the kit root. Check `prompts/`, `scripts/`, etc. |
| Vercel deploy fails | Verify `links.deploy` has `root-directory=kits/<name>/apps` with correct URL encoding. |
| GitHub link returns 404 after PR merges | `links.github` must point to the `main` branch at `kits/<name>`. Double-check the path. |
| "API key invalid" error | Check `LAMATIC_API_KEY` in your `.env.local`. Regenerate from **Settings → API Keys** if needed. |

### Getting Help

1. Check [existing issues](https://github.com/Lamatic/AgentKit/issues)
2. Ask in [GitHub Discussions](https://github.com/Lamatic/AgentKit/discussions)
3. Review [Lamatic Docs](https://lamatic.ai/docs)

---

## General Guidelines

### Coding Standards
- Write clear, maintainable code
- Use TypeScript where possible
- Follow patterns from reference kits (`article-summariser`, `content-generation`, `deep-search`, `knowledge-chatbot`)
- Keep dependencies minimal
- Add comments for complex logic

### Before You Contribute
- Check if a similar kit/bundle/template already exists in [`registry.json`](./registry.json)
- Search open issues to avoid duplicates
- Read this guide completely

### Reporting Bugs
Include:
- Steps to reproduce
- Expected vs. actual behavior
- Environment (Node.js version, OS)
- Relevant logs or screenshots

---

## Community & Support

- **GitHub Discussions:** [github.com/Lamatic/AgentKit/discussions](https://github.com/Lamatic/AgentKit/discussions)
- **Issues:** [github.com/Lamatic/AgentKit/issues](https://github.com/Lamatic/AgentKit/issues)
- **Slack:** [join the Lamatic community](https://lamatic.ai/docs/slack)
- **Lamatic Docs:** [lamatic.ai/docs](https://lamatic.ai/docs)

---

We appreciate your contributions to Lamatic AgentKit! 🚀
