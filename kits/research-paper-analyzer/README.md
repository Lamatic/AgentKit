# Research Paper Analyzer

An AI-powered kit that takes any academic PDF URL and returns a structured breakdown:

- **Problem Statement** — what the research is trying to solve and why it matters
- **Methodology** — how the study was conducted
- **Key Findings** — the main results and conclusions
- **Limitations** — acknowledged weaknesses or gaps
- **Plain English Summary** — jargon-free explanation for non-specialists
- **Follow-up Questions** — ideas for future research directions

Built on [Lamatic.ai](https://lamatic.ai) with a **FastAPI** backend and a **React + Vite** frontend (JavaScript/JSX).

---

## Architecture

```
React (Vite/JSX)  →  FastAPI (Python)  →  Lamatic Flow  →  LLM
   frontend              backend            orchestration
 localhost:5173       localhost:8000
```

---

## Quick Start

### 1. Deploy the Flow in Lamatic Studio

1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) → New Project → New Flow
2. Add nodes in this order:
   - **API Trigger** — input schema: `{ pdf_url: string }`
   - **Extract From File** — file URL: `{{trigger.pdf_url}}`
   - **LLM Node** — use prompt from `prompts/analyze-paper.md`, structured JSON output
   - **API Response** — output: `{{LLMNode.output}}`
3. Deploy the flow and copy the **Flow ID** from Settings

### 2. Start the FastAPI Backend

```bash
cd apps/backend
cp .env.example .env
# Fill in your Flow ID and Lamatic credentials in .env
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at [http://localhost:8000](http://localhost:8000).  
Check [http://localhost:8000/docs](http://localhost:8000/docs) for the auto-generated API docs.

`.env` values to fill in:
```
RESEARCH_PAPER_ANALYZER_FLOW_ID=<your-flow-id>
LAMATIC_API_URL=<from Lamatic Settings>
LAMATIC_PROJECT_ID=<from Lamatic Settings>
LAMATIC_API_KEY=<from Lamatic Settings>
```

### 3. Start the React Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend runs at [http://localhost:5173](http://localhost:5173).  
Vite proxies `/analyze` → FastAPI automatically, so no CORS issues in dev.

---

## Usage

1. Paste any publicly accessible PDF URL (e.g., an arXiv paper)
2. Click **Analyze Paper**
3. Browse the structured breakdown — expand/collapse each section
4. Click **JSON** to copy the raw JSON output

### Example URLs to try

- `https://arxiv.org/pdf/2303.08774.pdf` — GPT-4 Technical Report
- `https://arxiv.org/pdf/1706.03762.pdf` — Attention Is All You Need

---

## API Reference

### `POST /analyze`

**Request:**
```json
{ "pdf_url": "https://arxiv.org/pdf/2303.08774.pdf" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "...",
    "authors": ["..."],
    "year": 2023,
    "problem_statement": "...",
    "methodology": "...",
    "key_findings": ["..."],
    "limitations": ["..."],
    "plain_english_summary": "...",
    "follow_up_questions": ["..."]
  }
}
```

---

## Tech Stack

- **Backend**: FastAPI, Python, httpx, Pydantic, python-dotenv
- **Frontend**: React.js, Vite, JavaScript/JSX, Tailwind CSS, Lucide React
- **AI Orchestration**: Lamatic.ai flows

---

## Requirements

- Python 3.10+
- Node.js 18+, npm 9+
- Lamatic.ai account ([sign up free](https://lamatic.ai))
