# Medical Assistant by Lamatic.ai

<p align="center">
  <a href="https://medical-assistant-mu.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Medical Assistant** is an AI-powered chatbot built with [Lamatic.ai](https://lamatic.ai) that provides general medical information, symptom checks, and health guidance through a conversational interface. It uses intelligent workflows to process medical queries and return evidence-based information with markdown rendering.

> ⚠️ **Disclaimer:** This tool provides general medical information only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider.

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

### Pre: Build in Lamatic

1. Sign in or sign up at https://lamatic.ai
2. Create a project (if you don't have one yet)
3. Click "+ New Flow" and build a medical assistant flow:
   - Add an **API Trigger** with a `query` input (string)
   - Add an **LLM Node** with a medical-aware system prompt
   - Configure the LLM to never diagnose, always recommend professional consultation
4. Deploy the flow in Lamatic and obtain your .env keys
5. Copy the Flow ID and API credentials from your studio

### Post: Wire into this repo

1. Create a `.env` file and set the keys
2. Install and run locally:
   - `npm install`
   - `npm run dev`
3. Deploy (Vercel recommended):
   - Import your repo, set the project's Root Directory to `kits/assistant/medical-assistant`
   - Add env vars in Vercel (same as your `.env`)
   - Deploy and test your live URL

---

## 🔑 Setup

### Required Keys and Config

You'll need these to run this project locally:

| Item        | Purpose                                              | Where to Get It                  |
| ----------- | ---------------------------------------------------- | -------------------------------- |
| `.env` Keys | Authentication for Lamatic AI APIs and Orchestration | [lamatic.ai](https://lamatic.ai) |

### 1. Environment Variables

Create `.env` with:

```bash
# Lamatic
MEDICAL_ASSISTANT_CHAT=your_flow_id_here
LAMATIC_API_URL=your_lamatic_api_url_here
LAMATIC_PROJECT_ID=your_project_id_here
LAMATIC_API_KEY=your_api_key_here
```

### 2. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📂 Repo Structure

```text
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration for medical queries
/app
 ├── globals.css            # Teal-themed design system
 ├── layout.tsx             # Root layout with SEO metadata
 └── page.tsx               # Chat-style medical assistant UI
/components
 ├── header.tsx             # Header with medical branding
 └── disclaimer.tsx         # Medical disclaimer components
/lib
 ├── lamatic-client.ts      # Lamatic SDK client
 └── utils.ts               # Tailwind class merge utility
/flows
 └── medical-assistant-chat/
     ├── config.json         # Flow configuration
     ├── inputs.json         # Input schema
     ├── meta.json           # Flow metadata
     └── README.md           # Flow documentation
```

---

## 🏥 Features

- **Conversational Interface** — Chat-style Q&A with message history
- **Symptom Guidance** — Describe symptoms to get relevant medical information
- **Suggested Prompts** — Quick-start chips for common health questions
- **Markdown Rendering** — Rich formatted responses with headers, lists, and emphasis
- **Medical Disclaimers** — Persistent disclaimer banner + per-response reminders
- **Copy to Clipboard** — Easy sharing of responses
- **Emergency Detection** — Advises calling emergency services when appropriate

---

## 🔒 Privacy & Data Handling

- No user data is stored persistently — chat history exists only in the browser session
- Queries are sent to the Lamatic flow for processing and are not logged client-side
- No personal health information (PHI) is collected or stored
- Review your Lamatic project's data handling policies for server-side processing details

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

---

## 📜 License

MIT License — see [LICENSE](../../../LICENSE).
