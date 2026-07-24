# Email Agent

## Overview

This kit provides a unified AI-powered email assistant that performs two main tasks:
1. **Email Verification** – Analyzes inbound emails for legitimacy, intent, urgency, key points, and recommended actions.
2. **Email Replier** – Automatically drafts context-aware professional responses to inbound emails.

It is implemented as a kit with two separate Lamatic workflows exposed via a unified Next.js web application.

---

## Purpose

The goal is to provide a complete workspace assistant for email handling. Operators can input an email's sender, subject, and body, and instantly:
- Run a verification check to understand threat risk, intent, and summary points.
- Generate a reply draft that they can edit and copy.

This unified workspace simplifies inbox management, triage, and response generation for customer support, sales, or operation teams.

---

## Flows

### 1. Email Verifier

- **Trigger**: Synchronous `API Request` (`graphqlNode`) — accepts sender, subject, and body.
- **Processing**: `Verify Email` (`LLMNode`) — runs the system prompt at `@prompts/email-verifier_generate-text_system.md`.
- **Response**: `API Response` (`graphqlResponseNode`) — returns structured Markdown analysis report.

### 2. Email Replier

- **Trigger**: Synchronous `API Request` (`graphqlNode`) — accepts sender, subject, and body.
- **Processing**: `Draft Reply` (`LLMNode`) — runs system prompt at `@prompts/email-replier_generate-text_system.md`.
- **Response**: `API Response` (`graphqlResponseNode`) — returns the reply draft text.

---

## Guardrails

- Legitimacy reports must not fabricate sender safety assessments.
- Generated reply drafts must match the tone/formality of original email.
- Never execute external transactions or actions directly from the assistant.
- Sanitizes placeholders where information is missing.

---

## Environment Setup

| Variable                  | Description                                                    |
|---------------------------|----------------------------------------------------------------|
| `EMAIL_VERIFIER_FLOW_ID`  | The Lamatic Flow ID for the email verification workflow        |
| `EMAIL_REPLIER_FLOW_ID`   | The Lamatic Flow ID for the reply drafting workflow            |
| `LAMATIC_API_KEY`         | Your Lamatic API key                                           |
| `LAMATIC_API_URL`         | Your Lamatic GraphQL endpoint URL                              |
| `LAMATIC_PROJECT_ID`      | Your Lamatic Project ID                                        |

---

## Quickstart

1. Copy `apps/.env.example` to `apps/.env.local`.
2. Configure your flow IDs and API credentials.
3. Start the dev server:
   ```bash
   cd apps
   npm install
   npm run dev
   ```
