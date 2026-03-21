# 📄 Resume Reviewer Agent

An AI-powered resume reviewer built on Lamatic.ai's AgentKit framework.

## Problem
Job seekers struggle to get quality feedback on their resumes before applying. 
Most people don't have access to an experienced HR professional to review their work.

## Solution
An AI agent that reviews resumes like a senior HR professional with 10+ years of 
experience — providing structured, actionable feedback instantly.

## Features
- ✅ Strengths Analysis — what makes your resume stand out
- ❌ Weakness Detection — areas that need improvement  
- 💡 Actionable Suggestions — specific tips to improve
- ⭐ Score out of 10 — overall resume rating

## How to Use
1. Clone the repo
2. Navigate to this kit: `cd kits/assistant/resume-reviewer`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and add your Lamatic credentials
5. Run: `npm run dev`
6. Open `localhost:3000` and paste your resume in the chat widget

## Environment Variables
```env
NEXT_PUBLIC_PROJECT_ID=your_project_id
NEXT_PUBLIC_FLOW_ID=your_flow_id
NEXT_PUBLIC_API_URL=your_lamatic_api_url
```

## Lamatic Flow Setup
1. Create a new flow in Lamatic.ai
2. Add Chat Widget trigger
3. Add Generate Text node with resume review prompt
4. Add Chat Response node
5. Deploy the flow

## Tech Stack
- Next.js 16 + Tailwind CSS
- Lamatic.ai (Gemini 2.5)
- Chat Widget Integration

## Built by
Aman Agarwal — Lamatic.ai AgentKit Challenge