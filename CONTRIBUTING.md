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
1. Choose ONE of the following based on your use case:
- **Kits** (kits/<category>/<kit-name>/): Full, production-ready projects with UI, backend, and configs
- **Bundles** (bundles/<bundle-name>/): Multiple flows working together (e.g., data indexing + chatbot)
- **Templates** (templates/<template-name>/): Simple, single-flow exports (minimal setup)
2. Add the following files : 
   - **Kits** : `.env.example`, `README.md`, `config.json`, `orchestrate.js`, and `flows/` folder
   - **Bundles** : `config.json`, `README.md` and `flows/` folder
   - **Template** : The exported content from Lamatic Studio
3. For kits :
   - Copy your exported keys to `.env` (locally only)
   - Run `npm install && npm run dev` to test
   - Deploy to Vercel with environment variables
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

### 3.2 Choose Your Contribution Type
Before proceeding, decide which you're contributing:

#### Option A: Kit (Full Project)
```bash
mkdir -p kits/<category>/<kit-name>
# Example: kits/agentic/customer-support-agent/
```
Use this for complete, production-ready projects.

#### Option B: Bundle (Multiple Flows)
```bash
mkdir -p bundles/<bundle-name>
# Example: bundles/whatsapp-reachout-bot
```
Use this when you're combining multiple related flows.

#### Option C: Template (Single Flow)
```bash
mkdir -p templates/<template-name>
# Example: templates/stock-market-sentiment-analysis/
```
Use this for simple, self-contained flows.

#### 3.2.1 Create Your Kit Folder Structure
```bash
mkdir -p kits/<category>/<kit-name>
```

Replace `<category>` with: `agentic`, `assistant`, `automation`, `embed`, or another relevant category.

Example: `kits/agentic/customer-support-agent/`

#### 3.2.2 Create Your Bundle Folder Structure
```bash
mkdir -p bundles/<bundle-name>
```

Example: `bundles/whatsapp-reachout-bot`

#### 3.2.3 Create Your Template Folder Structure
```bash
mkdir -p templates/<template-name>
```

Example: `template/stock-market-sentiment-analysis/`

### 3.3 Use the Sample Template as Your Starting Point
# For Kits:
```bash
cp -R kits/sample/* kits/<category>/<kit-name>/

# For Bundles:
cp -R bundles/sample/* bundles/<bundle-name>/

# For Templates:
cp -R templates/sample/* templates/<template-name>/
```

Update `package.json` with your kit name and description.

### 3.4 Add Required Files

> **⚠️ Note:** Only follow the subsection for your contribution type (Kit, Bundle, or Template)

#### 3.4.1 Kit

