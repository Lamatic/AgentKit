# Research Paper Analyzer

An AI-powered kit that takes any academic PDF URL and returns a structured breakdown:

- **Problem Statement** — what the research is trying to solve and why it matters
- **Methodology** — how the study was conducted
- **Key Findings** — the main results and conclusions
- **Limitations** — acknowledged weaknesses or gaps
- **Plain English Summary** — jargon-free explanation for non-specialists
- **Follow-up Questions** — ideas for future research directions

Built on [Lamatic.ai](https://lamatic.ai) with a Next.js + React frontend (JavaScript/JSX).

---

## Quick Start

### 1. Deploy the Flow in Lamatic Studio

1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) and create a new project
2. Create a new flow named `research-paper-analyzer`
3. Add nodes in this order:
   - **API Trigger** — input schema: `{ pdf_url: string }`
   - **Extract From File** — file URL: `{{trigger.pdf_url}}`
   - **LLM Node** — use prompt from `prompts/analyze-paper.md`, structured JSON output
   - **API Response** — output: `{{LLMNode.output}}`
4. Deploy the flow and copy the **Flow ID** from Settings

### 2. Set Up Environment Variables

```bash
cd apps
cp .env.example .env.local
```

Fill in `.env.local`:

```
RESEARCH_PAPER_ANALYZER_FLOW_ID=<your-flow-id>
LAMATIC_API_URL=<from Lamatic Settings>
LAMATIC_PROJECT_ID=<from Lamatic Settings>
LAMATIC_API_KEY=<from Lamatic Settings>
```

### 3. Run Locally

```bash
cd apps
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit/tree/main/kits/research-paper-analyzer/apps&env=RESEARCH_PAPER_ANALYZER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&root-directory=kits/research-paper-analyzer/apps)

---

## Usage

1. Paste any publicly accessible PDF URL (e.g., an arXiv paper)
2. Click **Analyze Paper**
3. Browse the structured breakdown — expand/collapse each section
4. Copy the full JSON output with the **JSON** button

### Example URLs to try

- `https://arxiv.org/pdf/2303.08774.pdf` — GPT-4 Technical Report
- `https://arxiv.org/pdf/1706.03762.pdf` — Attention Is All You Need

---

## Flow Architecture

```
[API Trigger]
     |
     v
[Extract From File]  ← downloads & parses PDF text
     |
     v
[LLM Node]           ← structured analysis via analyze-paper prompt
     |
     v
[API Response]       ← returns JSON
```

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React.js, JavaScript/JSX, Tailwind CSS
- **AI Orchestration**: Lamatic.ai flows
- **Deployment**: Vercel

---

## Requirements

- Node.js 18+
- npm 9+
- Lamatic.ai account ([sign up free](https://lamatic.ai))
- Vercel account (for deployment)
