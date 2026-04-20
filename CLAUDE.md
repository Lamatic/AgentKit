# CLAUDE.md — AgentKit Repository Guide

Technical reference for developers and AI agents working on this repo.

---

## What is AgentKit?

AgentKit is an open-source repository of ready-to-deploy AI agent projects built on [Lamatic](https://lamatic.ai) flows. Each contribution is a self-contained folder under `kits/` that you can fork, configure, and deploy. Lamatic Studio exports directly in the format documented here.

---

## Repository Structure

Flat — every contribution lives under `kits/<name>/`. No categories, no separate `bundles/` or `templates/` directories.

```
AgentKit/
├── kits/                  # All contributions (flat)
│   ├── <name>/            # Each kit/bundle/template
│   ├── <name>/
│   └── ...
├── public/                # Shared static assets
├── .github/               # GitHub workflows, PR templates
├── CONTRIBUTING.md        # Contributor guide (read first)
├── CLAUDE.md              # This file
├── README.md
├── CODE_OF_CONDUCT.md
├── CHALLENGE.md
└── LICENSE
```

---

## The Three Types

All three live under `kits/` and are distinguished by the `type` field in `lamatic.config.ts` and by which directories are present.

| Type | `type` value | `apps/` | flows | Purpose |
|---|---|:---:|---|---|
| **Template** | `"template"` | ❌ | 1 | A single flow, no UI, no env vars. |
| **Bundle** | `"bundle"` | ❌ | 2+ | Multiple related flows, no UI. |
| **Kit** | `"kit"` | ✅ | 1+ | Flows + a runnable Next.js app. |

---

## Per-Kit Layout

```
kits/<name>/
├── lamatic.config.ts         # REQUIRED: project metadata (name, type, author, steps, links)
├── agent.md                  # REQUIRED: LLM-generated agent identity + capability doc
├── README.md                 # REQUIRED: human-readable setup guide
├── .gitignore
│
├── flows/                    # REQUIRED: flat .ts files, one per flow
│   └── <flow-name>.ts        # Self-contained: meta + inputs + references + nodes + edges
│
├── constitutions/            # REQUIRED: guardrails / behavioral rules
│   └── default.md
│
├── prompts/                  # OPTIONAL: externalized LLM prompts (system/user/assistant)
│   └── <flow>_<node>_<role>.md
│
├── scripts/                  # OPTIONAL: externalized code from codeNode nodes
│   └── <flow>_<node>.ts
│
├── model-configs/            # OPTIONAL: externalized LLM/RAG/ImageGen model settings
│   └── <flow>_<node>.ts
│
├── triggers/                 # OPTIONAL: widget UI settings (chat/search appearance)
│   └── widgets/<flow>_<node>.ts
│
├── memory/                   # OPTIONAL: memory node configs
│   └── <flow>_<node>.ts
│
├── tools/                    # OPTIONAL: tool ID arrays referenced by nodes
│   └── <flow>_<node>_tools.ts
│
├── apps/                     # KIT-ONLY: the runnable Next.js app
│   ├── package.json, next.config.mjs, tsconfig.json
│   ├── app/ | components/ | hooks/
│   ├── actions/orchestrate.ts
│   ├── lib/lamatic-client.ts
│   └── .env.example
│
└── assets/                   # OPTIONAL: static images/documents/data used by flows
```

---

## `lamatic.config.ts` — Metadata

```typescript
export default {
  name: "Project Name",
  description: "Short description.",
  version: "1.0.0",
  type: "template" as const,          // "kit" | "bundle" | "template"
  author: { name: "...", email: "..." },
  tags: ["lowercase", "plain", "strings"],
  steps: [
    { id: "flow-name", type: "mandatory" as const, envKey: "FLOW_ENV_KEY" }
  ],
  links: {
    demo: "https://...",              // optional
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/<name>",
    deploy: "https://vercel.com/new/clone?...",   // kits only; root-directory=kits/<name>/apps
    docs: "https://lamatic.ai/docs/..."
  }
};
```

Step kinds:
- `"mandatory"` — a required flow, typically has `envKey` for kits.
- `"any-of"` — onboarding choice, has `options[]`, `minSelection`, `maxSelection`. Can declare `prerequisiteSteps`.

---

## Flow `.ts` File Structure

Each flow is ONE self-contained TypeScript file. Flows may have a top-of-file block comment containing human+agent-readable documentation (embedded from the old `flows.md`).

```typescript
/*
 * # Flow Name
 * Description of what this flow does.
 * ... (embedded documentation from LLM-generated flow.md)
 */

// Flow: <flow-name>

export const meta = {
  name: "...", description: "...", tags: [...], testInput: {...}, author: {...}
};

export const inputs = {
  // Per-node input schema (what Lamatic Studio treats as privately-configured fields)
  "NodeId_xxx": [ { name, label, type, required, isPrivate, ... } ]
};

export const references = {
  // Cross-references to externalized resources this flow depends on
  prompts:        { <camelCaseKey>: "@prompts/<file>.md" },
  scripts:        { <camelCaseKey>: "@scripts/<file>.ts" },
  modelConfigs:   { <camelCaseKey>: "@model-configs/<file>.ts" },
  constitutions:  { default: "@constitutions/default.md" },
  triggers:       { <camelCaseKey>: "@triggers/widgets/<file>.ts" },
  memory:         { <camelCaseKey>: "@memory/<file>.ts" },
  tools:          { <camelCaseKey>: "@tools/<file>.ts" }
};

export const nodes = [ /* exact Lamatic Studio node graph */ ];
export const edges = [ /* exact Lamatic Studio edge list */ ];

export default { meta, inputs, references, nodes, edges };
```

---

## The `@reference` System

Rationale: prompts, model settings, code, and widget UI settings all change independently of the flow graph. Separating them into their own directories means:

- Updating a prompt doesn't touch the graph.
- Swapping a model doesn't touch the prompts.
- Widget UI tweaks don't touch the flow logic.
- Each concern is reviewable and diffable in isolation.

Inside nodes, any value that would otherwise be inline can instead be a reference string:

| Syntax | Resolves to |
|---|---|
| `@prompts/<file>.md` | `prompts/<file>.md` |
| `@scripts/<file>.ts` | `scripts/<file>.ts` |
| `@model-configs/<file>.ts` | `model-configs/<file>.ts` |
| `@constitutions/<file>.md` | `constitutions/<file>.md` |
| `@triggers/widgets/<file>.ts` | `triggers/widgets/<file>.ts` |
| `@memory/<file>.ts` | `memory/<file>.ts` |
| `@tools/<file>.ts` | `tools/<file>.ts` |

Lamatic resolves these at build/run time. The graph in `export const nodes` is the canonical Studio export with inline values replaced by `@references`.

**Schemas stay inline.** Graphql/API trigger `advance_schema`, output mappings, and node input/output schemas live inside the flow — they're part of the flow contract, not independently-editable configs.

---

## Per-Directory Purpose

- **`flows/`** — Flow graphs (`.ts`). One file per flow. Self-contained with meta/inputs/references/nodes/edges.
- **`prompts/`** — Markdown files for LLM prompts. Extracted from nodes; referenced via `@prompts/...`.
- **`scripts/`** — TypeScript files for code-node bodies. Uses `{{nodeId.output.x}}` Lamatic template variables that resolve at runtime.
- **`model-configs/`** — Per-node LLM/RAG/ImageGen selection (provider, model, credentials, limits, certainty).
- **`constitutions/`** — Guardrails applied to all flows (identity, safety, data handling, tone). `default.md` is required.
- **`triggers/widgets/`** — Chat widget / search widget UI configs (colors, domains, greeting message, etc.). Schema-related fields (advance_schema) remain inside the flow.
- **`memory/`** — Memory node configs (collection, session ID, filters).
- **`tools/`** — Arrays of tool IDs referenced by agent/LLM nodes.
- **`apps/`** — The Next.js project for kits. Self-contained: its own `package.json`, `.env.example`, etc. Imports `../../lamatic.config` to read step definitions.
- **`assets/`** — Static files (images, documents, data) that flows reference at runtime.

---

## `agent.md`

LLM-generated agent identity document. Contains:

- **Overview** — one-paragraph pitch
- **Purpose** — why this agent exists, what problem it solves
- **Flows** — per-flow description: trigger, processing, response, when to use, output, dependencies
- **Guardrails** — prohibited tasks, input/output constraints, operational limits
- **Integration Reference** — what external services are called and which credentials they need
- **Environment Setup** — required env vars with source/purpose
- **Quickstart** — numbered steps to run
- **Common Failure Modes** — symptom / cause / fix table

Generated using Lamatic's sandbox endpoint with `lamatic.config.ts`, the kit README, and flow summaries as input. Regenerated on structural changes.

---

## Naming Conventions

- **Folders** (at `kits/` level): `kebab-case`, unique across the repo.
- **Flow files** (`flows/<name>.ts`): `kebab-case`, matches the step `id` in `lamatic.config.ts`.
- **Extracted resources** use `<flow>_<node>` or `<flow>_<node>_<role>` naming:
  - `prompts/deep-search_llm-node_system.md`
  - `scripts/deep-search_code-node.ts`
  - `model-configs/deep-search_llm-node.ts`
- **Env vars**: `UPPER_SNAKE_CASE`.
- **Tags** in `lamatic.config.ts`: lowercase plain strings, no emojis.

---

## Tech Stack (for kits)

- **Framework:** Next.js 14-15, React 18, TypeScript
- **Styling:** Tailwind CSS v4+, CSS variables
- **UI:** shadcn/ui (Radix primitives)
- **Forms:** react-hook-form + zod
- **Icons:** lucide-react
- **SDK:** [`lamatic`](https://www.npmjs.com/package/lamatic) npm package
- **Deploy:** Vercel (with `@vercel/analytics`, `@vercel/blob` where applicable)
- **Per-kit dependencies:** Each kit's `apps/package.json` pins its own versions — no workspace hoisting.

Exception: [`kits/grammar-extension/`](./kits/grammar-extension/) is a Chrome extension (vanilla JS, manifest v3), not a Next.js app. Its `apps/` contains the extension code.

---

## Reference Kits

When adding a new contribution, copy the shape of one of these:

| Use Case | Reference |
|---|---|
| Template (single flow) | [`kits/article-summariser/`](./kits/article-summariser/) |
| Bundle (multi-flow, no UI) | [`kits/knowledge-chatbot/`](./kits/knowledge-chatbot/) |
| Kit (simple Next.js app) | [`kits/content-generation/`](./kits/content-generation/) |
| Kit (complex, many flows) | [`kits/deep-search/`](./kits/deep-search/) |

---

## What NOT to Do

- Don't modify kits outside the one you're working on.
- Don't inline prompts, model settings, code, or widget configs — they must be externalized and `@referenced`.
- Don't create directories outside `kits/<name>/`.
- Don't commit `.env` or `.env.local` files.
- Don't use old paths like `kits/agentic/`, `bundles/`, or `templates/` — the repo is flat.
- Don't use `config.json` as the metadata file — it's `lamatic.config.ts` now.
- Don't hand-edit node graphs in `flows/<name>.ts` unless you fully understand the node/edge schema. Prefer re-exporting from Lamatic Studio.
- Don't skip the README — every contribution needs one.

---

## See Also

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — step-by-step guide for adding a new contribution
- [`README.md`](./README.md) — project overview and featured kits
