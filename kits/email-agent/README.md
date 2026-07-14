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
   - `EMAIL_VERIFIER_FLOW_ID`: Use `8472ff9e-cd35-47e6-b637-783dbcf91f73` (or your custom flow ID).
   - `EMAIL_REPLIER_FLOW_ID`: Use `b58fd1d3-3827-4c58-bdeb-10f17db9d91e` (or your custom flow ID).
   - `LAMATIC_PROJECT_ID`: `6aef8bb8-f7ba-4c2d-8539-4565a4a77683`
   - `LAMATIC_API_URL`: `https://krishnasorganization571-krishnasproject417.lamatic.dev/graphql`
   - `LAMATIC_API_KEY`: Your secret API key.

## Run Locally

```bash
cd apps
npm install
npm run dev
```

Open `http://localhost:3000` to interact with the application.
