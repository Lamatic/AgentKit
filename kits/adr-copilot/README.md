# 🏛️ ADR Copilot — Architecture Decision Record Agent Kit

[![Lamatic Kit](https://img.shields.io/badge/Lamatic-Agent%20Kit-blueviolet)](https://lamatic.ai)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ADR Copilot** is a fullstack Agent Kit powered by [Lamatic.ai](https://lamatic.ai) that turns raw engineering design proposals, RFC drafts, and technical notes into standardized **Markdown Architecture Decision Records (MADR 3.0)**, option comparison matrices, risk assessments, and Mermaid.js component diagrams.

---

## ✨ Key Features

- 📝 **Automated MADR 3.0 Generation**: Converts informal design notes into industry-standard MADR records.
- ⚖️ **Multi-Option Trade-off Analysis**: Compares technical alternatives with explicit pros and cons.
- 🎯 **Decision Drivers & Forces**: Identifies critical forces (latency budgets, cost limits, team stack expertise).
- 📊 **Visual Component Architecture**: Automatically produces Mermaid.js diagrams for visual clarity.
- ⚡ **Interactive Next.js UI**: Live preview, instant copying, markdown file export, and preset scenario templates.

---

## 📁 Kit Structure

```
kits/adr-copilot/
├── lamatic.config.ts         # Project metadata & flow mapping
├── agent.md                  # Agent capability & identity documentation
├── README.md                 # Setup & usage instructions
├── .env.example              # Root environment template
├── constitutions/
│   └── default.md            # Guardrails & safety rules
├── flows/
│   └── adr-copilot.ts        # Self-contained Lamatic flow definition
├── prompts/                  # Extracted system & user prompts
│   ├── adr-copilot_system.md
│   └── adr-copilot_user.md
├── scripts/                  # Flow post-processing scripts
│   ├── adr-copilot_parse-json.ts
│   └── adr-copilot_finalise-output.ts
├── model-configs/            # Model settings
│   └── adr-copilot_llm.ts
└── apps/                     # Runnable Next.js 15 Web Application
    ├── package.json
    ├── app/                  # Next.js App Router
    ├── components/           # UI components & ADR viewer
    ├── actions/orchestrate.ts# Server Action calling Lamatic flow SDK
    └── lib/lamatic-client.ts # Lamatic SDK client initialization
```

---

## 🚀 Quickstart

### 1. Prerequisites

- Node.js 18+
- Lamatic account ([lamatic.ai](https://lamatic.ai))

### 2. Deploy Flow in Lamatic Studio

1. Import or create the `adr-copilot` flow in Lamatic Studio.
2. Deploy the flow and copy your **Flow ID**, **API Key**, **Project ID**, and **API Endpoint**.

### 3. Setup Local Web App

```bash
cd kits/adr-copilot/apps
cp .env.example .env.local
```

Fill in `.env.local`:
```env
LAMATIC_API_KEY=your_lamatic_api_key
LAMATIC_PROJECT_ID=your_lamatic_project_id
LAMATIC_API_URL=https://api.lamatic.ai
LAMATIC_FLOW_ID=your_deployed_flow_id
```

Install dependencies and run:
```bash
npm install
npm run dev
```

Open `http://localhost:3000` to launch ADR Copilot! 🚀

---

## ⚖️ Tradeoffs & Assumptions

### Design Decisions
| Decision | Chosen Approach | Alternative | Reason |
|---|---|---|---|
| Output format | MADR 3.0 (Markdown) | Custom schema / PDF | MADR is an industry standard; Markdown is VCS-friendly |
| Diagram rendering | Mermaid.js (client-side) | Static image generation | No server round-trip; interactive "code" view toggle is useful |
| JSON parsing | Script-based post-processing | Structured LLM output mode | More portable across different LLM providers |
| Flow runtime | Lamatic SDK `executeFlow` | Direct REST calls | SDK abstracts auth and retries cleanly |

### Known Assumptions
- The LLM must return valid JSON matching the ADR schema. The `parse-json.ts` script applies a best-effort cleanup but cannot recover from completely malformed output.
- Mermaid diagram quality depends on LLM reasoning. Complex microservice topologies may produce less accurate diagrams.
- The kit assumes a single deployed `adr-copilot` flow per project instance.

### Known Limitations
- No streaming — generation is a single synchronous call. Large proposals may hit timeout limits.
- No persistence — generated ADRs exist only in the browser session until exported.

---

## 🛡️ License

MIT License. Free to use and contribute!
