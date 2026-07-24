# Compliance Copilot by Lamatic.ai

**Compliance Copilot** is an AI-powered regulatory compliance auditor built with [Lamatic.ai](https://lamatic.ai). It uses a Generate JSON workflow to analyze any unstructured document against specific compliance guidelines and returns a structured gap analysis report with actionable remediation steps.

---

## Lamatic Setup

Before running this project, you must build and deploy the flow in Lamatic Studio, then wire its credentials into this codebase.

### Pre: Build in Lamatic

1. Sign in or sign up at [studio.lamatic.ai](https://studio.lamatic.ai)
2. Create a project (if you don't have one yet)
3. Click **"+ Create"** and select **Flow**
4. Add the following nodes to the canvas:
   - **API Request** (trigger) — with two input fields: `documentText` (String) and `guidelines` (String)
   - **Generate JSON** (Instructor LLM) — configure the system and user prompts (see `prompts/` directory for the exact text)
   - **API Response** — map the output variable to `{{InstructorLLMNode.output}}`
5. Deploy the flow

### Post: Wire into this repo

1. Navigate to **Setup** (top-right of your flow editor) and copy:
   - **API URL** (the GraphQL endpoint)
   - **Project ID**
   - **Flow ID**
2. Navigate to **Settings → API Keys** and copy your API key
3. Create `apps/.env.local` from the template:

```bash
cd apps
cp ../.env.example .env.local
```

4. Fill in the real values in `.env.local`

---

## 🔑 Required Keys and Config

| Variable | Purpose | Where to Find It |
|---|---|---|
| `LAMATIC_API_URL` | GraphQL endpoint for your project | Flow Editor → Setup → API URL |
| `LAMATIC_PROJECT_ID` | Your Lamatic project identifier | Flow Editor → Setup → Project ID |
| `LAMATIC_API_KEY` | Authentication for Lamatic APIs | Settings → API Keys |
| `COMPLIANCE_AUDIT` | The deployed flow ID | Flow Editor → Setup → Flow ID |

### Environment Variables

Create `apps/.env.local` with:

```bash
LAMATIC_API_URL=your_lamatic_graphql_endpoint
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_API_KEY=your_api_key
COMPLIANCE_AUDIT=your_compliance_audit_flow_id
```

### Install & Run

```bash
cd apps
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📂 Repo Structure

```text
compliance-copilot/
├── .env.example              # Environment variable template
├── .gitignore
├── README.md                 # This file
├── agent.md                  # Agent identity and capability doc
├── lamatic.config.ts         # Kit metadata (name, type, steps, links)
│
├── flows/
│   └── compliance-audit.ts   # Flow definition with nodes, edges, and @references
│
├── model-configs/            # LLM parameter and schema configurations
│   └── compliance-audit_instructor-llmnode-286_generative-model-name.ts
│
├── prompts/
│   ├── compliance-audit_instructor-llmnode-286_system_0.md   # System prompt
│   └── compliance-audit_instructor-llmnode-286_user_1.md     # User prompt template
│
├── constitutions/
│   └── default.md            # Guardrails for the AI agent
│
└── apps/                     # Next.js web application
    ├── package.json
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx      # Main compliance audit UI
    │   │   └── globals.css
    │   ├── actions/
    │   │   └── orchestrate.ts  # Server action calling Lamatic SDK
    │   └── lib/
    │       └── lamatic-client.ts  # Lamatic SDK client setup
    └── tsconfig.json
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](../../LICENSE).
