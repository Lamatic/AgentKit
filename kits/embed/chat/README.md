# 🧠 AI Meeting Intelligence Copilot — Kit README

> Part of the [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) · `kits/embed/chat`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vijayshreepathak/AgentKit&root-directory=kits/embed/chat&env=NEXT_PUBLIC_LAMATIC_PROJECT_ID,NEXT_PUBLIC_LAMATIC_FLOW_ID,NEXT_PUBLIC_LAMATIC_API_URL&envDescription=Lamatic%20project%20credentials)

An AI-powered Next.js app that converts raw meeting transcripts into structured insights (summary, action items, risks, next steps, follow-up email) and delivers them to Slack — all through a Lamatic chat widget embedded in the UI.

---

## 🗂️ Kit Structure

```
kits/embed/chat/
├── app/
│   ├── page.js                    # Landing page — Server Component
│   ├── layout.js                  # Root layout (Geist font + Vercel Analytics)
│   ├── globals.css                # Tailwind v4 theme + CSS variables
│   └── Screenshots/               # Demo screenshots
│       ├── 1.png
│       ├── fromLamatic-Running.png
│       ├── FromwebPage-With Followup mail-Running.png
│       └── Slack_integrated-Summarizer.png
├── components/
│   ├── LamaticChat.js             # Widget lifecycle — mounts root div + script
│   ├── HeroActions.jsx            # Interactive hero buttons (Client Component)
│   ├── TranscriptPlayground.jsx   # Textarea + Analyze button
│   └── ui/                        # shadcn/ui primitives
├── flows/
│   └── embedded-chatbot-chatbot/  # Exported Lamatic flow JSON
├── .env.local                     # ← create this (see below)
└── package.json
```

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- A [Lamatic account](https://lamatic.ai) with your meeting intelligence flow deployed
- A Slack incoming webhook URL (configured in your Lamatic flow)

### 1. Install dependencies

```bash
cd kits/embed/chat
npm install
```

### 2. Create `.env.local`

```env
NEXT_PUBLIC_LAMATIC_PROJECT_ID=your_project_id
NEXT_PUBLIC_LAMATIC_FLOW_ID=your_flow_id
NEXT_PUBLIC_LAMATIC_API_URL=https://your-project.lamatic.dev
```

All three values are available in **Lamatic Studio → Project Settings → Embed Widget**.

### 3. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## ☁️ Deploy to Vercel

```bash
# Option A — Vercel CLI
vercel --root kits/embed/chat

# Option B — click the button at the top of this file
```

Add the same three `NEXT_PUBLIC_*` env vars in the Vercel dashboard.

After deploying, add your Vercel production URL to the **Allowed Domains** list in your Lamatic Chat Trigger node, then redeploy the flow.

---

## 🔧 Lamatic Flow Configuration

### Required nodes (in order)

| # | Node | Purpose |
|---|---|---|
| 1 | Chat Trigger | Receives widget messages; whitelist your domain here |
| 2 | Generate Text | LLM call — extracts summary, action items, risks, next steps, email |
| 3 | Generate JSON | Structures the LLM output for Slack formatting |
| 4a | Slack API | Sends formatted card to your Slack channel |
| 4b | Chat Response | Streams the result back to the widget UI |

### Domain whitelisting (important)

In the **Chat Trigger** node config, add `*` for development or your exact domain for production. Without this, the widget returns 400 on every message.

---

## 🖼️ Screenshots

| Web App | Lamatic Studio |
|---|---|
| ![Web](app/Screenshots/FromwebPage-With%20Followup%20mail-Running.png) | ![Studio](app/Screenshots/fromLamatic-Running.png) |

| Slack Output | Landing Page |
|---|---|
| ![Slack](app/Screenshots/Slack_integrated-Summarizer.png) | ![Landing](app/Screenshots/1.png) |

---

## 🔑 How the widget integration works

```
page.js (Server Component)
  └── <LamaticChat />  (Client Component)
        │
        │  On mount (useEffect):
        ├── Creates <div id="lamatic-chat-root"
        │     data-api-url="..."
        │     data-flow-id="..."
        │     data-project-id="..."
        │   /> and appends to document.body
        │
        └── Injects <script type="module"
              src="https://widget.lamatic.ai/chat-v2?projectId=...">
              The widget's React app mounts into #lamatic-chat-root,
              fetches chatConfig, creates an IndexedDB session, and
              is ready to send messages.
```

**Why bootstrap on mount (not on button click)?**
The widget needs ~500 ms to fetch `chatConfig` and create a session. Bootstrapping immediately on page load means the widget is fully ready before the user clicks "Open Copilot", preventing the "unexpected error" on the first message send.

---

## 📜 License

MIT — see [LICENSE](../../LICENSE).

---

*Built by [Vijayshree Vaibhav](https://github.com/vijayshreepathak) for the Lamatic AgentKit Challenge.*
