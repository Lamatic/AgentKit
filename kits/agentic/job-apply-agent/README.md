# ApplyBud — Job Apply Agent

An AI agent that evaluates job postings against a candidate's resume, scores the match, and auto-generates tailored cover letters for qualified roles.

## What it does

1. Accepts a candidate resume (plain text) and a list of job posting URLs
2. Fetches and cleans each job description
3. Extracts structured requirements using AI
4. Scores the candidate's skills against each role (0–100)
5. Generates a professional, tailored cover letter for any job scoring ≥ 70
6. Returns results ranked by match score with qualified jobs first

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd kits/agentic/job-apply-agent
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values:
- `LAMATIC_API_KEY` — from Lamatic dashboard → Project Settings → API Keys
- `LAMATIC_PROJECT_ID` — your Lamatic project ID
- `LAMATIC_FLOW_ID` — the ID of your deployed job-apply-flow

### 3. Import the flow

In your Lamatic dashboard:
1. Go to Flows → Import
2. Upload the flow config from `flows/job-apply-flow/config.json`
3. Set your Groq API credential named `ApplyBud`
4. Deploy the flow
5. Copy the Flow ID into your `.env.local`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Via UI
1. Paste your resume text into the Resume field
2. Add one or more direct job posting URLs
3. Click Analyse
4. View match scores and generated cover letters

### Via API

```bash
curl -X POST https://your-lamatic-endpoint/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "resume": "Your resume text here...",
    "job_urls": [
      "https://jobs.example.com/senior-engineer-123"
    ]
  }'
```

## Flow Architecture

```
API Request (trigger)
    ↓
Resume Parser (Generate JSON)     — extracts candidate profile
    ↓
Fetch Job Pages (Code)            — fetches + strips HTML from URLs
    ↓
Loop over job pages
    ↓ [per job]
    Job Analyser (Generate JSON)  — extracts JD requirements
    ↓
    Match Scorer (Code)           — scores candidate vs job (0-100)
    ↓
    Condition: score >= 70?
    ↓ yes
    Cover Letter Generator (Generate Text)
        ↓ [outside loop]
Bundle Results (Code)             — merges + sorts all results
    ↓
API Response
```

## Model

All AI nodes use `groq/llama-3.1-8b-instant` via Groq.

## Score Threshold

Default match threshold is **70/100**. Jobs scoring below 70 are returned without a cover letter. To change the threshold, update the Condition node in the flow.

## Input Requirements

- **Resume**: Plain text only. No PDF, no markdown. Copy-paste from your resume.
- **Job URLs**: Must be direct job posting pages (not search results or listing pages). Each URL should open a single specific role.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Lamatic SDK
- Groq (llama-3.1-8b-instant)
