# Code Review Agent

An agentic Next.js starter kit that performs AI-powered code reviews on GitHub Pull Requests using Lamatic Flows. Enter any public GitHub PR and get a structured analysis of bugs, security vulnerabilities, and style issues in seconds.

## Live Demo

[agent-kit-stk.vercel.app](https://agent-kit-stk.vercel.app)

---

## What It Does

The agent takes three inputs — GitHub owner, repository, and PR number — then runs a multi-step agentic flow:

1. **Fetches** the PR diff from the GitHub REST API
2. **Extracts** the raw patch content from all changed files
3. **Analyzes bugs** — null pointer risks, logic errors, runtime failures
4. **Analyzes security** — hardcoded secrets, injection risks, insecure dependencies
5. **Analyzes style** — naming conventions, complexity, readability
6. **Synthesizes** a concise overall summary of PR quality

Results are returned as structured JSON and rendered in a premium dark-themed UI with severity-aware triage cards.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.1, React 19 |
| AI Flow | Lamatic Flows (GraphQL API) |
| LLM | Groq — `llama-3.3-70b-versatile` |
| GitHub Data | GitHub REST API |
| Deployment | Vercel |

---

## Prerequisites

- Node.js 18+
- A [Lamatic](https://lamatic.ai) account with the Code Review Agent flow deployed
- A [Groq](https://console.groq.com) API key (free)
- A [GitHub](https://github.com) account (for public PR access)

---

## Environment Variables

Create a `.env` file in the kit root:

```bash
AGENTIC_GENERATE_CONTENT="your-deployed-flow-id"
LAMATIC_API_URL="https://your-org.lamatic.dev"
LAMATIC_PROJECT_ID="your-project-id"
LAMATIC_API_KEY="your-api-key"
```

## Lamatic Flow Setup

This kit requires a Lamatic flow with the following node structure:

```text
API Request Trigger (owner, repo, pr_number)
       ↓
Code Node — extract diff from GitHub API response
       ↓
GitHub API Node — GET /repos/{owner}/{repo}/pulls/{pr_number}/files
       ↓
Generate JSON — Bug Analysis
       ↓
Generate JSON — Security Scan
       ↓
Generate JSON — Style Check
       ↓
Generate JSON — Final Merge (summary)
       ↓
API Response
```

Import the exported flow from the `flows/` directory into your Lamatic project, deploy it, then copy the deployed flow id into `AGENTIC_GENERATE_CONTENT`.

---

## Running Locally

```bash
# 1. Install dependencies
cd kits/agentic/code-review
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in all Lamatic values from your project

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. Enter the GitHub **owner** (e.g. `fmtlib`)
2. Enter the **repository** name (e.g. `fmt`)
3. Enter the **PR number** (e.g. `4660`)
4. Click **Review PR**

The agent will fetch the diff and return:

- **Summary** — a concise 2-3 sentence overview of PR quality
- **Bugs** — logic errors and runtime risks with severity levels (High / Medium / Low)
- **Security** — vulnerability findings with severity levels
- **Style** — readability and code quality suggestions

---

## Project Structure

```text
kits/agentic/code-review/
├── app/
│   ├── api/
│   │   └── review/
│   │       └── route.ts       # Calls Lamatic GraphQL API
│   ├── page.tsx               # Main UI
│   ├── layout.tsx
│   └── globals.css
├── flows/
│   └── code-review-agent/      # Exported Lamatic flow
├── .env.example
├── config.json
├── package.json
└── README.md
```

---

## API Reference

### `POST /api/review`

**Request:**
```json
{
  "owner": "fmtlib",
  "repo": "fmt",
  "pr_number": "4660"
}
```

**Response:**
```json
{
  "summary": "The PR introduces a new is_container_adaptor trait...",
  "bugs": [
    { "line": "776", "issue": "Potential null pointer risk", "severity": "High" }
  ],
  "security": [
    { "line": "765", "issue": "Insecure dependency", "severity": "Low" }
  ],
  "style": [
    "code style",
    "readability issues"
  ]
}
```

---

## Deployment

Deploy to Vercel in one click:

1. Fork this repository
2. Import to [vercel.com](https://vercel.com)
3. Set Root Directory to `kits/agentic/code-review`
4. Add environment variable: `LAMATIC_API_KEY`
5. Add `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `AGENTIC_GENERATE_CONTENT`
6. Deploy

---

![alt text](image.png)

---

## Author

Built by [Soumik](https://github.com/soumik15630m) as a contribution to [Lamatic AgentKit](https://github.com/Lamatic/AgentKit).
