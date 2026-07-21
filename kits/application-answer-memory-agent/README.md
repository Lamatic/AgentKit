# Application Answer Memory Agent

Reuses and adapts a job applicant's previous application answers to draft
consistent, honest responses to new application questions — instead of
rewriting the same story from scratch on every job board.

---

## The problem

Most job application forms ask variations of the same few questions. Without
a system, applicants either:

- Rewrite every answer from scratch (slow, and tone drifts between
  applications), or
- Copy-paste one generic answer everywhere (fast, but ignores what the
  specific question actually asked).

This agent takes a middle path: give it your past answers as plain text and
a new question, and it drafts a response that reuses your real facts and
voice, adapted to the new phrasing — and says so honestly if it has nothing
relevant to draw from.

---

## Features

- **Context-aware drafting** — adapts existing answers to a differently
  worded question instead of returning them unchanged.
- **No fabrication** — the system prompt explicitly forbids inventing facts,
  numbers, or experiences not present in the supplied history.
- **Honest fallback** — if nothing in the past answers is relevant, the
  agent says so and answers generically from the question alone.

---

## Tech Stack

- **Frontend:** Next.js, React
- **Backend:** Lamatic AI Flow (GraphQL API)
- **Model:** `groq/llama-3.3-70b-versatile`

---

## Prerequisites

- Node.js 18+
- npm
- A Lamatic account with this flow deployed

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/application-answer-memory-agent/apps
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

4. **Fill in your Lamatic credentials in `.env.local`**

```env
LAMATIC_API_KEY=YOUR_API_KEY
LAMATIC_PROJECT_ID=YOUR_PROJECT_ID
LAMATIC_API_URL=YOUR_API_URL
LAMATIC_FLOW_ID=YOUR_FLOW_ID
```

5. **Run the project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

1. Paste your **previous application answers** (any format — a few
   `Q: ... / A: ...` pairs works well) into the "Past answers" field.
2. Paste the **new question** you need to answer.
3. Click **Draft Answer**.
4. Review and tweak the draft before submitting it — this is a starting
   point, not a substitute for a final read-through.

---

## Project Structure

```
application-answer-memory-agent/
├── agent.md               # Agent identity and capability doc
├── lamatic.config.ts      # Kit metadata
├── flows/                 # Exported Lamatic flow
├── prompts/                # Externalized system/user prompts
├── model-configs/          # Externalized model configuration
├── constitutions/          # Guardrails / identity rules
└── apps/                   # Next.js app
    ├── app/                 # Pages
    ├── components/          # UI components
    ├── actions/             # Server actions
    ├── lib/                 # Lamatic API client
    └── .env.example         # Environment template
```

---

## Lamatic Flow

- **Flow name:** `application-answer-memory-agent`
- **Type:** Synchronous GraphQL Workflow
- **Model:** `groq/llama-3.3-70b-versatile`

---

## Example Input

**Past answers:**

```
Q: Why do you want to work with us?
A: Honestly, I got tired of just calling an API and hoping the output made
sense. I built a job-matching bot using the Claude API — it scrapes
LinkedIn, scores listings against my resume, dumps the good ones into a
spreadsheet — and that's when I realized what I actually enjoy is the layer
underneath: retrieval, orchestration, deployment. Not just prompting.
```

**New question:**

```
What excites you about this role?
```

**Output includes:** a drafted answer reusing the applicant's own project
and reasoning, reworded to fit the new question.

---

## Contribution

Built as part of a Lamatic AgentKit challenge submission.

## Author

**Nicolas Brun**
