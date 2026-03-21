# PR Review Agent

An AI-powered GitHub pull request reviewer built on [Lamatic.ai](https://lamatic.ai).

Paste any public GitHub PR URL and get a structured code review with file-level citations, actionable fixes, and a copy-paste-ready verdict — in seconds.

---

## What you get

- **Summary** — 3-4 sentences describing what the PR does, why it exists, and what systems it touches
- **Issues** — bugs, security holes, and edge cases with the exact file, line number, problematic code, and a ready-to-paste fix
- **Suggestions** — performance, style, test, and docs improvements with before/after code
- **Verdict** — `approve`, `needs_changes`, or `discuss`

---

## Demo

> 

---

## Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Lamatic account](https://lamatic.ai) — free trial available
- An LLM API key connected in Lamatic Studio (tested with Gemini 2.5 Pro, works with GPT-4o and Claude 3.5 Sonnet)

---

## Setup

### 1. Build the Lamatic flow

Follow [`flows/pr-review-flow/README.md`](./flows/pr-review-flow/README.md) to build and deploy the flow in Lamatic Studio. Copy your **Flow ID** once deployed.

### 2. Install dependencies

```bash
cd kits/automation/pr-review
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

| Variable | Where to find it |
|---|---|
| `PR_REVIEW_FLOW_ID` | Lamatic Studio → Flow → three-dot menu → Copy ID |
| `LAMATIC_API_URL` | Lamatic Studio → API Docs → Endpoint |
| `LAMATIC_PROJECT_ID` | Lamatic Studio → Settings → Project ID |
| `LAMATIC_API_KEY` | Lamatic Studio → Settings → API Keys |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a GitHub PR URL, and hit **Review PR**.

---

## Deploy to Vercel

1. Push your branch to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set **Root Directory** to `kits/automation/pr-review`
4. Add the four environment variables from above
5. Deploy — grab the live URL and add it to `config.json` → `demoUrl`

---

## How it works

```
User pastes PR URL
        ↓
Next.js server action (actions/orchestrate.ts)
        ↓
Lamatic flow:
  [Code node]          parse URL → owner / repo / pr_number
  [API node]           GET github.com/repos/{owner}/{repo}/pulls/{n}
                       Accept: application/vnd.github.v3.diff
  [Generate JSON node] LLM reviews diff → structured JSON
        ↓
Frontend renders:
  verdict badge · summary · issues with diff blocks · suggestions with fixes
```

---

## Private repos

Add a `GITHUB_TOKEN` to your `.env` and pass it as `Authorization: Bearer {{GITHUB_TOKEN}}` in the API node header inside Lamatic Studio.

---

## Tech stack

- [Next.js 14](https://nextjs.org) — frontend and server actions
- [Lamatic.ai](https://lamatic.ai) — flow orchestration and LLM execution
- [GitHub REST API](https://docs.github.com/en/rest) — PR diff fetching