# Reddit Scout by Lamatic.ai

<p align="center">
  <a href="#" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Reddit Scout** is an AI-powered product review research tool built with [Lamatic.ai](https://lamatic.ai). It searches Reddit for real user opinions and generates structured review summaries for any product or topic.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/reddit-scout&env=REDDIT_SCOUT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Reddit%20Scout%20keys%20are%20required.)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

**Pre: Build in Lamatic**
1. Sign in or sign up at https://lamatic.ai
2. Create a project (if you don't have one yet)
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
7. Copy the keys from your studio

**Post: Wire into this repo**
1. Create a .env file and set the keys
2. Install and run locally:
   - npm install
   - npm run dev
3. Deploy (Vercel recommended):
   - Import your repo, set the project's Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
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
| .env Key | Authentication for Lamatic AI APIs and Orchestration | [lamatic.ai](https://lamatic.ai) |
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

## How It Works

1. **User enters a product name** (e.g., "HP Victus", "Sony WH-1000XM5")
2. **AI generates a Reddit-scoped search query** (e.g., "site:reddit.com HP Victus reviews")
3. **Google Serper API searches** for relevant Reddit threads
4. **Serper scrape extracts** the full content of each Reddit thread
5. **AI analyzes all thread content** and generates a structured summary including:
   - Overall sentiment breakdown
   - What users love
   - Common complaints
   - Notable real user quotes
   - Frequently discussed features
   - Final verdict

---

## Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## License

MIT License
