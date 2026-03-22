# 📋 Meeting Action Items Agent

> An AI-powered agent that turns raw meeting notes into prioritized action items, key decisions, a markdown summary, and a follow-up email draft — in seconds.

Built with [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) · [Lamatic Studio](https://studio.lamatic.ai) · Next.js

---

## ✨ What It Does

Paste any raw meeting notes, transcript, or summary and the agent will automatically extract:

- ✅ **Key Decisions** — numbered list of decisions made in the meeting
- 🎯 **Action Items** — each with an owner, deadline, and priority (High / Medium / Low)
- 📄 **Meeting Summary** — a clean markdown report
- 📧 **Follow-up Email Draft** — ready to copy and send to your team

---

## 🏗️ Architecture

```
User (pastes meeting notes)
    ↓
Next.js Frontend (app/page.tsx)
    ↓
Server Action (actions/orchestrate.ts)
    ↓
Lamatic Flow (API Request → LLM → API Response)
    ↓
Structured JSON output rendered in the UI
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Lamatic Account | [lamatic.ai](https://lamatic.ai) |

### 1. Clone the repo

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/automation/meeting-action-agent
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
MEETING_ACTION_FLOW_ID="your-flow-id"
LAMATIC_API_URL="https://your-org.lamatic.dev/graphql"
LAMATIC_PROJECT_ID="your-project-id"
LAMATIC_API_KEY="your-api-key"
```

> **Where to find these values:**
> - `MEETING_ACTION_FLOW_ID` → Flow URL in Lamatic Studio (the UUID)
> - `LAMATIC_API_URL` → Settings → API Docs → Endpoint
> - `LAMATIC_PROJECT_ID` → Settings → Project → Project ID
> - `LAMATIC_API_KEY` → Settings → API Keys

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste your meeting notes!

---

## 🧠 Lamatic Flow Setup

### Trigger
- **Type:** API Request
- **Input schema:** `{ "meeting_notes": "string" }`

### LLM Node (Generate Text)
- **Model:** GPT-4o / GPT-4o-mini / Gemini 1.5 Pro
- **System prompt:** Instructs the model to extract decisions, action items, summary, and email as JSON
- **User message:** `{{trigger.meeting_notes}}`

### Response
- **Output schema:** `{ "result": "{{LLMNode.output.generatedResponse}}" }`

> See the exported flow files in the `flows/` folder.

---

## 📂 Project Structure

```
kits/automation/meeting-action-agent/
├── .env.example           # Environment variables template
├── .gitignore
├── README.md
├── config.json            # Kit metadata
├── package.json
├── actions/
│   └── orchestrate.ts     # Server action calling Lamatic
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Main UI
├── components/            # shadcn/ui components
├── flows/                 # Exported Lamatic flow files
├── lib/
│   └── lamatic-client.ts  # Lamatic SDK client
└── hooks/
```

---

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/automation/meeting-action-agent&env=MEETING_ACTION_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY)

1. Click the button above
2. Set the **Root Directory** to `kits/automation/meeting-action-agent`
3. Add all 4 environment variables
4. Deploy!

---

## 🤝 Contributing

This kit is part of [Lamatic AgentKit](https://github.com/Lamatic/AgentKit). See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📜 License

MIT — see [LICENSE](../../LICENSE)
