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

---

## Prerequisites

| Requirement | Details |
|---|---|
| Firecrawl API Key | Free at [firecrawl.dev](https://firecrawl.dev) — 500 pages/month free |
| LLM Credential | Any capable model; recommended: `gemini-2.0-flash` or `gpt-4o-mini` |
| Public GitHub Repo | The target repository must be publicly accessible |

---

## Setup

1. **Add Firecrawl credential** in Lamatic Studio → Credentials → Firecrawl
2. **Select your LLM** in the `Generate Text` node — configure model and credential
3. **Deploy the flow**

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
    "project_summary": "ATLAS is a distributed AI orchestration platform that converts natural language requests into structured workflows across Google Workspace APIs using a custom DAG-based parallel execution engine.",
    "tech_stack": ["Python", "FastAPI", "React", "Vite", "Docker", "Redis", "ChromaDB"],
    "complexity_level": "mid",
    "pitch": "For my project ATLAS, I built a distributed AI orchestration platform...",
    "follow_up_questions": [...],
    "concepts_to_review": [...],
    "red_flags": [...],
    "strengths_to_highlight": [...]
  }
}
```

---

## Flow Architecture

```
API Trigger
    → Code Node         (parses GitHub URL)
    → Firecrawl Node    (scrapes repo page for README + file listing)
    → Generate Text     (LLM generates the prep brief as JSON)
    → API Response
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Output describes an "empty repo" | Firecrawl credential is missing or invalid — check credentials in Studio |
| Code node parse error | GitHub URL is malformed — use exact format: `https://github.com/owner/repo` |
| Output is not valid JSON | Switch to a stronger model (`gemini-1.5-pro` or `gpt-4o`) |
| Questions are too generic | Add `target_role` and `jd_text` to the request payload |

---

## Author

Built by [Ganesh Bamalwa](mailto:ganeshbamalwa89@gmail.com) for the Lamatic AgentKit Challenge.
