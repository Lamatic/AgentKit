# Contributing to Lamatic AgentKit

Thank you for your interest in improving AgentKit! This guide walks you through building a kit in Lamatic, exporting it, and contributing it to the repository with a high-quality PR.

## Table of Contents
- [Quick Start (TL;DR)](#quick-start-tldr)
- [Prerequisites](#prerequisites)
- [Step 1: Build Your Kit in Lamatic](#step-1-build-your-kit-in-lamatic)
- [Step 2: Export Your Kit](#step-2-export-your-kit)
- [Step 3: Prepare Your Repository Contribution](#step-3-prepare-your-repository-contribution)
- [Step 4: Run and Test Locally](#step-4-run-and-test-locally)
- [Step 5: Deploy to Vercel](#step-5-deploy-to-vercel)
- [Step 6: Open a Pull Request](#step-6-open-a-pull-request)
- [General Contribution Guidelines](#general-contribution-guidelines)
- [Community & Support](#community--support)

---

## Quick Start (TL;DR)

**In Lamatic:**
1. Sign in → Create Project → New Flow → Build from Kit (or from Scratch)
2. Configure your flow and Deploy
3. Export API keys/`lamatic-config.json` and all flows

**In Your Repository:**
1. Fork the repo and create a template folder: `templates/<category>/<kit-name>/`
2. Add `.env.example`, `README.md`, `config.json`, `orchestrate.js`, and `flows/` folder
3. Copy your exported keys to `.env` (locally only)
4. Run `npm install && npm run dev` to test
5. Deploy to Vercel with environment variables
6. Submit a PR with checklist

---

## Prerequisites

- **Lamatic account:** https://lamatic.ai
- **Node.js 18+** and npm
- **Git and GitHub account**
- **Optional:** Vercel account (for easy previews and deployment)

---

## Step 1: Build Your Kit in Lamatic

### 1.1 Sign In or Create Account
Go to https://lamatic.ai and sign in or create a free account.

### 1.2 Create a Project
Create a new project from your dashboard. You'll use this project to build and deploy your flows.

### 1.3 Create a New Flow
Click "New Flow" in the sidebar or select from Templates.

### 1.4 Choose Your Starting Point
- **Build from a Kit:** Select a curated kit as your foundation and customize it for your use case
- **Build from Scratch:** Create a new flow from blank canvas for a unique implementation

Configure inputs, tools, providers, and any integrations your flow needs.

### 1.5 Deploy Your Flow
Complete the setup and deploy your flow in Lamatic Studio. Test it to ensure it works as expected.

---

## Step 2: Export Your Kit

### 2.1 Export API Keys or Configuration
After deployment, export your credentials:
- **Standard kits:** Export `LAMATIC_API_KEY`,`LAMATIC_PROJECT_ID` and `LAMATIC_ENDPOINT` from Studio

### 2.2 Export Your Flows
Select all flows used in your kit and export them. You'll place these in your repo's `flows/` folder.

### 2.3 Document Your Flow IDs
Note the flow IDs from Lamatic—you'll reference them in your `config.json` and/or in `lamatic-config.json` (for special asssitant kits)

---

## Step 3: Prepare Your Repository Contribution

### 3.1 Fork and Clone
```bash
git clone <your-fork-url>
cd AgentKit
```

### 3.2 Create Your Template Folder Structure
```bash
mkdir -p templates/<category>/<kit-name>
```

Replace `<category>` with: `agentic`, `assistant`, `automation`, `embed`, or another relevant category.

Example: `templates/agentic/customer-support-agent/`

### 3.3 Use the Sample Template as Your Starting Point
```bash
cp -R templates/sample/* templates/<category>/<kit-name>/
```

Update `package.json` with your kit name and description.

### 3.4 Add Required Files

Create or update these files in your template folder:

**`.env.example`** (no secrets—this is committed)
```
AGENTIC_GENERATE_CONTENT = "AGENTIC_GENERATE_CONTENT FLOW ID"
LAMATIC_API_URL = "LAMATIC_API_URL"
LAMATIC_PROJECT_ID = "LAMATIC_PROJECT_ID"
LAMATIC_API_KEY = "LAMATIC_API_KEY"
```

**`README.md`** (commit this—provide setup instructions)
- What your kit does and the problem it solves
- Prerequisites and required providers
- Environment variables needed
- Setup and run instructions (local + Vercel deployment)
- Usage examples
- Screenshots or GIFs (optional but helpful)

**`config.json`** (defines your kit for the platform)
- Below given is an example of how your config.json should look like.
```json
{
    "name": "Agent Kit Generation",
    "description": "It uses intelligent workflows to generate text, images, and JSON content through a modern Next.js interface with markdown rendering support.",
    "tags": ["🤖 Agentic", "✨ Generative"],
    "author": {
        "name": "Lamatic AI",
        "email": "info@lamatic.ai"
    },
    "steps": [
        {
            "id": "agentic-generate-content",
            "type": "mandatory",
            "envKey": "AGENTIC_GENERATE_CONTENT"
        }
    ],
    "integrations": [],
    "features": [],
    "demoUrl": "https://agent-kit-generation.vercel.app/",
    "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/generation",
    "deployUrl": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/generation&env=AGENTIC_GENERATE_CONTENT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Generation%20keys%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/agentic/agent-kit-generation",
    "documentationUrl": "https://lamatic.ai/templates/agentkits/agentic/agent-kit-generation"
}
- For documentation URL, fork our documentation repo and add your kit docs there. Most of the content will be pulled from your github README.md so make sure to make that well.
```

**`orchestrate.js`** (defines how flows work together)
```javascript
export const config = {
    "type": "atomic",
    "flows": {
      "generation" : {
          "name": "Generation",
          "type" : "graphQL",
          "workflowId": process.env.AGENTIC_GENERATE_CONTENT,
          "description": "Generate the output based on the user input type and instructions",
          "expectedOutput": ["answer"],
          "inputSchema": {
              "type": "string",
              "instructions": "string"
          },
          "outputSchema": {
              "answer": "string"
          },
          "mode": "sync",
          "polling" : "false"
      }
    },
    "api": {
      "endpoint": process.env.LAMATIC_API_URL,
      "projectId": process.env.LAMATIC_PROJECT_ID,
      "apiKey" : process.env.LAMATIC_API_KEY
    }
}
```

**`flows/` folder** (exported from Lamatic)
Place all exported flows from Lamatic here. The folder structure and files should match what you exported.

### 3.5 Keep Secrets Out of Version Control
Add this to your `.gitignore` (if not already present):
```
.env
.env.local
.env.*.local
```

Never commit `.env` or `lamatic-config.json` with real secrets. Only commit `.env.example` and template files.

---

## Step 4: Run and Test Locally

From your template folder:

```bash
cd templates/<category>/<kit-name>

# Install dependencies
npm install

# Copy the example env file
cp .env.example .env

# Edit .env with your real keys from Lamatic
# Use your text editor or:
# nano .env  (or similar)

# Start the development server
npm run dev
```

Visit http://localhost:3000 and verify your kit works end-to-end with your deployed Lamatic flow.

**Common issues?**
- Ensure your `.env` keys match your deployed flow in Lamatic
- Check that all required flows are exported in the `flows/` folder
- Verify Node.js version is 18 or higher: `node --version`

---

## Step 5: Deploy to Vercel

### 5.1 Push Your Branch
```bash
git checkout -b feat/<kit-name>
git add .
git commit -m "Add <kit-name> AgentKit"
git push origin feat/<kit-name>
```

### 5.2 Create a Vercel Project
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New..." → "Project"
3. Import your forked repository

### 5.3 Configure Root Directory
In the Vercel dashboard:
- Set **Root Directory** to: `templates/<category>/<kit-name>/`

### 5.4 Add Environment Variables
In the Vercel project settings, add each variable from your `.env.example`:
- `LAMATIC_API_KEY`
- `LAMATIC_PROJECT_ID`
- Any other provider keys your kit requires

Do not include `.env` or `lamatic-config.json` files in Vercel—only set environment variables.

### 5.5 Deploy
Vercel will automatically deploy. Visit your preview URL and confirm it works.

---

## Step 6: Open a Pull Request

Once your kit runs locally and deploys successfully on Vercel:

### 6.1 Create Your PR
1. Go to the main AgentKit repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Add a clear title: `feat: Add <kit-name> AgentKit`

### 6.2 PR Description Template
```markdown
## What This Kit Does
Brief description of the kit's purpose and the problem it solves.

## Providers & Prerequisites
- List any external providers (e.g., OpenAI, Stripe, etc.)
- Note any special setup required

## How to Run Locally
Quick summary (details in README)

## Live Preview
Link to Vercel deployment: https://your-deployment-url.vercel.app

## Lamatic Flow
Flow ID or link (if applicable)
```

### 6.3 PR Checklist
Copy this checklist into your PR description and check items as you complete them:

```markdown
### PR Checklist
- [ ] Kit runs locally with `npm run dev`
- [ ] `.env` contains all required keys (no secrets in commits)
- [ ] `lamatic-config.json` included if required (exported from Lamatic)
- [ ] `README.md` documents setup, environment variables, and usage
- [ ] Vercel deployment works with environment variables set
- [ ] Template follows folder structure: `templates/<category>/<kit-name>/`
- [ ] `config.json` and `orchestrate.js` match the kit's flows
- [ ] `.env.example` has no secrets, only placeholders
- [ ] All flows are exported in `flows/` folder
```

---

## General Contribution Guidelines

### Coding Standards
- Write clear, maintainable, well-documented code
- Use TypeScript where possible
- Follow patterns from `templates/sample/`
- Keep external dependencies minimal; document any additions
- Add comments for complex logic

### Before You Contribute
- Search open and closed issues to avoid duplicates
- Check if a similar kit already exists
- Review this guide completely

### Reporting Bugs
Include:
- Steps to reproduce
- Expected vs. actual behavior
- Environment (Node.js version, OS)
- Relevant logs or screenshots

### Suggesting Features
- Describe the use case and expected impact
- Provide example workflows or ideas
- Link to a Lamatic prototype if available

### Documentation Improvements
- Update examples, configuration details, or architecture notes as needed
- Write tutorials or case studies to help other contributors

### Pull Request Best Practices
- Keep PRs focused and minimal
- Provide clear commit messages
- Link related issues with "Fixes #123" if applicable
- Respond to reviews promptly and constructively

---

## Community & Support

- **GitHub Discussions:** https://github.com/Lamatic/AgentKit/discussions
- **Issues:** https://github.com/Lamatic/AgentKit/issues
- **Lamatic Docs:** https://lamatic.ai/docs

---

We appreciate your contributions to Lamatic AgentKit! 🚀