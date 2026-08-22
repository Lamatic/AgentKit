# Repo Interview Prep

Turn any public GitHub repository into a complete, code-specific interview preparation brief in seconds.

Paste a repo URL. Get a 2-minute verbal pitch, 15 tailored follow-up questions with suggested answers, concepts to review, red flags in your code, and strengths to highlight — all grounded in what is actually in your project, not generic advice.

---

## What It Does

Most candidates struggle to talk about their own projects under pressure. They built the thing, but give vague answers when a senior engineer probes the architecture, trade-offs, or weak points. This kit reads your actual repo — the README, file structure, and tech stack — and generates a deeply technical prep brief tailored to your code.

**Output includes:**
- `project_summary` — concise 2-3 sentence overview of what the project actually does
- `tech_stack` — list of detected technologies
- `complexity_level` — junior / mid / senior signal
- `pitch` — a memorizable 2-minute verbal pitch in first-person spoken English
- `follow_up_questions` — 15 questions an interviewer would ask, with the signal they're testing and a strong suggested answer
- `concepts_to_review` — what to study before the interview, and how deep to go
- `red_flags` — what a senior engineer will push back on, and how to address it
- `strengths_to_highlight` — what genuinely shows strong engineering judgment in your code
- `architecture` — Mermaid.js system architecture diagram, data flow summary, and design trade-offs
- `grill_me` — 5 aggressive technical questions targeting real flaws, with defensive strategies for each
- `production` — a production-readiness verdict with critical gaps and concrete quick-win fixes

---

## Prerequisites

| Requirement | Details |
|---|---|
| Firecrawl API Key | Free at [firecrawl.dev](https://firecrawl.dev) — 500 pages/month free |
| LLM Credential | Any capable model; recommended: `gemini-2.0-flash` or `gpt-4o-mini` |
| Public GitHub Repo | The target repository must be publicly accessible |

---

## Setup

### 1. Lamatic Flow

1. **Add Firecrawl credential** in Lamatic Studio → Credentials → Firecrawl
2. **Select your LLM** in all four `Generate Text` nodes — configure model and credential
3. **Deploy the flow**

### 2. Next.js Dashboard (optional local UI)

```bash
cd apps
cp .env.example .env.local
# Fill in your values from Lamatic Studio → Settings → API Docs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

Send a POST request to the deployed flow endpoint:

```json
{
  "github_repo_url": "https://github.com/your-username/your-repo",
  "target_role": "SWE Intern",
  "jd_text": "We are looking for a backend engineer with experience in distributed systems...",
  "github_token": ""
}
```

| Field | Required | Description |
|---|---|---|
| `github_repo_url` | ✅ | Full GitHub repo URL |
| `target_role` | ❌ | Role you are interviewing for (improves question relevance) |
| `jd_text` | ❌ | Job description text (tailors questions to a specific role) |
| `github_token` | ❌ | GitHub personal access token (not required for public repos) |

---

## Example Response

```json
{
  "prep_brief": {
    "project_summary": "ATLAS is a distributed AI orchestration platform...",
    "tech_stack": ["Python", "FastAPI", "React", "Vite", "Docker", "Redis"],
    "complexity_level": "mid",
    "pitch": "For my project ATLAS, I built a distributed AI orchestration platform...",
    "follow_up_questions": [
      {
        "question": "How did you handle race conditions in the distributed queue?",
        "why_they_ask": "Testing your understanding of concurrent state management.",
        "suggested_answer": "I used Redis transactions (MULTI/EXEC) to ensure atomicity."
      }
    ],
    "concepts_to_review": [
      {
        "concept": "Distributed Locks",
        "why_relevant": "Critical for the queue worker implementation.",
        "depth_needed": "moderate"
      }
    ],
    "red_flags": [
      {
        "observation": "API lacks rate limiting.",
        "how_to_address": "Acknowledge it was out of scope for MVP, but suggest Redis sliding window."
      }
    ],
    "strengths_to_highlight": [
      "Clean separation of concerns between API and worker processes."
    ]
  },
  "architecture": {
    "mermaid_diagram": "graph TD\n  A[API] --> B[Worker]",
    "flow_summary": "Requests enter via FastAPI, are queued in Redis...",
    "tradeoffs": ["Chosen Redis over RabbitMQ for simplicity at the cost of durability"]
  },
  "grill_me": {
    "questions": [
      {
        "question": "Your job registry is in-memory. How does this fail under horizontal scaling?",
        "defensive_strategy": "I acknowledge this is an MVP trade-off. In production I would migrate state to Redis hashes..."
      }
    ]
  },
  "production": {
    "is_production_ready": false,
    "critical_missing_features": ["No CI/CD pipeline", "Missing auth middleware"],
    "quick_wins": ["Add a GitHub Actions workflow", "Add API key validation middleware"]
  }
}
```

---

## Flow Architecture

```text
API Trigger
    → Code Node              (parses GitHub URL into owner + repo)
    → Firecrawl Node         (scrapes repo page for README + file listing)
    → Generate Text #1       (LLM generates prep_brief as JSON)
    → Generate Text #2       (LLM generates architecture diagram + trade-offs)
    → Generate Text #3       (LLM generates grill_me simulation questions)
    → Generate Text #4       (LLM evaluates production readiness)
    → API Response           (returns all four sections)
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Output describes an "empty repo" | Firecrawl credential is missing or invalid — check credentials in Studio |
| Code node parse error | GitHub URL is malformed — use exact format: `https://github.com/owner/repo` |
| Output is not valid JSON | Switch to a stronger model (`gemini-1.5-pro` or `gpt-4o`) |
| Questions are too generic | Add `target_role` and `jd_text` to the request payload |
| `architecture`/`grill_me`/`production` is empty | Check that node IDs in the API Response mapping match your canvas node IDs |

---

## Author

Built by [Ganesh Bamalwa](mailto:ganeshbamalwa89@gmail.com) for the Lamatic AgentKit Challenge.
