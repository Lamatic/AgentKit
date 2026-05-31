# Implementation Plan - Review Analyzer Extension Kit

This plan details the step-by-step setup and development of **Review Analyzer**, a Chrome Extension kit that leverages Lamatic AI and Next.js to scrape e-commerce product reviews, analyze consensus/pros/cons, detect fake/low-effort comments, and display a Trust Score dashboard.

---

## Architecture Overview

We will implement a secure and compliant architecture utilizing an iframe-based bridge:

1. **Content Script (`content.js`)**: Runs on the e-commerce page (e.g., Amazon), scrapes reviews based on CSS selectors, and sends them to the Extension Popup.
2. **Extension Popup (`popup.html` / `popup.js`)**: A lightweight container that hosts the Next.js app in an `iframe`. It handles message passing between the Content Script and the Next.js iframe.
3. **Next.js Backend/UI (`apps/`)**: 
   - **Frontend**: Renders the dashboard UI (consensus, pros/cons, trust score gauge) and handles the iframe `message` event.
   - **Backend Server Action (`orchestrate.ts`)**: Uses the `lamatic` SDK to securely send reviews to the Lamatic workflow using private API keys and return the structured analysis.
4. **Lamatic AI Workflow**: Takes reviews as input, processes them via an LLM (Claude 3.5 / GPT-4o), and outputs a structured summary, pros/cons list, and trust score.

```
[Amazon Page] ---> (Scrapes) ---> [content.js] 
                                      │ (chrome.runtime)
                                      ▼
[Next.js App (Iframe Dashboard)] <--- [popup.js]
  │ (React State)
  ▼
[Next.js Server Action] ---> (Lamatic SDK) ---> [Lamatic AI Studio]
                                                       │ (LLM Process)
                                                       ▼
[Next.js App (Iframe Dashboard)] <--- (Results) <──────┘
```

---

## User Review Required

> [!IMPORTANT]
> - **Next.js App Location**: We will name the Next.js app folder `apps/` to match AgentKit's `CLAUDE.md` standards and avoid CI errors, but we will also configure the extension to point to it.
> - **Vercel Deployment**: The extension popup iframe needs to load the Next.js page. For local testing, we default to `http://localhost:3000/popup`. For production, you will need to host your Next.js app on Vercel and update the URL in your extension settings.
> - **Lamatic Flow Schema**: Since you will build the flow in Lamatic Studio, we will provide a template flow file (`flows/review-analyzer.ts`) and the exact GraphQL input/output schemas you need to configure in the Studio.

---

## Open Questions

> [!WARNING]
> - **Target Selectors**: We will support Amazon `.a-size-base.review-text` and standard `.review-text` selectors. Do you have any other specific e-commerce platforms (like Shopify, eBay) you want to target initially?
> - **Trust Score Weights**: The LLM will calculate the Trust Score (0-100) based on review details, spelling errors, repetitiveness, and length. Let us know if you want a custom scoring algorithm.

---

## Proposed Changes

We will create a new kit subdirectory: `kits/review-analyzer/`

### 1. Root Kit Configuration

#### [NEW] [lamatic.config.ts](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/lamatic.config.ts)
Defines metadata, tags, Vercel deploy directory, and the mandatory `review-analyzer` flow step.

#### [NEW] [config.json](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/config.json)
A copy of metadata in JSON format to satisfy the strict root-file check in the PR validation workflow (`validate-pr.yml`).

#### [NEW] [agent.md](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/agent.md)
Document describing the agent's identity, inputs, outputs, env vars, and setup.

#### [NEW] [README.md](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/README.md)
Human-readable quickstart instructions for building, installing, and deploying this kit.

#### [NEW] [default.md](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/constitutions/default.md)
Constitution file providing guidelines for LLM behavior (accuracy, tone, structure).

#### [NEW] [review-analyzer.ts](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/flows/review-analyzer.ts)
TypeScript definition of the Lamatic flow, linking prompts and model configs.

---

### 2. Chrome Extension Assets (Vanilla JS)

#### [NEW] [manifest.json](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/extension/manifest.json)
Chrome Extension Manifest V3. Requests permissions: `activeTab`, `scripting`, `storage`. Defines background scripts, content scripts, and side panel default paths.

#### [NEW] [background.js](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/extension/background.js)
Listens for extension icon clicks to open the Side Panel or Popup and handles message relaying.

#### [NEW] [content.js](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/extension/content.js)
Scrapes review texts on command and communicates back to the popup. Supports selectors for Amazon and generic e-commerce sites.

#### [NEW] [popup.html](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/extension/popup.html)
Contains the dashboard UI container holding the `iframe` pointing to the Next.js app.

#### [NEW] [popup.js](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/extension/popup.js)
Coordinates communication between the scraped page and the Next.js `iframe`.

---

### 3. Next.js Application (Bridge & Dashboard UI)

We will initialize a Next.js 15 application inside `kits/review-analyzer/apps/` using tailwind, shadcn/ui styles, and TS.

#### [NEW] [lamatic-client.ts](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/lib/lamatic-client.ts)
Initializes the `Lamatic` client with project credentials.

#### [NEW] [orchestrate.js](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/orchestrate.js)
Orchestrates config linking for environment variables.

#### [NEW] [orchestrate.ts](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/actions/orchestrate.ts)
Server action to invoke the deployed Lamatic flow via the SDK.

#### [NEW] [page.tsx](file:///Users/ardaceylan/.gemini/antigravity/scratch/AgentKit/kits/review-analyzer/apps/app/popup/page.tsx)
The iframe popup page. Listens to `postMessage` from the parent extension, triggers the server action to analyze reviews, and displays the UI:
- **Consensus summary**
- **Pros & Cons lists**
- **Trust Score circular gauge** (premium animated design)

---

## Verification Plan

### Automated Checks
1. Run local linting and typechecking:
   ```bash
   npm run lint
   npm run build
   ```
2. Validate files with a mock dry-run of the PR validation steps in `.github/workflows/validate-pr.yml`.

### Manual Verification
1. Run Next.js app locally (`npm run dev`).
2. Load the unpacked extension `kits/review-analyzer/apps/extension` into Google Chrome (`chrome://extensions`).
3. Open an e-commerce page (e.g. an Amazon product page).
4. Open the extension popup, verify it triggers scraping, displays the loading state, communicates with Next.js, and displays the analyzed metrics.
