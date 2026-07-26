# Reading List Digest

Index a reading list of public articles, then synthesize a citation-backed digest with per-article summaries, cross-source contradictions, consensus points, and highlighted key terms.

## What this bundle does

Two API flows prepare and consume a shared vector corpus:

1. **Index Articles** — scrape URLs with Firecrawl, chunk, embed, and index with composite keys (`citation_id`, `chunk_id`).
2. **Synthesize Digest** — vector-search the corpus, group hits by source, LLM-synthesize strict JSON, validate citations, and convert `**bold**` highlights to `<mark>`.

```
urls[]  →  Index Articles  →  Vector DB
query   →  Synthesize Digest  →  structured digest JSON
```

## When to use / when not to use

**Use when:**
- You have a fixed list of article URLs and want comparable, cited takeaways across them.
- You care about contradictions and consensus, not just a single summary.
- Callers consume structured JSON (API, notebook, downstream automation).

**Do not use when:**
- You only need a one-URL summary (prefer a single-article summariser template).
- Content is private / behind login that Firecrawl cannot reach.
- You need a chat widget UX (this bundle has no `apps/` and no chat trigger).

## Inputs

### Index Articles

| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | string[] or comma-separated string | Yes | Public article URLs to scrape and index (Firecrawl batch limit 10). |

Private Studio inputs: Firecrawl `credentials`, `vectorDB`, embedding model.

### Synthesize Digest

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Research question used for retrieval and echoed in the response. |
| `max_articles` | number | No | Max ranked sources to include (default `5`). |

Private Studio inputs: same `vectorDB` + embedding model as indexing; generative model for the LLM node.

## Outputs

`Synthesize Digest` returns JSON shaped like:

```json
{
  "query": "How do major actors propose regulating AI in 2025?",
  "executive_brief": [
    "Industry groups push for <mark>light-touch sectoral rules</mark> over a single statute [1].",
    "Civil-liberties advocates argue <mark>biometric bans</mark> and stronger transparency mandates [2].",
    "EU outlets emphasize implementation of the <mark>AI Act</mark> timeline and high-risk obligations [3].",
    "US legislative coverage stresses fragmented <mark>agency guidance</mark> versus comprehensive bills [4].",
    {
      "type": "sources",
      "items": [
        { "id": 1, "domain": "brookings.edu", "title": "…", "url": "https://…" },
        { "id": 2, "domain": "eff.org", "title": "…", "url": "https://…" },
        { "id": 3, "domain": "europa.eu", "title": "…", "url": "https://…" },
        { "id": 4, "domain": "artificialintelligenceact.eu", "title": "…", "url": "https://…" }
      ]
    }
  ],
  "article_summaries": [
    {
      "source_id": 1,
      "title": "…",
      "url": "https://…",
      "summary": "2–3 sentence summary.",
      "relevance": "high"
    }
  ],
  "cross_cutting_themes": [
    "Most sources treat binding rules for high-risk systems as increasingly likely [1, 3, 4]."
  ],
  "cross_source_contradictions": [
    {
      "topic": "Preferred regulatory posture",
      "claim_a": "Prefer voluntary standards and existing agency tools",
      "source_a_host": "brookings.edu",
      "claim_b": "Prefer hard bans and mandatory audits for high-risk AI",
      "source_b_host": "eff.org",
      "note": "Framing differs on whether innovation risk outweighs rights risk."
    }
  ],
  "consensus_points": [
    {
      "point": "Regulation of advanced AI is intensifying through 2025",
      "supporting_sources": [1, 3, 4],
      "excerpts": ["short quote a", "short quote b"]
    }
  ],
  "warnings": []
}
```

## How this kit runs

This contribution is a **kit**: two Lamatic flows plus a **Next.js app** under `apps/`.

| Layer | What it does |
|---|---|
| Lamatic Studio | Hosts and executes both flows. Firecrawl, Vector DB, embedding model, and LLM credentials are configured as **private node inputs** in Studio. |
| `apps/` | Web UI to index URLs and synthesize a digest. Calls your deployed flows via the Lamatic SDK. |

### Run the app locally

```bash
cd kits/reading-list-digest/apps
cp .env.example .env.local   # fill flow IDs + Lamatic API credentials
npm install
npm run dev
```

Open http://localhost:3000 — use tab **1. Index articles**, then **2. Synthesize digest**.

### Lamatic Studio (after you built the flows)

No graph changes are required if your two flows already match this repo. Confirm:

1. **Both flows are deployed** (not draft-only).
2. **Same Vector DB** on Index Articles (VectorDB node) and Synthesize Digest (Vector Search node).
3. **Same embedding model** on Vectorize + Vector Search.
4. Copy each flow’s **workflow ID** from Studio into `apps/.env.local`:
   - `INDEX_ARTICLES_FLOW_ID`
   - `SYNTHESIZE_DIGEST_FLOW_ID`
