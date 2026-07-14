# Email Agent Kit

This kit is an AI-powered email assistant that combines two powerful workflows:
1. **Email Verifier** – Evaluates inbound emails for intent, urgency, authenticity, and key details.
2. **Email Replier** – Drafts context-aware professional responses automatically.

It consists of two Lamatic workflows and a unified Next.js dashboard app.

## Prerequisites

- Node.js 18+
- A Lamatic.ai account and project

## Installation & Setup

1. Copy `.env.example` to `.env.local` inside the `apps` folder.
2. Fill in the required environment variables:
   - `EMAIL_VERIFIER_FLOW_ID`: Use (or your custom flow ID).
   - `EMAIL_REPLIER_FLOW_ID`: Use (or your custom flow ID).
   - `LAMATIC_PROJECT_ID`: 
   - `LAMATIC_API_URL`: 
   - `LAMATIC_API_KEY`: Your secret API key.

## Run Locally

```bash
cd apps
npm install
npm run dev
```

Open `http://localhost:3000` to interact with the application.