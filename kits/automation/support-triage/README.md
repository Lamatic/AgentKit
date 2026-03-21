# AI Support Triage Engine

## What This Kit Does
Automates customer support by taking inbound tickets and instantly generating a category, sentiment analysis, urgency level, and a draft email response. This saves time, reduces manual routing work, and improves response clarity.

## Providers & Prerequisites
- Lamatic Studio Flow
- Gemini Free Tier (Note: Requires a 60-second cooldown between requests to prevent 429 Rate Limit errors).

## How to Run Locally
1. `cd kits/automation/support-triage`
2. `npm install`
3. `cp .env.example .env.local` and fill in your Lamatic API values.
4. `npm run dev`

## Lamatic Flow
Flow ID: `your-flow-id`