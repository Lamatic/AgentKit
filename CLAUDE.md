# CLAUDE.md - AgentKit Repository Guide for Vibe Agents

## What is AgentKit?

AgentKit is an open-source repository by [Lamatic.ai](https://lamatic.ai) that provides ready-to-deploy AI agent starter projects. It contains **kits**, **bundles**, and **templates** — each serving a different level of complexity. Every project is built on top of Lamatic Flows (visual workflow graphs with LLM nodes, triggers, and data-source integrations) and is designed for 1-click Vercel deployment.

---

## Repository Structure

```
AgentKit/
├── kits/                  # Full projects: web app + flows
│   ├── agentic/           # Autonomous reasoning agents
│   ├── assistant/         # Context-aware helpers
│   ├── automation/        # Business process automation
│   ├── embed/             # Embeddable AI widgets
│   └── sample/            # Reference implementation
├── bundles/               # Multi-flow packs (no web app)
├── templates/             # Single-flow exports (minimal)
├── public/                # Shared static assets
├── CONTRIBUTING.md        # Contributor guide
├── CHALLENGE.md           # Internship/hackathon challenge
└── CLAUDE.md              # This file
```

### Contribution Types

| Type | What it is | Has Web App? | Location |
|------|-----------|-------------|----------|
| **Kit** | Full project with UI, server actions, and one or more Lamatic flows | Yes | `kits/<category>/<kit-name>/` |
| **Bundle** | Multiple related flows packaged together with a config | No | `bundles/<bundle-name>/` |
| **Template** | A single exported Lamatic flow | No | `templates/<template-name>/` |

---

## Kit Architecture (Two Halves)

Every kit has two main parts:

### 1. Flows (`flows/` directory)
The backend logic — exported from Lamatic Studio. Each flow is a directory containing:
- `config.json` — Workflow graph (nodes + edges defining the pipeline)
- `inputs.json` — Input schema for LLM/dynamic nodes (model selections, private configs)
- `meta.json` — Name, description, author, tags, test inputs
- `README.md` — Auto-generated flow documentation

Node types in flow configs:
- **triggerNode** — Entry point (API Request, Chat Widget, Webhook)
- **dynamicNode** — Processing (LLM, RAG, Extract File, Code, Response)
- **stickyNoteNode** — In-editor documentation

### 2. Web App (Next.js application)
The frontend + server-side glue. Standard structure:
```
app/                 # Next.js App Router pages & API routes
actions/             # Server actions calling Lamatic flows (orchestrate.ts)
components/          # React components (shadcn/ui based)
  └── ui/            # shadcn/ui primitives
hooks/               # Custom React hooks
lib/                 # Utilities (lamatic-client.ts, helpers)
styles/              # CSS / Tailwind styles
public/              # Static assets
```

---

## Tech Stack

- **Framework:** Next.js 14-15, React 18, TypeScript
- **Styling:** Tailwind CSS v4+, CSS variables
- **UI Library:** shadcn/ui (Radix UI primitives underneath)
- **Forms:** react-hook-form + zod validation
- **Icons:** lucide-react
- **API Client:** `lamatic` npm package
- **Deployment:** Vercel (with @vercel/analytics, @vercel/blob)
- **Build:** next.config.mjs ignores ESLint & TypeScript errors during build

Exception: `kits/assistant/grammar-extension` is a Chrome extension (vanilla JS, manifest v3).

---

## Creating a New Kit

When creating a new kit, follow the structure of `kits/sample/content-generation/` as the reference implementation.

### Required Files

```
kits/<category>/<kit-name>/
├── .env.example           # Placeholder env vars (NEVER real secrets)
├── .gitignore
├── README.md              # What it does, setup steps, env vars, usage
├── config.json            # Kit metadata (see format below)
├── package.json           # Dependencies & scripts
├── components.json        # shadcn/ui config
├── next.config.mjs
├── tsconfig.json
├── postcss.config.mjs
├── actions/
│   └── orchestrate.ts     # Server action calling Lamatic flows
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/                # shadcn/ui components used by this kit
├── flows/
│   └── <flow-name>/
│       ├── config.json
│       ├── inputs.json
│       ├── meta.json
│       └── README.md
├── hooks/
├── lib/
│   └── lamatic-client.ts
└── styles/
```

### Kit config.json Format

```json
{
  "name": "Kit Display Name",
  "description": "One-line description of what this kit does.",
  "tags": ["category-emoji Category", "feature-emoji Feature"],
  "author": {
    "name": "Author Name",
    "email": "author@email.com"
  },
  "steps": [
    {
      "id": "flow-id-matching-folder-name",
      "type": "mandatory",
      "envKey": "ENV_VAR_NAME_FOR_THIS_FLOW"
    }
  ],
  "integrations": [],
  "features": [],
  "demoUrl": "",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/<category>/<kit-name>",
  "deployUrl": "",
  "documentationUrl": ""
}
```

Step types:
- `"mandatory"` — Required flow, always included
- `"any-of"` — User picks from options (uses `minSelection`, `maxSelection`, and `options` array)

### Kit Categories

Choose from existing categories or create a new one if justified:
- `agentic` — Autonomous reasoning/planning agents
- `assistant` — Interactive helpers (chat, extensions)
- `automation` — Business workflow automation
- `embed` — Embeddable widgets (chat, search, sheets)

---

## Creating a New Bundle

Bundles combine multiple flows without a web app.

```
bundles/<bundle-name>/
├── config.json            # Bundle metadata + step definitions
├── README.md              # What the bundle does and how to use it
└── flows/
    ├── <flow-1>/
    │   ├── config.json
    │   ├── inputs.json
    │   ├── meta.json
    │   └── README.md
    └── <flow-2>/
        └── ...
```

Bundle config.json uses the same format as kits but typically has `"any-of"` steps for data-source selection and `"mandatory"` steps for the core flow.

---

## Creating a New Template

Templates are the simplest — a single exported Lamatic flow.

```
templates/<template-name>/
├── config.json            # Flow graph (nodes + edges)
├── inputs.json            # Node input schemas
├── meta.json              # Flow metadata
└── README.md              # Flow documentation
```

Use kebab-case for the folder name. The config.json here is a **flow-level** config (nodes/edges), not a kit-level config.

---

## Naming Conventions

- **Folder names:** `kebab-case` (e.g., `deep-search`, `blog-automation`)
- **Flow IDs:** `kebab-case`, matching the flow folder name
- **Env vars:** `UPPER_SNAKE_CASE` (e.g., `AGENTIC_REASONING_GENERATE_STEPS`)
- **Files:** Follow existing patterns — `orchestrate.ts`, `lamatic-client.ts`, `page.tsx`
- **Components:** PascalCase for React component files in `components/`

---

## Environment Variables

Every kit must include a `.env.example` with placeholder values. Common variables:

```env
LAMATIC_API_URL = "YOUR_API_ENDPOINT"
LAMATIC_PROJECT_ID = "YOUR_PROJECT_ID"
LAMATIC_API_KEY = "YOUR_API_KEY"
FLOW_ID_VAR = "YOUR_FLOW_ID"
```

Never commit real secrets. The `.gitignore` must exclude `.env` and `.env.local`.

---

## Build & Run Commands

From any kit directory:

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
```

Bundles and templates have no runnable app — they are flow definitions only.

---

## PR Checklist for Contributors

### For Kits:
- [ ] Follows `kits/<category>/<kit-name>/` structure
- [ ] `config.json` present with valid metadata and step definitions
- [ ] `.env.example` has placeholders only (no real secrets)
- [ ] `README.md` documents setup, env vars, and usage
- [ ] All flows exported in `flows/` with config.json, inputs.json, meta.json, README.md
- [ ] `npm run dev` works locally
- [ ] Vercel deployment tested (if applicable)

### For Bundles:
- [ ] Follows `bundles/<bundle-name>/` structure
- [ ] `config.json` present with correct flow references
- [ ] All flows exported in `flows/`
- [ ] `README.md` documents what the bundle does
- [ ] No secrets committed

### For Templates:
- [ ] Follows `templates/<template-name>/` structure
- [ ] All 4 flow files present (config.json, inputs.json, meta.json, README.md)
- [ ] No secrets committed

---

## Scaling Guidelines for Open-Source Contributors

This repo receives many community PRs. Follow these practices to keep it healthy:

### 1. Isolation by Design
Each kit/bundle/template is self-contained in its own folder. Do not create cross-dependencies between projects. Shared assets go in `public/`. This lets any project be added or removed without breaking others.

### 2. Use the Sample Kit as a Template
Always start from `kits/sample/content-generation/` when creating a new kit. Copy its structure rather than inventing a new one. This ensures consistency across contributions.

### 3. Pin Dependencies
Every kit must have its own `package.json` with pinned dependency versions. Do not rely on workspace-level hoisting or a root package.json.

### 4. Keep Flows Exportable
Flows in `flows/` should always be valid Lamatic Studio exports. Do not hand-edit flow `config.json` files unless you know the node/edge schema. Re-export from Studio if changes are needed.

### 5. Validate Before Submitting
- Run `npm install && npm run dev` locally
- Test the full user flow end-to-end
- Verify `.env.example` has all required vars documented
- Ensure no secrets or API keys are committed

### 6. Documentation is Non-Negotiable
Every contribution needs a `README.md` that explains: what it does, prerequisites, setup steps, and usage. Other contributors and users will rely on this to understand and deploy your work.

### 7. Category Discipline
Place kits in the correct category. If unsure, look at existing kits in each category for guidance. Don't create new categories unless the existing ones clearly don't fit.

### 8. Small, Focused Contributions
One kit/bundle/template per PR. Don't bundle unrelated changes. This makes review faster and reduces merge conflicts.

### 9. Consistent Config Metadata
Fill out all fields in `config.json` — name, description, tags, author, steps. This metadata powers the platform's discovery and deployment features.

### 10. Flow Naming Alignment
The flow folder name, the flow ID in `config.json` steps, and the corresponding `envKey` should all be semantically aligned:
- Folder: `agentic-generate-content/`
- Step ID: `agentic-generate-content`
- Env key: `AGENTIC_GENERATE_CONTENT`

---

## Common Patterns

### Server Action (actions/orchestrate.ts)
Server actions call Lamatic flows via the SDK. They read flow IDs from env vars and pass user input to the flow API. See `kits/sample/content-generation/actions/orchestrate.ts` for the reference pattern.

### Lamatic Client (lib/lamatic-client.ts)
Initializes the Lamatic SDK with `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY`. All kits should use this shared client pattern.

### Data Source Integrations
Many kits support multiple data sources (Google Drive, Google Sheets, OneDrive, PostgreSQL, S3, SharePoint, web scraping). These are represented as `"any-of"` steps in config.json with each option mapping to a separate flow in `flows/`.

---

## What NOT to Do

- Don't commit `.env`, `.env.local`, or any file with real API keys
- Don't modify other kits/bundles/templates in your PR
- Don't add root-level dependencies or configs unless coordinated with maintainers
- Don't hand-edit flow `config.json` node graphs — use Lamatic Studio export
- Don't create deeply nested or unconventional folder structures
- Don't skip the README — undocumented contributions will be rejected
