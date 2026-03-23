# Founder Lens — Analyze Flow

## Trigger Input
```json
{
  "idea": "string",
  "userId": "string",
  "sessionId": "string"
}
```

## Response Output
```json
{
  "brief": "string (JSON)",
  "decomposition": "string (JSON)"
}
```

## What It Does
Runs a 7-phase autonomous research pipeline:
1. Deconstructs the idea into a structured decomposition with 8 search queries
2. Runs 9 parallel Exa.ai searches (market, VC trends, competitors, dead startups, customer voice, reviews, LinkedIn complaints, success stories, business model, unfair advantage)
3. Consolidates all search results into phase-labelled context strings
4. Runs a contrarian VC persona to find fatal flaws
5. Synthesizes everything into a comprehensive Founder Brief JSON
6. Vectorizes and indexes the brief facts to Weaviate (founderLensBriefs2)
7. Stores the brief in semantic memory (founderLensChatHistory)

## Required Credentials in Lamatic
- OpenRouter (for Claude 3.5 Sonnet and GPT-4o)
- Gemini (for gemini-embedding-001 embeddings)
- Exa.ai (for web search — x-api-key header)
