# 🛡️ Context-Aware Blocker Kit

An AI-powered Chrome Extension and Next.js backend that blocks websites based on **context**, not just URLs. Built with [Lamatic.ai](https://lamatic.ai).

---

## The Problem

Traditional website blockers are "dumb" — they block entire domains like `youtube.com`. This fails when you legitimately need YouTube for a coding tutorial, or when a distracting article lives on an otherwise productive domain. URL-based blocking is a blunt instrument that punishes the user instead of understanding them.

## The Solution

This kit uses a Lamatic AI flow to read the **actual content** of a webpage — its title, headings, and meta description — and evaluate it against the user's **natural language rules** (e.g., "Block gaming content", "Allow only DSA-related material"). The AI makes a dynamic ALLOW or BLOCK decision per page, not per domain.

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   Chrome Extension  │────▶│   Next.js API Proxy  │────▶│  Lamatic AI Flow │
│   (content.js +     │     │   /api/evaluate      │     │  (Instructor LLM │
│    background.js)   │◀────│                      │◀────│   JSON Output)   │
└─────────────────────┘     └─────────────────────┘     └──────────────────┘
     DOM Scraper              Secure Key Vault            BLOCK / PASS
```

1. **Chrome Extension** — The lightweight client. `content.js` scrapes the page's title, H1 headings, and meta description. `background.js` orchestrates the evaluation logic.
2. **Next.js API Proxy** — The secure backend. Holds the Lamatic API keys server-side so they never touch the client. Forwards page context to the Lamatic flow.
3. **Lamatic Flow** — The AI brain. An Instructor LLM Node evaluates the page context against the user's rules and outputs a strict `BLOCK` or `PASS` JSON decision.

**Why a proxy?** Chrome extensions run entirely on the client. If the extension called Lamatic directly, your API keys would be visible in the extension's source code. The Next.js backend acts as a secure vault.

---

## Design Decisions & Tradeoffs

### 1. Rule-Aware Cache (No TTL)
Instead of expiring cached AI decisions on a timer (which risks stale data), the extension generates a **deterministic hash of the active blocking rules**. When a rule changes, the hash changes, and all cached decisions automatically invalidate. This saves API calls without ever serving a stale BLOCK/PASS decision.

### 2. Fail-Open Strategy
If the API or AI evaluation fails, the system returns or retains **PASS**. This prevents unexpectedly blocking the user from their work due to Lamatic API timeouts or misconfigurations.

### 3. The "Strict Bouncer" Feature
The extension's background service worker monitors tab navigation. If the user tries to open `chrome://extensions` to disable the blocker during a focus session, the extension instantly closes the tab. This is a deliberate anti-circumvention technique inspired by native OS-level enforcement patterns.

### 4. DOM Scraping over URL Matching
Instead of just checking the URL, the content script sends the page's **title + H1 headings + meta description** to the AI. This lets the AI understand what the page is actually *about*, enabling nuanced decisions (e.g., allowing a YouTube coding tutorial while blocking a gaming video).

### 5. Debounced AI Calls
Rapid tab switching triggers a **1-second debounce** to prevent redundant API calls. The debounce timer is keyed per tab, so switching between tabs doesn't cause unnecessary re-evaluations.

### 6. Isomorphic Storage Adapter
The dashboard UI uses a storage adapter (`lib/storage.ts`) that automatically detects whether it's running inside a Chrome extension context or a normal browser window, falling back to `localStorage` for local development without any code changes.

---

## Setup Instructions

### 1. Build the AI Flow in Lamatic

1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) and create a new project.
2. Create a new flow named `content-classification`.
3. Set up an **API Request** node → **InstructorLLMNode** → **API Response**.
4. Deploy the flow and export it.
5. Get your `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, and `CONTENT_CLASSIFICATION_FLOW_ID` from the dashboard.

### 2. Run the Next.js Backend

```bash
cd kits/context-aware-blocker/apps
cp .env.example .env.local
# Fill in your real Lamatic credentials
npm install
npm run dev
```

The secure API proxy is now running on `http://localhost:3000/api/evaluate`.

### 3. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `apps/extension` folder.
5. The Lamatic Context Blocker is now active!

---

## Project Structure

```
kits/context-aware-blocker/
├── lamatic.config.ts              # Kit metadata, flow steps, deploy links
├── agent.md                       # Agent identity and capability doc
├── README.md                      # This file
├── constitutions/
│   └── default.md                 # Guardrails (fail-closed, no PII, no jailbreak)
├── flows/
│   └── content-classification.ts  # Exported Lamatic flow
└── apps/                          # The runnable Next.js + Extension project
    ├── package.json
    ├── .env.example               # Environment variable template
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx           # Dashboard UI (manage blocks)
    │   │   ├── layout.tsx         # Root layout
    │   │   └── api/
    │   │       ├── evaluate/route.ts  # Lamatic flow proxy endpoint
    │   │       └── log/route.ts       # Debug log bridge
    │   ├── components/
    │   │   ├── features/          # CommitCard, CommitSettingsModal, etc.
    │   │   └── ui/                # Button, Modal, DaySelector, etc.
    │   ├── hooks/
    │   │   └── useCommitStore.ts  # Zustand global state
    │   ├── lib/
    │   │   └── storage.ts         # Isomorphic storage adapter
    │   └── types/
    │       └── store.ts           # TypeScript type definitions
    └── extension/
        ├── manifest.json          # Chrome MV3 manifest
        ├── background.js          # Service worker (cache, AI eval, bouncer)
        └── content.js             # DOM scraper + block overlay
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Dashboard | Next.js 15, React 19, Zustand, Tailwind CSS 4 |
| Chrome Extension | Manifest V3, Service Worker, Content Script |
| AI Orchestration | Lamatic AI Flow (Instructor LLM Node) |
| Deployment | Vercel (backend), Chrome Web Store (extension) |

---

## Environment Variables

| Variable | Description | Where to Get It |
|----------|-------------|----------------|
| `LAMATIC_API_KEY` | API authentication key | studio.lamatic.ai → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Project identifier | studio.lamatic.ai → Settings → Project |
| `LAMATIC_API_URL` | GraphQL endpoint | studio.lamatic.ai → Settings → API Docs |
| `CONTENT_CLASSIFICATION_FLOW_ID` | Deployed flow ID | Your flow's details panel in Studio |

---

## Author

Built by [Abdul Maajith](https://github.com/Maajith9127) as a contribution to [Lamatic AgentKit](https://github.com/Lamatic/AgentKit).
