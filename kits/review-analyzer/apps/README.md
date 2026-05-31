# Reddit Scout by Lamatic.ai

<p align="center">
  <a href="https://reddit-scout-tawny.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Reddit Scout** is an AI-powered product review research tool built with [Lamatic.ai](https://lamatic.ai). It searches Reddit for real user opinions and generates structured, scannable review summaries for any product or topic.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/reddit-scout&env=REDDIT_SCOUT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Reddit%20Scout%20keys%20are%20required.)

---

## The Problem

When researching a product before buying, the most honest opinions live on Reddit — not in influencer reviews or star ratings. But finding and reading through dozens of Reddit threads is time-consuming. People manually Google "site:reddit.com [product] reviews", open 10 tabs, read hundreds of comments, and try to mentally synthesize what the consensus is. This takes 15-20 minutes per product and is hard to do consistently.

**Nobody has built a focused tool that automates this specific workflow.**

## The Approach

Reddit Scout is a single-purpose tool: type a product name, get a structured review summary from Reddit.

**How it works:**

1. User enters a product or topic (e.g., "HP Victus", "Sony WH-1000XM5")
2. An LLM generates Reddit-scoped search queries
3. Google Serper API finds the most relevant Reddit threads
4. Serper's scrape endpoint extracts full thread content (posts + comments)
5. A second LLM analyzes all content and produces a structured summary

**Tech stack:**
- **Lamatic AI** — orchestrates the entire flow (search, scrape, analyze)
- **Google Serper API** — Reddit-scoped web search and thread scraping
- **Next.js** — clean, fast frontend
- **ReactMarkdown** — renders AI output as formatted markdown

## The Result

A clean, single-page app where users type a product name and get a structured review in seconds:

- **Overall Sentiment** — positive/negative split at a glance
- **What Users Love** — key pros from real users
- **Common Complaints** — honest downsides
- **Notable User Quotes** — direct quotes with context
- **Frequently Discussed Features** — what keeps coming up
- **Final Verdict** — direct recommendation

**Live demo:** [reddit-scout-tawny.vercel.app](https://reddit-scout-tawny.vercel.app/)

## Tradeoffs & Assumptions

- **Scrape vs. full crawl:** We use Serper's scrape endpoint (single-page) instead of Firecrawl (which doesn't support Reddit). This means we get thread content but not all nested comments — we capture the most relevant discussion.
- **10 threads per search:** We scrape the top 10 Reddit results. This balances speed (~20s) with coverage. More threads would mean longer wait times.
- **No caching:** Every search hits the API fresh. Adding a cache layer would reduce costs for repeated queries but wasn't needed for this scope.
- **Single product search:** No comparison mode (e.g., "X vs Y") — keeping the scope narrow and the output clean.

---

## Lamatic Setup

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

**Pre: Build in Lamatic**
1. Sign in or sign up at https://lamatic.ai
2. Create a project
3. Click "+ New Flow" and select "Flow"
4. Build the Reddit Scout flow:
   - Trigger Node (GraphQL) with input `{ "query": "string" }`
   - LLM Node: Generate Reddit search query
   - Web Search Node (Serper): Search Google scoped to Reddit
   - Code Node: Extract URLs from search results
   - Batch Node: Iterate over URLs
   - Web Search Node (Serper Scrape): Scrape each Reddit thread
   - Code Node: Extract all scraped text
   - LLM Node: Analyze and generate structured review summary
   - Response Node: Return with output mapping `{ "answer": "{{LLMNode.output.generatedResponse}}" }`
5. Configure providers and API credentials (Serper API key)
6. Deploy the flow in Lamatic and obtain your .env keys

**Post: Wire into this repo**
1. Create a `.env` file and set the keys
2. Install and run locally:
   - `npm install`
   - `npm run dev`
3. Deploy (Vercel recommended):
   - Import your repo, set the project's Root Directory to `kits/agentic/reddit-scout`
   - Add env vars in Vercel (same as your `.env`)
   - Deploy and test your live URL

---

## Key Features
- Searches Reddit for product reviews using Google Serper API
- Scrapes full Reddit thread content via Serper scrape endpoint
- AI-generated structured review summaries with sentiment analysis
- Pros/cons extraction and notable user quotes
- Clean markdown rendering of results

---

## Required Keys and Config

| Item | Purpose | Where to Get It |
|------|---------|-----------------|
| Lamatic API Key | Authentication for Lamatic AI APIs | [lamatic.ai](https://lamatic.ai) |
| Serper API Key | Google Search API for Reddit search | [serper.dev](https://serper.dev) |

### 1. Environment Variables

Create `.env.local` with:

```bash
REDDIT_SCOUT_FLOW_ID = "YOUR_FLOW_ID"
LAMATIC_API_URL = "YOUR_API_ENDPOINT"
LAMATIC_PROJECT_ID = "YOUR_PROJECT_ID"
LAMATIC_API_KEY = "YOUR_API_KEY"
```

### 2. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Repo Structure

```
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration
/app
 └── page.tsx              # Main search form UI
/components
 ├── header.tsx            # Header component
 └── ui                    # shadcn/ui components
/lib
 └── lamatic-client.ts     # Lamatic SDK client
/public
 └── lamatic-logo.png      # Lamatic branding
/flows
  └── reddit-scout/        # Exported Lamatic flow
/package.json              # Dependencies & scripts
```

---

## License

MIT License

