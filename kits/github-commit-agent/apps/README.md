# GitHub Commit Agent Web App

This is the Next.js web application frontend for the **GitHub Commit Agent** kit, built using Next.js, Tailwind CSS, Radix UI, and the Lamatic TypeScript SDK.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/github-commit-agent/apps&env=GITHUB_COMMIT_AGENT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20GitHub%20Commit%20Agent%20keys%20are%20required.)

---

## Setup & Running Locally

Before running the Next.js application, ensure you have imported and deployed the flow in Lamatic Studio and copied your Flow ID.

### 1. Configure Environment Variables

Create a `.env.local` file in this directory (`kits/github-commit-agent/apps`):

```bash
GITHUB_COMMIT_AGENT_FLOW_ID="YOUR_LAMATIC_FLOW_ID"
LAMATIC_API_URL="YOUR_LAMATIC_API_ENDPOINT"
LAMATIC_PROJECT_ID="YOUR_LAMATIC_PROJECT_ID"
LAMATIC_API_KEY="YOUR_LAMATIC_API_KEY"

# Optional: Set this to avoid GitHub public rate limiting or query private repos
GITHUB_TOKEN="YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
```

### 2. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Deployment (Vercel)

You can deploy this Next.js app to Vercel in a few clicks:

1. Connect your fork repository to Vercel.
2. Under **Project Settings**, set the **Root Directory** to `kits/github-commit-agent/apps`.
3. Add the required Environment Variables listed in the table above.
4. Click **Deploy**.

---

## Repository Structure

```text
/apps
 ├── /actions
 │    └── orchestrate.ts      # Server Action initiating Lamatic execution
 ├── /app
 │    ├── layout.tsx          # Main HTML structure and metadata
 │    ├── page.tsx            # Natural language query search form & results UI
 │    └── globals.css         # Styling directives and Design tokens
 ├── /components
 │    ├── header.tsx          # Navigation header with GitHub links
 │    └── /ui                 # Polished visual elements (Buttons, Spacing)
 ├── /lib
 │    ├── lamatic-client.ts   # Instantiates the Lamatic SDK Client
 │    └── utils.ts            # Helper function for conditional classNames
 ├── orchestrate.js           # Orchestration metadata mappings
 ├── package.json             # Dev dependencies and Next.js start scripts
 └── tsconfig.json            # TypeScript settings
```
