# Indie Founder Radar

AI agent that validates startup ideas by searching the web for real user complaints, competitor weaknesses, and market gaps — then delivers a structured report with a BUILD or SKIP verdict.

## What it does

1. Takes a startup idea as input
2. Searches the web for real user pain points in that space
3. Analyzes competitor weaknesses
4. Generates a structured market gap report
5. Returns a clear BUILD ✅ or SKIP ❌ verdict

## Setup

1. Import the flow into Lamatic Studio
2. Add your Serper API key in the Web Search node
3. Add your LLM API key in the Generate Text node
4. Deploy and test

## Required API Keys

- `SERPER_API_KEY` — get free at serper.dev
- `OPENAI_API_KEY` or `GEMINI_API_KEY` — for the LLM node

## Example Input

```json
{
  "idea": "AI tutoring app for college students"
}
```

## Example Output

- Top 3 pain points
- Competitor weaknesses
- Target audience
- Market opportunity
- BUILD or SKIP verdict