5. Ensure your Lamatic **project API key** can execute both flows (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`).

Optional: rename flows in Studio to `index-articles` and `synthesize-digest` to match `lamatic.config.ts` step ids (cosmetic only).

## Setup env

All env vars live in **`apps/`** only (standard for AgentKit kits with a Next.js app):

```bash
cd kits/reading-list-digest/apps
cp .env.example .env.local   # then edit with your real values
```

| Variable | Where you get it |
|---|---|
| `LAMATIC_API_URL` | Studio → project / workspace API host |
| `LAMATIC_PROJECT_ID` | Studio → project settings |
| `LAMATIC_API_KEY` | Studio → project API keys |
| `INDEX_ARTICLES_FLOW_ID` | Studio → Index Articles flow → details (after deploy) |
| `SYNTHESIZE_DIGEST_FLOW_ID` | Studio → Synthesize Digest flow → details (after deploy) |

Firecrawl, Vector DB, embedding model, and LLM are configured in **Lamatic Studio** on the flow nodes — not in `.env.local`.

## Invoke via curl (optional)

Load vars from `apps/.env.local`, then call the API:

```bash
cd kits/reading-list-digest/apps
set -a && source .env.local && set +a
```

**Index Articles**

```bash
curl -sS -X POST "$LAMATIC_API_URL/v1/flow/$INDEX_ARTICLES_FLOW_ID/execute" \
  -H "Authorization: Bearer $LAMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-project-id: $LAMATIC_PROJECT_ID" \
  -d '{
    "urls": [
      "https://example.com/pro-industry-ai-regulation",
      "https://example.com/civil-liberties-ai",
      "https://example.com/eu-ai-act-2025",
      "https://example.com/us-ai-legislation"
    ]
  }'
```

**Synthesize Digest** (run after indexing into the same Vector DB)

```bash
curl -sS -X POST "$LAMATIC_API_URL/v1/flow/$SYNTHESIZE_DIGEST_FLOW_ID/execute" \
  -H "Authorization: Bearer $LAMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-project-id: $LAMATIC_PROJECT_ID" \
  -d '{
    "query": "How do major actors propose regulating AI in 2025?",
    "max_articles": 4
  }'
```
## How contradictions and citations work

- **Numbered sources.** After retrieval, sources are numbered `1…N`. The LLM must cite facts as `[n]` or multi-cites like `[1, 3, 5]`.
- **Consensus collapsing.** Shared claims appear once in the executive brief with multiple citations and again under `consensus_points.supporting_sources`.
- **Contradictions.** Disagreements are recorded in `cross_source_contradictions` with `source_a_host` / `source_b_host` (hostname only). Contested spans in the brief also use markdown `**bold**`.
- **Highlights.** Post-process converts `**term**` → `<mark>term</mark>` in executive brief strings so UIs can render scan-friendly highlights without parsing markdown.
- **Invalid citations.** Unknown `[n]` values are removed and logged in `warnings` as `{ "type": "invalid_citation_dropped", "raw": "[7]", "context": "…" }`.
- **Sources block.** The last `executive_brief` element is always `{ "type": "sources", "items": [...] }` in order of first citation appearance. Items keep full `url` values.

## Failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Scrape / index failures | Firecrawl auth or blocked pages | Fix credentials; use public HTML articles |
| Empty digest | Empty or different Vector DB | Re-index; match Vector DB on both flows |
| Weak contradictions | Homogeneous corpus | Index multi-perspective sources (e.g. industry / NGO / EU / US) |
| Dropped citations in `warnings` | Model invented source ids | Lower temperature; re-run |
| Non-JSON response path | Model ignored schema | Confirm system prompt; use low temperature (~0.1–0.2) |

## Tags

`research` · `analysis` · `synthesis`

## Files

| Path | Role |
|---|---|
| `lamatic.config.ts` | Kit metadata and step wiring |
| `flows/index-articles.ts` | Ingestion flow graph |
| `flows/synthesize-digest.ts` | Retrieval + synthesis flow graph |
| `prompts/` | Digest system/user prompts |
| `scripts/` | Chunk, metadata, group-by-source, post-process |
| `model-configs/` | LLM node model placeholder refs |
| `constitutions/default.md` | Guardrails + synthesis rules |
| `agent.md` | Agent identity and operational reference |
| `apps/` | Next.js UI + `apps/.env.example` → copy to `apps/.env.local` |

---

*Contribution type: `kit` (flows + `apps/`).*
