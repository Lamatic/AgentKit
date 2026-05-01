# Kit Contribution Guide

> [Quickstart](./quickstart.md) · [Main Contributing Guide](../CONTRIBUTING.md)

A **kit** is a full project — a Next.js web application paired with one or more Lamatic flows. Kits are the most complete contribution type, giving users a ready-to-deploy app with UI, server actions, and flow orchestration.

**Reference implementation:** [`kits/sample/content-generation/`](../kits/sample/content-generation/)

---

## Prerequisites

Before following this guide, complete **Steps 1–3** in the [main Contributing Guide](../CONTRIBUTING.md#step-1-fork-the-repository):

1. Fork and clone the repository
2. Build your flow(s) in Lamatic Studio
3. Export your flow files and API keys

You'll also need:
- Node.js 18+ and npm 9+
- A Vercel account (optional, for deployment)

---

## Step 1: Create Your Kit Folder

### 1.1 Choose a Category

Place your kit in the appropriate category:

| Category | Description | Example |
|----------|-------------|---------|
| `agentic` | Autonomous reasoning/planning agents | Deep Search, Content Generation |
| `assistant` | Interactive helpers (chat, extensions) | Grammar Extension |
| `automation` | Business workflow automation | Hiring Automation |
| `embed` | Embeddable AI widgets | Chat Widget, Search Widget |

If none of these fit, you can propose a new category — but check existing kits first.

### 1.2 Copy the Sample Template

```bash
# Create your kit folder
mkdir -p kits/<category>/<kit-name>

# Copy the sample template
cp -R kits/sample/content-generation/* kits/<category>/<kit-name>/
```

### 1.3 Required Folder Structure

Your kit folder should look like this:

```
kits/<category>/<kit-name>/
├── .env.example           # Environment variables template (NO SECRETS!)
├── .gitignore             # Git ignore rules
├── README.md              # Setup & usage instructions
├── config.json            # Kit metadata for the platform
├── package.json           # Dependencies & scripts
├── actions/
│   └── orchestrate.ts     # Server action calling Lamatic flows
├── app/
│   └── page.tsx           # Main UI page
├── components/
│   └── ...                # React components
├── flows/
│   └── <flow-name>/       # Exported flow from Lamatic
│       ├── config.json    # Flow configuration
│       ├── inputs.json    # Input schema
│       ├── meta.json      # Flow metadata
│       └── README.md      # Flow documentation
└── lib/
    └── lamatic-client.ts  # Lamatic SDK client
```

---

## Step 2: Update Required Files

### 2.1 `.env.example` — Environment Template

This file is committed to the repo as a template. **Never include real secrets.**

```env
AGENTIC_GENERATE_CONTENT = "YOUR_FLOW_ID"
LAMATIC_API_URL = "YOUR_API_ENDPOINT"
LAMATIC_PROJECT_ID = "YOUR_PROJECT_ID"
LAMATIC_API_KEY = "YOUR_API_KEY"
```

> See example: [`kits/sample/content-generation/.env.example`](../kits/sample/content-generation/.env.example)

### 2.2 `config.json` — Kit Metadata

```json
{
    "name": "Your Kit Name",
    "description": "Brief description of what your kit does.",
    "tags": ["🤖 Agentic", "✨ Generative"],
    "author": {
        "name": "Your Name",
        "email": "your@email.com"
    },
    "steps": [
        {
            "id": "your-flow-id",
            "type": "mandatory",
            "envKey": "YOUR_FLOW_ENV_VAR"
        }
    ],
    "integrations": [],
    "features": [],
    "demoUrl": "",
    "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/<category>/<kit-name>",
    "deployUrl": "",
    "documentationUrl": ""
}
```

**Step types:**
- `"mandatory"` — Required flow, always included
- `"any-of"` — User picks from options (uses `minSelection`, `maxSelection`, and `options` array)

**Naming alignment:** The flow folder name, step `id`, and `envKey` should all be semantically aligned:
- Folder: `agentic-generate-content/`
- Step ID: `agentic-generate-content`
- Env key: `AGENTIC_GENERATE_CONTENT`

> See example: [`kits/sample/content-generation/config.json`](../kits/sample/content-generation/config.json)

### 2.3 `README.md` — Setup Instructions

Your README should include:
- What the kit does and the problem it solves
- Prerequisites and required providers
- Environment variables needed (with a table explaining where to get each)
- Setup and run instructions
- Usage examples
- Screenshots/GIFs (optional but recommended)

> See example: [`kits/sample/content-generation/README.md`](../kits/sample/content-generation/README.md)

---

## Step 3: Add Your Exported Flows

1. Create the flows directory:
   ```bash
   mkdir -p kits/<category>/<kit-name>/flows/<flow-name>
   ```

2. Copy your exported flow files into this folder:
   ```bash
   cp -R ~/Downloads/exported-flow/* kits/<category>/<kit-name>/flows/<flow-name>/
   ```

Each flow directory must contain:
- `config.json` — Flow graph (nodes + edges)
- `inputs.json` — Input schema
- `meta.json` — Flow metadata
- `README.md` — Auto-generated flow documentation

> Do not hand-edit flow `config.json` files unless you understand the node/edge schema. Re-export from Studio if changes are needed.

---

## Step 4: Run and Test Locally

### 4.1 Install Dependencies

```bash
cd kits/<category>/<kit-name>
npm install
```

### 4.2 Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env   # or use any text editor
```

Fill in your actual values from the export step:
```env
AGENTIC_GENERATE_CONTENT = "your-actual-flow-id"
LAMATIC_API_URL = "https://api.lamatic.ai/v1/..."
LAMATIC_PROJECT_ID = "proj_xxxxxxxxxxxx"
LAMATIC_API_KEY = "lam_xxxxxxxxxxxx"
```

### 4.3 Start Development Server

```bash
npm run dev
```

### 4.4 Test Your Kit

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Test all functionality end-to-end
3. Verify your flow is being called correctly

---

## Step 5: Deploy to Vercel

### 5.1 Push Your Branch

```bash
git checkout -b feat/<kit-name>
git add .
git commit -m "feat: Add <kit-name> AgentKit"
git push origin feat/<kit-name>
```

### 5.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Select your forked repository

### 5.3 Configure Root Directory

**Important:** Set the root directory to your kit folder.

Navigate: **Configure Project → Root Directory**

Enter: `kits/<category>/<kit-name>`

### 5.4 Add Environment Variables

Navigate: **Configure Project → Environment Variables**

Add each variable from your `.env.example`:

| Name | Value |
|------|-------|
| `AGENTIC_GENERATE_CONTENT` | Your flow ID |
| `LAMATIC_API_URL` | Your API endpoint |
| `LAMATIC_PROJECT_ID` | Your project ID |
| `LAMATIC_API_KEY` | Your API key |

### 5.5 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Test your live preview URL

---

## Step 6: Open a Pull Request

### 6.1 Create Your PR

1. Go to [github.com/Lamatic/AgentKit](https://github.com/Lamatic/AgentKit)
2. Click **"New Pull Request"**
3. Select your fork and branch
4. Add a clear title: `feat: Add <kit-name> AgentKit`

### 6.2 PR Description Template

```markdown
## What This Kit Does
Brief description of the kit's purpose and the problem it solves.

## Providers & Prerequisites
- List any external providers (e.g., OpenAI, Anthropic)
- Note any special setup required

## How to Run Locally
1. `cd kits/<category>/<kit-name>`
2. `npm install`
3. `cp .env.example .env` and fill in values
4. `npm run dev`

## Live Preview
https://your-kit.vercel.app

## Lamatic Flow
Flow ID: `your-flow-id`
```

### 6.3 PR Checklist

```markdown
- [ ] Kit runs locally with `npm run dev`
- [ ] `.env.example` has no secrets, only placeholders
- [ ] `README.md` documents setup and usage
- [ ] Folder structure follows `kits/<category>/<kit-name>/`
- [ ] `config.json` is present and valid
- [ ] All flows exported in `flows/` folder
- [ ] Vercel deployment works
- [ ] Live preview URL works end-to-end
```

---

## Examples & References

| Resource | Link |
|----------|------|
| Sample Kit (complete reference) | [`kits/sample/content-generation/`](../kits/sample/content-generation/) |
| Kit config.json | [`kits/sample/content-generation/config.json`](../kits/sample/content-generation/config.json) |
| .env.example | [`kits/sample/content-generation/.env.example`](../kits/sample/content-generation/.env.example) |
| Kit README | [`kits/sample/content-generation/README.md`](../kits/sample/content-generation/README.md) |
| orchestrate.ts | [`kits/sample/content-generation/actions/orchestrate.ts`](../kits/sample/content-generation/actions/orchestrate.ts) |
| Flow files | [`kits/sample/content-generation/flows/`](../kits/sample/content-generation/flows/) |

---

## Need Help?

- Check the [Troubleshooting section](../CONTRIBUTING.md#troubleshooting) in the main contributing guide
- Ask in [GitHub Discussions](https://github.com/Lamatic/AgentKit/discussions)
- Review [Lamatic Docs](https://lamatic.ai/docs)
