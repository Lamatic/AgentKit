# TrustGuard AI

> A multi-stage AI investigation kit that helps you detect fraud, phishing, and scams across emails, SMS, URLs, and documents. Built on Lamatic AI flows and powered by large language models.

🔗 **Live Demo:** [https://trustguard-ai-blush.vercel.app](https://trustguard-ai-blush.vercel.app)

---

## Introduction

Every day, people receive suspicious messages, shady links, and convincing-looking emails that are carefully designed to deceive them. TrustGuard AI is a developer-ready kit that gives you a working fraud detection pipeline out of the box.

You paste or submit any suspicious content, and TrustGuard AI runs it through a sequence of four specialized AI agents, each with its own clearly defined job. By the time the final response comes back, you get a structured breakdown: what was found, how risky it looks, and what action is recommended. No vague "this might be a scam" outputs. Just structured, reasoned results you can actually use.

This kit is part of the [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) collection, which is a library of production-ready AI workflow kits built on top of [Lamatic AI](https://lamatic.ai).

> **Note on response speed:** TrustGuard AI runs four LLM agents in sequence per investigation. The more capable and faster the model you configure (e.g. Gemini 1.5 Flash vs Pro), the quicker each stage completes and the faster the full result comes back. If you find the analysis slow, switching to a faster model in your Lamatic project is the first thing to try.

---


## Features

- **Multi-input support** - Analyze emails, SMS messages, URLs, plain text, and documents from a single interface
- **Four-stage investigation pipeline** - Each AI agent handles one specific job, keeping the analysis clean and reliable
- **Structured JSON output** - Every response is fully typed and machine-readable, so you can integrate it into your own product easily
- **Risk scoring** - A 0 to 100 risk score with a confidence rating tells you exactly how dangerous the content looks
- **Threat pattern matching** - Detects known scam patterns like lottery fraud, credential harvesting, BEC, tech support scams, investment fraud, and more
- **Evidence extraction** - Pulls out URLs, domains, email addresses, phone numbers, money amounts, brand mentions, and urgency phrases automatically
- **Multilingual input** - Supports English, Hindi, Bengali, and auto-detection
- **Decision engine** - Produces a final verdict, recommended action, priority level, and flags whether human review is needed
- **Next.js frontend** - A ready-to-deploy web app with a clean dark UI so you can start using it immediately

---

## Architecture

TrustGuard AI uses a linear four-stage agentic pipeline. Each stage builds on the output of the previous one, and every agent has a strictly limited scope so nothing bleeds into the wrong step.

```
User Input
    |
    v
[Stage 1] Investigation Planner
    - Initializes the investigation object
    - Normalizes and summarizes the raw input
    - Detects the input type (email, URL, SMS, etc.)
    |
    v
[Stage 2] Evidence Extractor
    - Pulls structured entities from the normalized content
    - URLs, domains, emails, phone numbers, money amounts,
      brand names, urgency phrases, attachments
    |
    v
[Stage 3] Threat Analyzer
    - Scores each piece of evidence as HIGH, MEDIUM, or LOW risk
    - Calculates an overall risk score (0-100) and confidence
    - Identifies matched threat patterns
    - Generates a reasoning summary
    |
    v
[Stage 4] Decision Engine
    - Produces the final classification and verdict
    - Recommends a concrete action
    - Flags whether human review is needed
    |
    v
Structured JSON Response
```

All four stages run inside a single Lamatic flow, connected as a directed graph with no branching.

---

## Flow Diagram

```
triggerNode_1 (API Request)
       |
       v
InstructorLLMNode_381 (Investigation Planner)
       |
       v
InstructorLLMNode_849 (Evidence Extractor)
       |
       v
InstructorLLMNode_847 (Threat Analyzer)
       |
       v
InstructorLLMNode_352 (Decision Engine)
       |
       v
responseNode_triggerNode_1 (API Response)
```

Each node is an `InstructorLLMNode` that receives a system prompt, a user prompt, and a strict JSON output schema. The flow is defined in [`flows/trustguard-ai.ts`](./flows/trustguard-ai.ts).

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Orchestration | [Lamatic AI](https://lamatic.ai) |
| LLM | Configurable (Gemini by default) |
| Frontend Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Font | Inter (via `next/font/google`) |
| Animations | Framer Motion |
| Toasts | react-hot-toast |
| Deployment | Vercel (recommended) |

---

## Folder Structure

```
trustguard-ai/
├── apps/                          # Next.js web application
│   ├── app/
│   │   ├── globals.css            # Global styles and design tokens
│   │   ├── layout.tsx             # Root layout with metadata and fonts
│   │   └── page.tsx               # Main page (form + results)
│   ├── actions/
│   │   └── runInvestigation.ts    # Next.js Server Action that calls the Lamatic flow
│   ├── components/
│   │   ├── Header.tsx             # Top navigation bar
│   │   ├── Footer.tsx             # Footer with links
│   │   ├── InputForm.tsx          # Submission form with input type selector
│   │   ├── ResultCards.tsx        # Orchestrates result display
│   │   ├── DecisionCard.tsx       # Final verdict and recommended action
│   │   ├── EvidenceCard.tsx       # Extracted entities display
│   │   ├── ThreatCard.tsx         # Threat indicators and pattern matches
│   │   ├── RiskMeter.tsx          # Visual risk score meter
│   │   ├── Badge.tsx              # Reusable severity badge
│   │   └── LoadingSpinner.tsx     # Loading state indicator
│   ├── lib/
│   │   ├── lamatic.ts             # Lamatic client initialization
│   │   ├── schemas.ts             # Zod runtime validation schema for the flow response
│   │   ├── types.ts               # Re-exports from types/response.ts
│   │   └── utils.ts               # Color helpers, formatters, and display logic
│   ├── types/
│   │   └── response.ts            # TypeScript interfaces for the full API response
│   ├── public/                    # Static assets (logo, favicon)
│   ├── .env.example               # Template for required environment variables
│   └── package.json
├── flows/
│   └── trustguard-ai.ts           # Full Lamatic flow definition (nodes + edges)
├── prompts/                       # System and user prompts for each LLM node
│   ├── trustguard-ai_instructor-llmnode-381_system_0.md
│   ├── trustguard-ai_instructor-llmnode-381_user_1.md
│   ├── trustguard-ai_instructor-llmnode-849_system_0.md
│   ├── trustguard-ai_instructor-llmnode-849_user_1.md
│   ├── trustguard-ai_instructor-llmnode-847_system_0.md
│   ├── trustguard-ai_instructor-llmnode-847_user_1.md
│   ├── trustguard-ai_instructor-llmnode-352_system_0.md
│   └── trustguard-ai_instructor-llmnode-352_user_1.md
├── model-configs/                 # LLM model configuration for each node
├── constitutions/                 # Behavioral guardrails for the agents
├── lamatic.config.ts              # Kit metadata (name, version, author, tags)
└── README.md
```

---

## Installation

### Prerequisites

Before you start, make sure you have the following:

- **Node.js** v18 or newer
- **npm** v9 or newer (comes with Node.js)
- A **Lamatic AI** account with a project set up at [lamatic.ai](https://lamatic.ai)
- The TrustGuard AI flow deployed inside your Lamatic project

### Environment Variables

Copy the example env file and fill in your own values:

```bash
cp apps/.env.example apps/.env.local
```

Then open `apps/.env.local` and set the following:

```env
# Your Lamatic project API key
LAMATIC_API_KEY=YOUR_LAMATIC_API_KEY

# Your Lamatic project ID (found in the project dashboard)
LAMATIC_PROJECT_ID=YOUR_PROJECT_ID

# Your Lamatic project endpoint URL
LAMATIC_API_URL=https://your-project.lamatic.dev

# The flow ID of the deployed trustguard-ai flow
TRUSTGUARD_FLOW_ID=YOUR_FLOW_ID

# Display name for the app (optional, shown in the UI)
NEXT_PUBLIC_APP_NAME="TrustGuard AI"
```

To get these values, log into your Lamatic dashboard, open your project, and import the flow from [`flows/trustguard-ai.ts`](./flows/trustguard-ai.ts). The flow ID will be shown after deployment.

---

## Running Locally

Once your `.env.local` is set up, install dependencies and start the dev server:

```bash
cd apps
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Deploying

The recommended way to deploy this is on [Vercel](https://vercel.com). It is a Next.js project, so it works out of the box.

1. Push your fork to GitHub
2. Import the repo into Vercel
3. Set the **root directory** to `apps`
4. Add all environment variables from your `.env.local` in the Vercel dashboard
5. Deploy

You can also deploy to any platform that supports Node.js (Railway, Render, Fly.io, etc.) by running `npm run build` followed by `npm start` from the `apps` directory.

---

## API Response

When the Lamatic flow completes successfully, the response follows this structure:

```json
{
  "investigation": {
    "id": "inv_abc123",
    "title": "Suspicious prize email from unknown sender",
    "category": "phishing",
    "status": "initialized",
    "workflow": "trustguard-ai",
    "language": "en"
  },
  "normalized": {
    "clean_text": "...",
    "summary": "An email claiming the recipient has won a prize and requesting personal details.",
    "detected_input_type": "email"
  },
  "evidence": {
    "urls": ["http://claim-prize-now.xyz/redeem"],
    "domains": ["claim-prize-now.xyz"],
    "emails": ["support@claim-prize-now.xyz"],
    "phone_numbers": [],
    "money_amounts": ["$5,000"],
    "brands": ["PayPal"],
    "urgency_phrases": ["respond within 24 hours", "limited time offer"],
    "attachments": [],
    "languages": ["en"],
    "entities": ["John Smith", "PayPal"]
  },
  "analysis": {
    "risk_score": 91,
    "confidence": 88,
    "severity": "CRITICAL",
    "indicators": {
      "high": ["Suspicious domain registered recently", "Fake brand impersonation"],
      "medium": ["Urgency language detected"],
      "low": ["No HTTPS on linked URL"]
    },
    "matched_patterns": ["Lottery Scam", "Credential Harvesting"],
    "missing_information": ["Sender identity unverifiable"],
    "reasoning_summary": "Multiple high-confidence indicators of a lottery phishing scam targeting personal data."
  },
  "decision": {
    "classification": "SCAM",
    "final_verdict": "This content is a fraudulent lottery scam designed to harvest personal information.",
    "recommended_action": "Do not click any links. Block the sender. Report to your email provider.",
    "decision_reason": "High risk score, multiple matched scam patterns, suspicious unregistered domain.",
    "priority": "HIGH",
    "human_review": false
  },
  "metadata": {
    "workflow": "trustguard-ai",
    "version": "1.0.0"
  }
}
```

The TypeScript types for this response are defined in [`apps/types/response.ts`](./apps/types/response.ts).

---

## Future Improvements

- **Web search grounding** - Let the Evidence Extractor cross-reference URLs and domains against known scam databases in real time
- **File upload support** - Allow users to upload PDFs, screenshots, or `.eml` files directly instead of pasting text
- **Memory and history** - Store past investigations per user so they can review their analysis history
- **Confidence thresholds** - Let operators configure the minimum confidence score required before surfacing a verdict
- **Webhook support** - Add an option for the flow to POST results to a webhook URL for integration into external platforms
- **Localization** - Full UI translation support for non-English languages beyond just input detection
- **Admin dashboard** - Aggregate view of all investigations with filtering, statistics, and export options
- **Browser extension** - A lightweight extension that lets users right-click any suspicious content and analyze it instantly

---

## License

This project is licensed under the MIT License.

---

## Author

**Tuhin Sarkar**
- GitHub: [@Tuhin402](https://github.com/Tuhin402)
- Email: tuhinsarkar581@gmail.com

---

## Acknowledgements

- [Lamatic AI](https://lamatic.ai) for the flow orchestration platform and the AgentKit ecosystem that made building this straightforward
- The [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) contributors for the kit structure and conventions
- [Vercel](https://vercel.com) for the seamless Next.js deployment experience
- [Google Fonts](https://fonts.google.com) for the Inter typeface
