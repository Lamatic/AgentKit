# AI Interview Prep Coach

## Overview
This project solves the problem of helping candidates prepare for interviews by generating personalized interview preparation kits based on the target role, company, background, and experience level. It uses Lamatic.ai's LLM orchestration flow to produce tailored technical and behavioral questions, answer tips, company insights, and a structured 30-60-90 day onboarding plan. The frontend application is built in Next.js and communicates with the Lamatic API.

---

## Purpose
The goal of this agent system is to provide targeted, contextual interview coaching. Instead of generic question lists, this coach analyzes the candidate's exact background (skills, past experience, projects) alongside details of the target company and role to provide highly relevant prep materials. It helps candidates structure their answers using frameworks like the STAR method and provides clear guidelines for their first 90 days if hired.

---

## Flows

### `Interview Coach Flow`

- **Flow ID / Env key mapping:** `interview-coach-flow` (configured via `LAMATIC_FLOW_ID`)

#### Trigger
- **Invocation type:** API request via a GraphQL trigger node (`API Request`).
- **Expected input shape:**
  - `jobRole` (string): The target job title/role.
  - `company` (string): The target company name.
  - `background` (string): The candidate's skills, experience, and projects.
  - `experienceLevel` (string): fresh / junior / mid / senior.

#### What it does
1. `API Request` (triggerNode): Receives the inputs from the Next.js app.
2. `LLM Node` (LLMNode_1): Calls the text LLM to generate the prep kit based on the system and user prompts.
3. `Parse JSON` (codeNode_parse_json): Parses the LLM's raw text response into a structured JSON object, stripping markdown code fences if present.
4. `API Response` (graphqlResponseNode_1): Returns the parsed JSON payload to the caller in realtime.

#### When to use this flow
- Use when a candidate inputs their career profile and needs a structured, company-specific preparation kit.
- Use when you need structured, multi-part preparation advice (questions + answer tips + insights + onboarding roadmap).

#### Output
A JSON object with the following fields:
- `quickSummary` (string): Candidates fit overview.
- `technicalQuestions` (array of strings): 8-10 role-specific technical questions.
- `behavioralQuestions` (array of strings): 5-6 behavioral questions.
- `answerTips` (array of strings): 4-5 STAR-method and role-specific tips.
- `companyInsights` (array of strings): 5-6 insights about company culture, values, or tech stack.
- `ninetyDayPlan` (object): Onboarding roadmap containing:
  - `first30` (array of strings)
  - `next30` (array of strings)
  - `final30` (array of strings)

#### Dependencies
- Lamatic Project credentials (endpoint, projectId, apiKey).
- Deployed flow ID for the interview prep flow.

---

## Guardrails
- **Safety Guidelines**: Must not generate harmful, discriminatory, or inappropriate coaching content.
- **Input validation**: Inputs should be validated on the client side before triggering the flow.
- **Output constraints**: The flow must return valid JSON structure matching the schema.

---

## Integration Reference

| Integration Type | Purpose | Config Key / Env Var |
|---|---|---|
| Lamatic Flow Execution | Trigger the interview prep generation flow | `LAMATIC_FLOW_ID` |
| Lamatic SDK Client | Initialize communication with Lamatic API | `LAMATIC_PROJECT_ENDPOINT`, `LAMATIC_PROJECT_ID`, `LAMATIC_PROJECT_API_KEY` |

---

## Environment Setup
Make sure the following variables are configured in `apps/.env`:
- `LAMATIC_FLOW_ID`
- `LAMATIC_PROJECT_ENDPOINT`
- `LAMATIC_PROJECT_ID`
- `LAMATIC_PROJECT_API_KEY`

---

## Quickstart
1. Set up the flow in Lamatic Studio and deploy.
2. Configure the env variables in `apps/.env`.
3. In `apps/`, run:
   ```bash
   npm install
   npm run dev
   ```