Create or update these files in your kit folder:

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
```
- For documentation URL, fork our documentation repo and add your kit docs there. Most of the content will be pulled from your github README.md so make sure to make that well.

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

#### 3.4.2 Bundle

Create or update these files in your kit folder:

**`README.md`** (commit this—provide setup instructions)
- What your bundle does and the problem it solves
- Prerequisites and required providers

Generally, this can be created in the same way as given in sample bundle. With each individual template, you get a auto-generated README when you export from Lamatic. So make this as a combined version of what your bundle does

**`config.json`** (defines your kit for the platform)
- Below given is an example of how your config.json should look like.
```json
{
    "name": "Chatbot",
    "description": "A chat bundle that combines data source indexing with a knowledge chatbot interface.",
    "tags": ["📞 Support", "📄 Document"],
    "author": {
        "name": "Naitik Kapadia",
        "email": "naitikk@lamatic.ai"
    },
    "steps": [
        {
            "id": "data_source",
            "type": "any-of",
            "options": [
                {
                    "id": "gdrive"
                },
                {
                    "id": "gsheet"
                },
                {
                    "id": "onedrive"
                },
                {
                    "id": "postgres"
                },
                {
                    "id": "s3"
                },
                {
                    "id": "scraping-indexation"
                },
                {
                    "id": "sharepoint"
                },
                {
                    "id": "crawling-indexation"
                }
            ],
            "minSelection": 1,
            "maxSelection": 1
        },
        {
            "id": "knowledge-chatbot",
            "type": "mandatory",
            "prerequisiteSteps": [
                "data_source"
            ]
        }
    ],
    "integrations": [],
    "features": [],
    "demoUrl": "",
    "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/bundles/chat",
    "deployUrl": "",
    "documentationUrl": ""
}
```
- For documentation URL, fork our documentation repo and add your bundle docs there. Most of the content will be pulled from your github README.md so make sure to make that well.

**`flows/` folder** (exported from Lamatic)
Place all exported flows from Lamatic here. The folder structure and files should match what you exported.

#### 3.4.3 Template

Create or update these files in your temaplate folder:

**`flows/` folder** (exported from Lamatic)
Place the exported flow from Lamatic here. The folder structure and files should match what you exported automatically.

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
> **ℹ️ This step applies to: [Kits Only]**
>
> Bundles and Templates only contain flows—there's no local development server to run. Skip to Step 5 if you're contributing a Bundle or Template.


From your template folder:

```bash
cd kits/<category>/<kit-name>

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
> **ℹ️ This step applies to: [Kits Only]**
>
> Bundles and Templates don't require Vercel deployment. Skip to Step 6 if you're contributing a Bundle or Template.

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
In the Vercel dashboard, set the appropriate root directory based on your contribution type:
- **Kits:** `kits/<category>/<kit-name>/`
- **Bundles:** Not applicable (skip this step)
- **Templates:** Not applicable (skip this step)

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
4. Add a clear title: `feat: Add <kit-name> AgentKit` or `feat: Add <bundle-name> Bundle` or `feat: Add <template-name> Template`

### 6.2 PR Description Template
```markdown
## What This Assest Does
Brief description of the asset's purpose and the problem it solves.

## Providers & Prerequisites
- List any external providers (e.g., OpenAI, Stripe, etc.)
- Note any special setup required

## How to Run Locally (only for Kits)
Quick summary (details in README)

## Live Preview (only for Kits)
Link to Vercel deployment: https://your-deployment-url.vercel.app

## Lamatic Flow
Flow ID or link (if applicable)
```

### 6.3 PR Checklist

Choose the checklist that matches your contribution type:

#### For Kits:
```markdown
### PR Checklist [Kit]
- [ ] Kit runs locally with `npm run dev`
- [ ] `.env` contains all required keys (no secrets in commits)
- [ ] `.env.example` has no secrets, only placeholders
- [ ] `README.md` documents setup, environment variables, and usage
- [ ] Folder structure: `kits/<category>/<kit-name>/`
- [ ] `config.json` and `orchestrate.js` are present and valid
- [ ] All flows exported in `flows/` folder
- [ ] Vercel deployment works with environment variables set
- [ ] Live preview URL works end-to-end
```

#### For Bundles:
```markdown
### PR Checklist [Bundle]
- [ ] Folder structure: `bundles/<bundle-name>/`
- [ ] `README.md` documents what the bundle does and prerequisites
- [ ] `config.json` is present with correct flow references
- [ ] All flows exported in `flows/` folder
- [ ] Flow orchestration is clear (which flows work together)
- [ ] No secrets committed
```

#### For Templates:
```markdown
### PR Checklist [Template]
- [ ] Folder structure: `templates/<template-name>/`
- [ ] All flow files exported from Lamatic are present
- [ ] Flow structure matches what was exported from Lamatic
- [ ] No secrets committed
- [ ] Optional: Brief README explaining what the template does
```

## General Contribution Guidelines

### Coding Standards
- Write clear, maintainable, well-documented code
- Use TypeScript where possible
- Follow patterns from `kits/sample/` and/or `bundles/sample/`
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