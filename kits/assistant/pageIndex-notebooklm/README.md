# PageIndex NotebookLM — AgentKit

Upload any PDF and chat with it using **vectorless, tree-structured RAG**.  
No vector database. No chunking. Just a hierarchical document index built from the table of contents.

---

## How It Works

A 7-stage FastAPI pipeline (running on Railway, powered by Groq) processes each PDF:

1. **TOC Detection** — concurrent LLM scan of first 20 pages
2. **TOC Extraction** — multi-pass extraction with completion verification
3. **TOC → JSON** — structured flat list with hierarchy (`1`, `1.1`, `1.2.3`)
4. **Physical Index Assignment** — verify each section starts on the correct page (±3 scan)
5. **Tree Build** — nested structure with exact `start_index` + `end_index` per section
6. **Summaries** — concurrent 1-2 sentence summary per node (≤200 chars)
7. **Page Verification** — fuzzy match each node title against actual page text

At query time, the LLM navigates the tree like a table of contents to pick the right sections, then fetches verbatim page content using the exact `start_index → end_index` range.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Orchestration | Lamatic AI (4 flows) |
| LLM | Groq — llama-3.3-70b-versatile (multi-key pool, free tier) |
| Indexing API | FastAPI on Railway |
| Storage | Supabase (PostgreSQL) |
| Frontend | Next.js + Tailwind CSS |

---

## Prerequisites

- [Lamatic AI](https://lamatic.ai) account (free)
- [Groq](https://console.groq.com) account (free — create multiple for key pool)
- [Railway](https://railway.app) account (for FastAPI server)
- [Supabase](https://supabase.com) account (free tier)
- Node.js 18+

---

## Setup

### 1. Deploy the FastAPI Server (Railway)

```bash
# Clone your fork, then:
cd pageindex-server   # contains main.py + requirements.txt
railway init
railway up
```

Add these environment variables in Railway dashboard:

| Variable | Value |
|----------|-------|
| `SERVER_API_KEY` | Any secret string (e.g. `openssl rand -hex 16`) |
| `GROQ_API_KEY_1` | First Groq API key |
| `GROQ_API_KEY_2` | Second Groq API key (optional — more keys = higher throughput) |

Note your Railway URL: `https://your-app.up.railway.app`

### 2. Set Up Supabase

Run this SQL in Supabase SQL Editor:

```sql
create table documents (
  id uuid default gen_random_uuid() primary key,
  doc_id text unique not null,
  file_name text,
  file_url text,
  tree jsonb,
  raw_text text,
  tree_node_count integer default 0,
  status text default 'completed',
  created_at timestamptz default now()
);
alter table documents enable row level security;
create policy "service_access" on documents for all using (true);
```

### 3. Set Up Lamatic Flows

Import all 4 flows from the `flows/` folder into Lamatic Studio, then add these secrets in **Lamatic → Settings → Secrets**:

| Secret | Value |
|--------|-------|
| `SERVER_API_KEY` | Same value as Railway |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | From Supabase Settings → API |

### 4. Install and Configure the Kit

```bash
cd kits/assistant/pageindex-notebooklm
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
LAMATIC_API_KEY=...          # Lamatic → Settings → API Keys
LAMATIC_PROJECT_ID=...       # Lamatic → Settings → Project ID
LAMATIC_API_URL=...          # Lamatic → Settings → API Docs → Endpoint

FLOW_ID_UPLOAD=...           # Flow 1 → three-dot menu → Copy ID
FLOW_ID_CHAT=...             # Flow 2 → three-dot menu → Copy ID
FLOW_ID_LIST=...             # Flow 3 → three-dot menu → Copy ID
FLOW_ID_TREE=...             # Flow 4 → three-dot menu → Copy ID
```

### 5. Run Locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Flows

| Flow | File | Purpose |
|------|------|---------|
| Upload | `flows/pageindex-upload/` | Download PDF → 7-stage pipeline → save tree to Supabase |
| Chat | `flows/pageindex-chat/` | Tree search → page fetch → Groq answer |
| List | `flows/pageindex-list/` | List all documents from Supabase |
| Tree | `flows/pageindex-tree/` | Return full tree JSON for a document |

---

## Deploying to Vercel

```bash
# Push your branch first
git checkout -b feat/pageindex-notebooklm
git add kits/assistant/pageindex-notebooklm/
git commit -m "feat: Add PageIndex NotebookLM — vectorless tree-structured RAG"
git push origin feat/pageindex-notebooklm
```

Then in Vercel:
1. Import your forked repo
2. Set **Root Directory** → `kits/assistant/pageindex-notebooklm`
3. Add all 7 env vars from `.env.local`
4. Deploy

---

## Author

**Saurabh Tiwari** — [st108113@gmail.com](mailto:st108113@gmail.com)  
GitHub: [@Skt329](https://github.com/Skt329)
