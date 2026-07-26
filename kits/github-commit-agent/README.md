# GitHub Commit Agent by Lamatic.ai

<p align="center">
  <a href="https://github.com/Lamatic/AgentKit/tree/main/kits/github-commit-agent" target="_blank">
    <img src="https://img.shields.io/badge/Registry-GitHub%20Commit%20Agent-blue?style=for-the-badge" alt="GitHub Registry" />
  </a>
</p>

**GitHub Commit Agent** is an AI-powered release notes and commit history summarization tool built with [Lamatic.ai](https://lamatic.ai). It turns raw git commit history into clean, structured, human-readable developer updates. Users can simply paste a GitHub repository URL (e.g. `https://github.com/facebook/react`) or ask a natural language question (e.g. *"What changed in Lamatic/AgentKit since v1.0.0?"*) into a single search input to automatically locate tags, branch ranges, and diff limits.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/github-commit-agent/apps&env=GITHUB_COMMIT_AGENT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20GitHub%20Commit%20Agent%20keys%20are%20required.)

---

## The Problem

Every software team ships code constantly. But writing meaningful release notes, changelog entries, sprint updates, or change audits is tedious, always skipped, or reduced to lazy, uninformative commit copy-pastes like "bug fixes and improvements". 

When an incident occurs or stakeholders ask what shipped, team members waste 15-20 minutes digging through pull requests, diff ranges, and commit logs to figure out what changed and why.

**There is a clear need for a tool that sits directly between raw git history and human stakeholder communications, translating technical logs into plain English.**

---

## Who is it for?

* **Open-Source Maintainers** — Generate clean `CHANGELOG.md` updates before tagging new releases.
* **Engineering Teams & Managers** — Auto-summarize sprint changes to answer *"what shipped this sprint?"* instantly.
* **DevOps & SREs** — Quickly audit what went out before or after a production incident.
* **Product Managers** — Get non-technical, human-readable release notes ready for customer updates.
* **Junior Developers** — Understand an unfamiliar codebase's commit history in plain English.

---

## The Approach

GitHub Commit Agent is a single-purpose tool: input a natural language request, get a structured commit review, instantly.

**How it works:**

1. **User Message Trigger**: The user enters a query in natural language (e.g. *"What changed in Lamatic/AgentKit since v1.0.0?"* or *"Show vercel/next.js changes since last release"*).
2. **Intent Parsing**: An LLM parses the message, extracting the `repo`, `base_ref`, and `head_ref` as structured JSON.
3. **Commit Fetching & Auto-Detection**: A custom Code Node executes the GitHub Compare API. If refs are omitted (like asking "since last release"), it automatically queries repo tags or default branches to resolve the range.
4. **LLM Summarization**: A second LLM analyzes the subject lines of all commits in the range and writes a structured markdown document.

**Tech stack:**
- **Lamatic AI** — orchestrates the intent parsing, script execution, and commit analysis.
- **GitHub API** — retrieves commits, repository data, and tag references.
- **Next.js** — clean, fast frontend utilizing Tailwind CSS and Radix UI.
- **ReactMarkdown** — renders release notes with full GitHub Flavored Markdown (GFM) support.

---

## The Result

A clean, single-page app where users query repositories and get structured changelogs in seconds:

- **Features** — new enhancements, additions, and tools.
- **Bug Fixes** — resolved issues and stability improvements.
- **Maintenance** — documentation updates, dependency updates, and refactoring.
- **Ref Range Metadata** — displays the exact tag range or SHAs compared for maximum audit transparency.

---

## Setup & Run

### 1. Import the flow into Lamatic Studio

1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) and open your project
2. Connect your GitHub account and import `flows/github-commit-agent.ts`
3. Configure your preferred LLM provider in the model configs:
   - `model-configs/github-commit-agent_parse-intent.ts`
   - `model-configs/github-commit-agent_llm-node.ts`
4. Deploy the flow and copy your Flow ID

### 2. Configure environment variables

Create a `.env.local` file inside the `apps` directory:

| Variable | Required | Description |
|---|---|---|
| `LAMATIC_API_KEY` | ✅ | Your Lamatic API key (Settings → API Keys) |
| `LAMATIC_PROJECT_ID` | ✅ | Your Lamatic project ID |
| `LAMATIC_API_URL` | ✅ | Your Lamatic endpoint URL |
| `GITHUB_COMMIT_AGENT_FLOW_ID` | ✅ | Flow ID from Lamatic Studio after deployment |
| `GITHUB_TOKEN` | ⚠️ Optional | GitHub Personal Access Token — only needed for private repos or to avoid rate limits. **Note:** For deployed/production flows, configure this directly inside **Lamatic Studio Environment Variables** (Settings → Environment Variables). |

### 3. Run the App Locally

```bash
cd apps
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to use the UI.

---

## Extending & Connecting to Other Apps (Slack, Notion, Google Drive, etc.)

Because this agent is built on **Lamatic Studio**, you can easily connect the generated changelogs to your other work applications without writing any integration code:

1. **Open your flow** in [Lamatic Studio](https://studio.lamatic.ai).
2. Click the `+` button directly after the **Classify & Summarise Commits** node.
3. In the right-hand panel, select the **Apps** category.
4. Choose the application you want to connect:
   - **Slack**: Automatically post release notes to your `#announcements` or engineering channel.
   - **Notion**: Save changelog summaries into your release databases.
   - **Google Drive**: Export release summaries directly as text files to sharing folders.
   - **Gmail / Email**: Email updates to managers or stakeholders.
5. Securely authorize your account inside Lamatic, configure the action fields, and click **Deploy**.

---

## Smart Auto-Detection & Fallbacks

To ensure a frictionless user experience, the custom Code Node dynamically resolves references if they are omitted in the natural language message:

- **Both Refs Omitted** (e.g. *"Show changes for owner/repo"*):
  - Automatically queries the repository `/tags` API. 
  - **If tags exist:** Diffs the second-latest tag against the latest tag (ideal for standard release notes).
  - **If no tags exist:** Falls back to fetching the default branch (e.g., `main`) and compares the latest 10 commits.
- **Only Base Ref Omitted** (e.g. *"up to v1.2.0"*):
  - Queries tags and diffs against the tag immediately preceding `v1.2.0`.
- **Only Head Ref Omitted** (e.g. *"since v1.0.0"*):
  - Defaults the head ref to the default branch (e.g., `main`).

> [!TIP]
> **No Bottleneck:** When the user explicitly states both refs (e.g. *"Compare v1.0.0 and v1.1.0"*), the auto-detection is **completely bypassed** and calls the Compare API directly, ensuring maximum speed.

---

## Tradeoffs & Assumptions

- **Subject line vs. full commit diffs**: The agent fetches and processes commit subject lines rather than full code diff files. This ensures low latency and fits within LLM context windows, but depends on clean commit messages.
- **250 commit limit**: The GitHub Compare API caps returned commits at 250 per response. This is sufficient for standard releases and sprints, but extremely large ranges will truncate.
- **Rate limiting**: Public requests are subject to GitHub's 60 req/hr rate limit per IP. Setting a `GITHUB_TOKEN` is highly recommended for production endpoints.

---

## Tags

github, devtools, generative, automation, release

---

*Contributed by Kritiman Talukdar — AgentKit Challenge Submission*
