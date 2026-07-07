# Outreach Personalizer - Personalized Outreach Generator

Outreach Personalizer is a web application that wraps a deployed Lamatic.ai AI flow. It automatically crawls a prospect company's website and founder's public profile, extracts concrete technical signals/milestones, connects them to a candidate's custom background, and drafts a highly personalized, high-specificity cold outreach email.

## Key Features
- **Crawls Website Content**: Leverages Firecrawl integration inside the Lamatic flow to scrape company data.
- **Specific Signal Hook Extraction**: Uses an LLM to identify specific achievements, posts, or bugs rather than generic praises.
- **Value-Added Asset Suggestion**: Suggests a concrete asset the pitch candidate could build in under 2 hours to showcase capabilities.
- **Tailored Outreach Generation**: Drafts a clean, direct outreach email (80-120 words) with a specific call to action.
- **Premium Dark UI**: Glassmorphic, modern responsive web dashboard with step-by-step agent feedback and copy support.
- **Safe Server-Side Calls**: Never exposes secret credentials to the client side.
- **Resilient Error Interception**: Catches non-JSON / HTML gateway errors gracefully.

---

## Setup Instructions

### Prerequisites
- Node.js v18.0.0 or higher
- npm or yarn

### 1. Configure Environment Variables
Create a file named `.env.local` in the `apps/web/` directory (or copy it from the workspace root) and define the following variables:

```env
# The secret credential used to authenticate your client requests (do not share or commit)
LAMATIC_API_KEY=your_lamatic_api_key

# The project identifier in the Lamatic Cloud Studio
LAMATIC_PROJECT_ID=your_lamatic_project_id

# The base URL endpoint for your deployed project (e.g. https://<org>-<project>.lamatic.dev)
LAMATIC_API_URL=your_lamatic_api_url

# The UUID indicating which specific flow to trigger (e.g. Outreach Personalizer)
FLOW_ID=your_deployed_flow_id
```

> [!IMPORTANT]
> Never commit `.env.local` to source control. It is already added to `.gitignore` to prevent secret exposure.

### 2. Install Dependencies
Change into the `apps/web` directory and install the required modules:
```bash
cd apps/web
npm install
```

### 3. Run Locally
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Architectural Details & Integration

The app initiates execution of the Lamatic flow using a Next.js Server Handler at `apps/web/app/api/generate/route.ts`. 

```
                                          ┌────────────────────────┐
                                          │     Next.js Client     │
                                          └───────────┬────────────┘
                                                      │ POST (JSON Inputs)
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Next.js Server App Router                                                                   │
│                                                                                             │
│  ┌────────────────────────┐               ┌──────────────────┐                              │
│  │   API Route Handler    ├──────────────►│  Lamatic Client  │                              │
│  │  (api/generate/route)  │  Executes     │ (lib/lamatic.ts) │                              │
│  └────────────────────────┘  Client       └─────────┬────────┘                              │
└─────────────────────────────────────────────────────┼───────────────────────────────────────┘
                                                      │ GraphQL POST Request
                                                      ▼
                                           ┌──────────────────────┐
                                           │  Lamatic.ai Gateway  │
                                           └──────────────────────┘
```

1. **Client Trigger**: The client form sends `company_url`, `founder_linkedin_url`, and `candidate_context` to the local Next.js `/api/generate` handler.
2. **GraphQL Wrapping**: The `LamaticClient` wrapper formats the GraphQL mutation request using `FLOW_ID` as the workflow identifier.
3. **Execution**: The request is securely dispatched to the deployed endpoint (`LAMATIC_API_URL`) authorized by `LAMATIC_API_KEY`.
4. **Resilient Parsing**: The response text is scanned for HTML content (e.g. Cloudflare error pages) to ensure that raw parse exceptions are intercepted and displayed to the user as a friendly warning.
