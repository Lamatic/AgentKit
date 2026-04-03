# PageIndex NotebookLM — AgentKit

Upload any PDF and chat with it using **vectorless, tree-structured RAG** — powered **end-to-end by Lamatic AI flows**.

> **No vector database. No external Python server. No custom backend code.**
> Just 4 Lamatic flows + a Next.js frontend that implements the full PageIndex pipeline — from PDF ingestion to tree-navigated question answering — entirely within Lamatic's orchestration layer.

---

## What Makes This Different

Most RAG implementations require a vector database, an embedding model, a retrieval server, and often a separate Python backend. **This kit eliminates all of that.**

The entire PageIndex pipeline — TOC detection, tree construction, page indexing, summary generation, tree-navigated search, and LLM answering — is implemented as **4 Lamatic AI flows** with zero external servers or Python code. The Next.js frontend communicates exclusively with Lamatic's flow execution API via the official `lamatic` SDK.

### Key Highlights

- **100% Lamatic-powered backend** — all document processing, indexing, retrieval, and answering logic lives inside Lamatic flows
- **No vector DB** — uses a hierarchical tree index (built from the document's table of contents) instead of vector embeddings
- **No external server** — no FastAPI, no Railway, no Python — the Lamatic flows handle everything
- **No chunking** — sections are identified by their structural position in the document, not arbitrary text splits

---

## Architecture

```text
┌────────────────────────────────────────────────────┐
│                  Next.js Frontend                  │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ │
│  │ Document │ │   Chat   │ │  Tree  │ │Document │ │
│  │  Upload  │ │  Window  │ │ Viewer │ │  List   │ │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └────┬────┘ │
│       │             │           │            │      │
│  ┌────┴─────────────┴───────────┴────────────┴───┐  │
│  │         Server Actions (orchestrate.ts)       │  │
│  └────────────────────┬──────────────────────────┘  │
│                       │                             │
│            Lamatic SDK (lamatic npm)                │
└───────────────────────┼─────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           │    Lamatic AI Platform   │
           │                          │
           │  Flow 1: Upload + Index  │
           │  Flow 2: Chat + Retrieve │
           │  Flow 3: List Documents  │
           │  Flow 4: Tree / Delete   │
           │                          │
           │     ┌──────────────┐     │
           │     │   Supabase   │     │
           │     │  (PostgreSQL) │     │
           │     └──────────────┘     │
           └──────────────────────────┘
```

---

## How It Works

### Document Ingestion (Flow 1)

When a PDF is uploaded, the Lamatic flow runs a multi-stage pipeline:

1. **TOC Detection** — scans the first pages to locate the table of contents
2. **TOC Extraction** — multi-pass extraction with completion verification
3. **TOC → JSON** — structured flat list with hierarchy identifiers (`1`, `1.1`, `1.2.3`)
4. **Physical Index Assignment** — verifies each section starts on the correct page
5. **Tree Build** — nested tree structure with exact `start_index` + `end_index` per section
6. **Summary Generation** — 1–2 sentence summary per node
7. **Page Verification** — fuzzy-matches node titles against actual page text
8. **Save** — stores the tree + metadata in Supabase

### Chat & Retrieval (Flow 2)

At query time, the LLM navigates the tree like a table of contents:
1. Receives the full tree structure with section titles and summaries
2. Selects the most relevant leaf nodes based on the query
3. Fetches verbatim page content using exact `start_index → end_index` ranges
4. Generates an answer grounded in the retrieved content

The frontend receives the answer, the retrieved nodes with page ranges, and the LLM's tree-navigation reasoning — all displayed in the UI.

---

## Stack

| Layer | Technology |
|---|---|
| Orchestration & Backend | **Lamatic AI** (4 flows — no external server) |
| Storage | **Supabase** (PostgreSQL) |
| Frontend | **Next.js 15** (App Router, Server Actions) |
| Styling | **CSS custom properties** (dark-mode design system) |
| SDK | **`lamatic`** npm package |

---

## Features

- **PDF Upload** — drag-and-drop or paste a URL
- **Tree-Structured RAG** — vectorless retrieval using hierarchical document index
- **Multi-Turn Chat** — conversational history maintained across messages
- **Chat Persistence** — conversations saved to `localStorage`, survive page navigations
- **Interactive Tree Viewer** — explore the full document structure, nodes highlight on retrieval
- **Source Panel** — view retrieved sections with page ranges and LLM reasoning
- **Document Management** — list all documents, view trees, delete documents
- **Markdown Rendering** — AI responses rendered with headings, lists, bold, code
- **Responsive Dark UI** — premium design system with animations and micro-interactions

---

## Prerequisites

- [Lamatic AI](https://lamatic.ai) account (free)
- [Supabase](https://supabase.com) account (free tier)
- Node.js 18+

> **That's it.** No Groq account, no Railway, no Python environment needed.

---

## Setup

### 1. Set Up Supabase

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
-- Only the Supabase service role (used server-side in Lamatic flows) can
-- read and write documents. No direct client-side access is permitted.
create policy "service_role_only" on documents
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

### 2. Import Lamatic Flows

Import all 4 flows from the `flows/` folder into Lamatic Studio:

| Flow | Folder | Purpose |
|---|---|---|
| Upload | `flows/flow-1-upload-pdf-build-tree-save/` | PDF → 7-stage pipeline → tree index → Supabase |
| Chat | `flows/chat-with-pdf/` | Tree search → page fetch → LLM answer |
| List | `flows/flow-list-all-documents/` | List all documents from Supabase |
| Tree | `flows/flow-4-get-tree-structure/` | Return full tree JSON or delete a document |

Add these secrets in **Lamatic → Settings → Secrets**:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | From Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Settings → API — **server-side only, never expose client-side** |

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Store it in Lamatic Secrets only — never in `.env.local` shipped to the browser.

### 3. Install and Configure

```bash
cd kits/assistant/pageindex-notebooklm
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```env
LAMATIC_API_KEY=...          # Lamatic → Settings → API Keys
LAMATIC_PROJECT_ID=...       # Lamatic → Settings → Project ID
LAMATIC_API_URL=...          # Lamatic → Settings → API Docs → Endpoint

FLOW_ID_UPLOAD=...           # Flow 1 → three-dot menu → Copy ID
FLOW_ID_CHAT=...             # Flow 2 → three-dot menu → Copy ID
FLOW_ID_LIST=...             # Flow 3 → three-dot menu → Copy ID
FLOW_ID_TREE=...             # Flow 4 → three-dot menu → Copy ID
```

### 4. Run Locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```text
pageindex-notebooklm/  (TypeScript · Next.js/React)
├── actions/
│   └── orchestrate.ts        # TypeScript — Server actions — all 4 flow calls via Lamatic SDK
├── app/
│   ├── globals.css            # CSS — Design system (custom properties, animations)
│   ├── layout.tsx             # TSX/React — Root layout with metadata
│   └── page.tsx               # TSX/React — Main page — document list + chat + tree viewer
├── components/
│   ├── ChatWindow.tsx         # TSX/React — Chat UI with markdown, sources, persistence
│   ├── DocumentList.tsx       # TSX/React — Document sidebar with search + delete
│   ├── DocumentUpload.tsx     # TSX/React — Drag-and-drop / URL upload
│   └── TreeViewer.tsx         # TSX/React — Interactive hierarchical tree viewer
├── flows/
│   ├── flow-1-upload-pdf-build-tree-save/
│   ├── chat-with-pdf/
│   ├── flow-list-all-documents/
│   └── flow-4-get-tree-structure/
├── lib/
│   ├── lamatic-client.ts      # TypeScript — Lamatic SDK initialization
│   └── types.ts               # TypeScript — Shared interfaces and types
├── config.json                # Kit metadata
└── .env.example               # Environment variable template
```

---

## Deploying to Vercel

```bash
git checkout -b feat/pageindex-notebooklm
git add kits/assistant/pageindex-notebooklm/
git commit -m "feat: PageIndex NotebookLM — end-to-end Lamatic-powered tree RAG"
git push origin feat/pageindex-notebooklm
```

Then in Vercel:
1. Import your repo
2. Set **Root Directory** → `kits/assistant/pageindex-notebooklm`
3. Add all 7 env vars from `.env.local`
4. Deploy

---

## Author

**Saurabh Tiwari** — [st108113@gmail.com](mailto:st108113@gmail.com)
GitHub: [@Skt329](https://github.com/Skt329)
