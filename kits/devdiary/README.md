# 📔 DevDiary — Your Work, Remembered

**The problem:** developers juggling multiple projects can't remember what they did three weeks ago. `git log` technically has the answer, but it's per-repo, unreadable ("fix", "wip", "final v2"), and unsearchable in plain language.

**DevDiary** turns every GitHub push into a clean journal entry — written by an LLM that reads the **actual diffs**, not the commit messages — indexes it into a vector store, and lets you ask questions like:

> *"What did I work on last week?"* · *"When did I change the auth flow in dealdirect?"* · *"Give me a weekly digest across all my projects."*

## How it works

```
GitHub push ──> /api/github/webhook ──┐
                                      ├──> devdiary-log flow ──> Gemini reads diffs ──> journal entry ──> vector DB
"Sync" button in the UI ──────────────┘

Chat UI ─────> devdiary-ask flow ──> RAG over your entries ──> grounded answer with project + date citations
```

**Two Lamatic flows:**

| Flow | What it does |
|---|---|
| `devdiary-log` | Receives commit data → LLM writes a SUMMARY/DETAILS/TAGS journal entry from the diffs → vectorizes and indexes it with `project`, `repo`, `author`, `date` metadata |
| `devdiary-ask` | RAG retrieval over the diary → answers grounded in your logged entries, always citing project and date; refuses to invent work that isn't logged |

The Next.js app handles GitHub fetching (so your GitHub token stays in your env, never inside a flow), diff truncation, webhook signature verification, and the dashboard UI.

## Setup

### 1. Deploy the flows

1. Sign in at [studio.lamatic.ai](https://studio.lamatic.ai) and create a project
2. Import/recreate the two flows in [`flows/`](./flows) (`devdiary-log`, `devdiary-ask`)
3. Add a Gemini credential (free key from [Google AI Studio](https://aistudio.google.com)) with a chat model + `gemini-embedding-001`
4. Create a vector database named `devdiary` and select it in both the VectorDB (log flow) and RAG (ask flow) nodes
5. **Deploy** both flows

### 2. Run the app

```bash
cd kits/devdiary/apps
cp .env.example .env.local   # fill in the values below
npm install
npm run dev
```

| Env var | Where to get it |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project |
| `LAMATIC_API_URL` | Studio → API Docs → endpoint |
| `DEVDIARY_LOG_FLOW_ID` | `devdiary-log` flow → ⋮ → Copy Flow Id |
| `DEVDIARY_ASK_FLOW_ID` | `devdiary-ask` flow → ⋮ → Copy Flow Id |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → PAT (repo read scope). Optional for public repos |
| `GITHUB_WEBHOOK_SECRET` | Any random string; reuse it in the GitHub webhook config. Required for the webhook endpoint (unsigned requests are rejected) |

Open [http://localhost:3000](http://localhost:3000).

### 3. (Optional) Automatic logging on every push

In your GitHub repo → Settings → Webhooks → Add webhook:

- **Payload URL:** `https://<your-deployment>/api/github/webhook`
- **Content type:** `application/json`
- **Secret:** same value as `GITHUB_WEBHOOK_SECRET`
- **Events:** just the push event

Every push now writes a diary entry automatically.

## Usage

- **Sync panel** — enter `owner`, `repo`, branch and a day range → DevDiary fetches the commits + diffs, writes one journal entry, and indexes it
- **Chat panel** — ask anything about your logged work; answers cite project and date
- **Weekly digest button** — one click, a narrative of your week across all synced projects

## Design decisions & tradeoffs

- **Diffs over commit messages.** Commit messages lie ("fix", "wip"); diffs don't. The summarizer prompt explicitly instructs the model to derive truth from the code changes.
- **GitHub fetching lives in the app, not the flows.** Keeps your GitHub token in `.env.local` instead of inside an exported flow, and keeps the flows pure AI (summarize → index → retrieve).
- **Diff truncation caps** (per-file and total) keep token usage predictable on massive pushes.
- **Honest retrieval.** The ask flow is instructed to say "I don't have any logged work matching that" rather than hallucinate — a work journal you can't trust is worse than no journal.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| "Missing env var ..." | `.env.local` incomplete | Copy `.env.example`, fill all Lamatic values |
| "GitHub API 404" | Wrong owner/repo or private repo without token | Check spelling; set `GITHUB_TOKEN` |
| "GitHub API 403" | Rate limited | Set `GITHUB_TOKEN` |
| Chat says no logged work | Nothing indexed yet, or embedding model mismatch between flows | Sync a repo first; both flows must use the same embedding model |
| Webhook returns 401 | Secret mismatch | Same value in GitHub webhook config and `GITHUB_WEBHOOK_SECRET` |

## Author

Built by **Chirag Baldia** for the Lamatic AgentKit Challenge.
