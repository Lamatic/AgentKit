# 🧠 Meeting Intelligence Agent

> Stop losing action items after meetings. Paste your raw notes — get a structured report delivered to your inbox in seconds.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AnuragDubey007/meeting-intelligence)

## 🔴 Live Demo

**[https://meeting-intelligence-tau.vercel.app/]**

---

## The Problem

Every team has this problem.

Someone takes notes during a meeting — messy, unstructured, full of half sentences. After the meeting ends, nobody knows exactly who owns what task or what deadline was agreed on. Action items get lost in a wall of text. Follow ups never happen. The meeting was a waste of time.

Existing tools like Zoom AI require you to be inside their ecosystem and cost money. This is open source, works with any text source, and runs entirely on Lamatic.

---

## The Solution

Paste any raw meeting notes. The agent:

- Writes a clean 2-3 sentence summary
- Extracts every action item with owner, deadline, and priority
- Lists all decisions that were made
- Identifies follow up questions that need answers
- Emails the full structured report to your team automatically

---

## How It Works
Raw Notes → Lamatic Flow → LLM Extraction → Code Parser → SMTP Email → Dashboard

1. User pastes messy meeting notes and enters recipient email in the Next.js UI
2. Frontend sends the data to Lamatic via GraphQL API
3. **LLM Node** extracts structured JSON from the raw notes using Llama 3.3 70B
4. **Code Node** parses the JSON and builds a formatted HTML email body
5. **SMTP Node** sends the report directly to the recipient's inbox
6. **API Response** returns the parsed data to the frontend dashboard

---

## Lamatic Flow Architecture

The entire intelligence pipeline runs inside Lamatic — 5 nodes, zero backend servers:

| Node | Purpose |
|------|---------|
| API Request | Accepts `meetingNotes` and `recipientEmail` from the frontend |
| Generate Text | Runs Llama 3.3 70B via Groq to extract structured JSON |
| Code Node | Parses JSON response and builds HTML email body |
| SMTP Node | Sends formatted report to recipient email automatically |
| API Response | Returns structured result back to the Next.js frontend |

---

## Features

- Works with any meeting notes — standups, client calls, brainstorms, retrospectives
- Automatically identifies task owners from natural language
- Color coded priority labels — High, Medium, Low
- Sends formatted HTML email report via Lamatic SMTP node
- Copy all results to clipboard in one click
- Clean dark UI built with Next.js and Tailwind CSS
- Fully open source and self hostable

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| AI Orchestration | Lamatic.ai |
| LLM | Llama 3.3 70B via Groq |
| Email Delivery | Lamatic SMTP Node |
| Deployment | Vercel |

---

## Setup

### Prerequisites

- Node.js 18+
- Lamatic.ai account (free)
- Gmail or SMTP credentials configured in Lamatic Connections

### 1. Clone and install

```bash
git clone https://github.com/AnuragDubey007/meeting-intelligence
cd meeting-intelligence
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
LAMATIC_API_URL=your_lamatic_graphql_endpoint
LAMATIC_API_KEY=your_lamatic_api_key
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_FLOW_ID=your_flow_id
```

Get these values from Lamatic Studio → your project → Connect → API tab.

### 3. Import the Lamatic Flow

- Go to Lamatic Studio
- Create a new flow
- Set up the 5 nodes as described in the architecture section above
- Configure your SMTP credentials in Lamatic Connections
- Deploy the flow
- Copy your Flow ID and Project credentials to `.env.local`

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`

### 5. Deploy to Vercel

Click the Deploy button at the top of this README or:

1. Push to GitHub
2. Import repo in Vercel
3. Add all 4 environment variables in Vercel settings
4. Deploy

---

## Example

**Input — raw messy notes:**
ok so we had our weekly sync. raj mentioned the API is still slow and
needs optimization before launch. priya will handle the database indexing
by thursday. john said the login page bug is critical and needs to be fixed
today. we decided to delay the launch by one week to april 28. need to
follow up with the design team about the new onboarding flow.

**Output — structured report:**

**Summary:** The team discussed pre-launch blockers including API performance and a critical login bug. The launch has been delayed by one week. Database optimization and bug fixes are the immediate priorities.

**Action Items:**

| Task | Owner | Deadline | Priority |
|------|-------|----------|----------|
| Optimize API performance | Raj | Before launch | 🔴 High |
| Database indexing | Priya | Thursday | 🔴 High |
| Fix login page bug | John | Today | 🔴 High |
| Follow up with design team | Unknown | Not specified | 🟡 Medium |

**Decisions:** Launch delayed to April 28

**Follow Up:** What is the status of the new onboarding flow design?

---

## Project Structure

```
kits/automation/meeting-intelligence/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
├── .env.example
├── package.json
└── README.md
```

---

## Contributing

This kit is part of [Lamatic AgentKit](https://github.com/Lamatic/AgentKit).  
See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

Built with ❤️ for the Lamatic AgentKit Challenge
