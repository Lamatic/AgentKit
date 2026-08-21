# ProjectPilot AI — Final Year Project Mentor

ProjectPilot AI guides engineering students from picking a final year project through to being ready to build, document, and defend it. Give it your branch, interest, skill level, timeline, and team type, and it walks you through three grounded stages: project discovery, technical blueprinting, and execution planning.

> ProjectPilot AI is a planning aid. It does not write your code, guarantee project approval, or replace guidance from your actual project supervisor.

## What it solves

Choosing a final year project is often the hardest part — students either pick something too ambitious, too generic, or with no clear execution path. ProjectPilot AI turns a handful of inputs into a specific, buildable project idea with a concrete tech stack, a week-by-week roadmap, and interview/viva prep material — all grounded in the exact idea and stack chosen, not generic filler.

## Capabilities

- Generates 5-8 project ideas ranked by difficulty, industry relevance, and innovation score, based on branch, interest, skill level, duration, and team type.
- Recommends a specific frontend, backend, database, AI/ML framework, and deployment platform for a chosen idea, with an architecture explanation and relevant datasets/APIs.
- Produces a week-by-week development roadmap, a ~150-word abstract, five viva questions (beginner to advanced), and three ATS-friendly resume bullet points — all explicitly grounded in the chosen project and its actual tech stack, never generic filler.

## Architecture

```text
Browser
  → Next.js form (branch, interest, skill level, duration, team type)
      → Lamatic SDK
          → discovery-flow    (API Request → Generate JSON → API Response)
      → user selects an idea
      → Lamatic SDK
          → blueprint-flow    (API Request → Generate JSON → API Response)
      → user confirms
      → Lamatic SDK
          → execution-flow    (API Request → Generate JSON → API Response)
      → final results screen (roadmap, abstract, viva questions, resume bullets)
```

Three independent, sequentially-chained Lamatic flows, each with its own trigger, structured-output LLM node, and response mapping.

### Flow inputs

**discovery-flow**

| Input | Type | Description |
|---|---|---|
| `branch` | string | Engineering branch (e.g. CSE, AIML, ECE, IT) |
| `interest` | string | Area of interest (e.g. AI/ML, Web Development, IoT) |
| `skillLevel` | string | Beginner, Intermediate, or Advanced |
| `duration` | string | 1 month, 3 months, or 6 months |
| `teamType` | string | Individual or Team |

**blueprint-flow**

| Input | Type | Description |
|---|---|---|
| `selectedIdea` | string | Title of the chosen project idea |
| `skillLevel` | string | Beginner, Intermediate, or Advanced |

**execution-flow**

| Input | Type | Description |
|---|---|---|
| `selectedIdea` | string | Title of the chosen project idea |
| `blueprint` | string | JSON-stringified blueprint from blueprint-flow |
| `duration` | string | Project timeline |

## Repository structure

```text
projectpilot-ai/
├── apps/                  # Next.js application
├── constitutions/         # Agent-level behavioral guardrails
├── flows/                 # discovery-flow.ts, blueprint-flow.ts, execution-flow.ts
├── model-configs/         # Generate JSON model configuration per flow
├── prompts/               # Externalized system and user prompts per flow
├── agent.md               # Agent identity and operations reference
└── lamatic.config.ts      # AgentKit metadata and flow setup
```

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A Lamatic account and deployed copies of `discovery-flow`, `blueprint-flow`, and `execution-flow`
- A configured structured-generation model credential in Lamatic (this kit uses Groq's `llama-3.3-70b-versatile`)

## Lamatic setup

1. Import or recreate the three flows in `flows/` in Lamatic Studio.
2. Configure each flow's Generate JSON node with a supported model credential.
3. Test each flow with sample input matching the schemas above.
4. Deploy all three flows.
5. Copy each Flow ID, plus the Project ID, project API endpoint, and a Lamatic API key.

Provider credentials (e.g. Groq keys) stay inside Lamatic. They are not application environment variables.

## Application setup

```bash
cd kits/projectpilot-ai/apps
cp .env.example .env.local
npm install --legacy-peer-deps
npm run dev
```

Fill in `apps/.env.local`:

```env
DISCOVERY_FLOW_ID=your_discovery_flow_id
BLUEPRINT_FLOW_ID=your_blueprint_flow_id
EXECUTION_FLOW_ID=your_execution_flow_id
LAMATIC_API_URL=your_lamatic_project_api_url
LAMATIC_PROJECT_ID=your_lamatic_project_id
LAMATIC_API_KEY=your_lamatic_api_key
```

Open `http://localhost:3000`. Real credentials belong only in `.env.local` and deployment secrets; never commit them.

## Validation

From `apps/`:

```bash
npm run build
```

Recommended acceptance tests:

1. Submit the form with a specific branch/interest combination and confirm the returned ideas are plausible and varied, not repeated templates.
2. Select an idea and confirm the blueprint explicitly names that idea and recommends a coherent stack for it.
3. Generate the execution plan and confirm the abstract, roadmap, viva questions, and resume bullets all reference the specific project name and its actual tech stack — not generic machine-learning boilerplate.
4. Run the form twice with different inputs and confirm the two runs produce meaningfully different, appropriately grounded output.

## Known limitations

- Project ideas, tech stack recommendations, and roadmaps are AI-generated suggestions and should be reviewed by a project supervisor before formal submission.
- Duration estimates are approximate and may not account for institution-specific milestones.
- The tool does not verify real-world dataset availability or licensing terms for suggested datasets.

## Deployment

Deploy `kits/projectpilot-ai/apps` as the Vercel root directory and configure the six application environment variables listed above.

## Responsible use

Use ProjectPilot AI to accelerate project selection and planning, then validate the chosen idea and roadmap with your actual project supervisor or mentor before committing to it.