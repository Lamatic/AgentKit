# 🎯 Interview Preparation Coach — AgentKit

An AI-powered interview preparation coach that evaluates candidate answers for both behavioral and technical questions, providing structured feedback with scores, strengths, areas for improvement, and better answer suggestions.

## What It Does

- Accepts a job description/question, candidate resume, and interview answer
- Evaluates the answer from **behavioral** and **technical** perspectives
- Returns a score (1–10), strengths, improvements, and a suggested better answer for each dimension
- Powered by Groq's `llama-3.1-8b-instant` model via Lamatic's InstructorLLM node

## Prerequisites

- [Lamatic Account](https://lamatic.ai) with the flow deployed
- [Groq API Key](https://console.groq.com) configured in Lamatic
- Node.js 18+

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `INTERVIEW_PREP_FLOW_ID` | Your Lamatic Flow ID |
| `LAMATIC_API_URL` | Your Lamatic API endpoint |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID |
| `LAMATIC_API_KEY` | Your Lamatic API key |

## Setup & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

Send a POST request to the API or use the UI:

```json
{
  "jobDescription": "Tell me about a time you resolved a conflict in your team.",
  "resume": "5 years of software engineering experience...",
  "userAnswer": "In my previous role, I encountered a disagreement between two engineers..."
}
```

### Example Response

```json
{
  "behavioral_score": 7,
  "behavioral_strengths": ["Good conflict awareness", "Clear communication"],
  "behavioral_improvements": ["Needs more specific outcomes", "Missing follow-up actions"],
  "behavioral_better_answer": "A stronger answer would include the specific steps taken...",
  "technical_score": 6,
  "technical_strengths": ["Understands the problem domain"],
  "technical_improvements": ["Lacks technical depth", "No metrics mentioned"],
  "technical_better_answer": "A more complete answer would reference specific tools used..."
}
```

## Flow Architecture

```
API Request → Behaviour_Prep (LLM) ─┐
                                     ├→ API Response
             Technical_Prep (LLM)  ─┘
```

## Lamatic Flow

- **Flow ID:** `89a0f4dc-3a9d-46c2-acdf-167ed4194583`
- **Model:** `groq/llama-3.1-8b-instant`
- **Provider:** Groq

## Contributing

See the main [CONTRIBUTING.md](https://github.com/Lamatic/AgentKit/blob/main/CONTRIBUTING.md) for guidelines.
