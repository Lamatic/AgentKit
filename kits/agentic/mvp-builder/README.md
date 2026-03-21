# MVP Builder – Idea to Production Plan using Lamatic AgentKit

Generate a complete MVP blueprint from a single idea using Lamatic flows.

This project takes a raw product idea and transforms it into a structured plan including:

- App type classification
- Core features
- Database schema
- API routes
- Project structure
- Tech stack
- Summary

---

## What This Kit Does

This kit converts a simple idea into a production-ready MVP plan using a multi-step Lamatic flow.

Instead of generating everything in one prompt, it uses a **chained agent workflow**:

1. Classifies the idea (web app, mobile app, extension, API)
2. Generates features
3. Designs database schema
4. Creates API routes
5. Builds project structure
6. Suggests tech stack
7. Produces a final summary

Each step builds on previous outputs, ensuring structured and coherent results.

---

## Demo Flow

```txt
User Input (idea)
   ↓
Lamatic Flow (7 nodes)
   ↓
Structured JSON (Plan)
   ↓
Next.js UI Rendering
```

---

## Flow Architecture

This kit uses a chained Instructor-based architecture:

1. Classify idea type
2. Generate features
3. Generate database schema
4. Generate API routes
5. Generate project structure
6. Generate tech stack
7. Generate summary

---

## Tech Stack

- **Frontend:** Next.js (App Router) + TailwindCSS
- **Backend:** Next.js Server Actions
- **AI Orchestration:** Lamatic AgentKit
- **Language:** TypeScript

---

## Folder Structure

```txt
.
├── actions/
│   └── orchestrate.ts        # Calls Lamatic flow
├── app/
│   ├── page.tsx             # Input screen
│   └── plan/page.tsx        # Result screen
├── components/
│   ├── content.tsx          # UI renderer for plan
│   └── loading.tsx
├── flows/
│   └── mvp-builder/         # Exported Lamatic flow
├── lib/
│   └── lamatic-client.ts    # SDK client
├── orchestrate.js           # Flow config
├── types/
│   └── index.ts             # Plan types
```

---

## Prerequisites

- Node.js 18+
- pnpm
- Lamatic account

---

## Environment Variables

Create a `.env` file using:

```env
AGENTIC_GENERATE_CONTENT="YOUR_FLOW_ID"
LAMATIC_API_URL="YOUR_API_ENDPOINT"
LAMATIC_PROJECT_ID="YOUR_PROJECT_ID"
LAMATIC_API_KEY="YOUR_API_KEY"
```

Reference:

---

## Setup Instructions

Install dependencies:

```bash
pnpm install
```

Run development server:

```bash
pnpm dev
```

What this does:

- Starts Next.js dev server
- Enables server actions
- Connects to Lamatic flow via SDK

---

## How It Works

### 1. User Input

User enters an idea on `/`

---

### 2. Server Action

`actions/orchestrate.ts`:

- Sends idea to Lamatic
- Executes flow via SDK
- Returns structured response

---

### 3. Lamatic Flow

Flow consists of multiple Instructor LLM nodes:

- Each node updates part of the JSON
- Uses schema enforcement
- Passes context forward

---

### 4. UI Rendering

`components/content.tsx`:

- Displays:
  - Features
  - Tech stack
  - Database tables
  - API routes
  - Project structure

---

## Example Output

```json
{
  "type": "web_app",
  "features": [...],
  "database": { "tables": [...] },
  "api": { "routes": [...] },
  "structure": {...},
  "tech_stack": {...},
  "summary": "..."
}
```

---

## How to Run Locally

1. Clone repo
2. Add `.env`
3. Run:

```bash
pnpm dev
```

4. Open:

```
http://localhost:3000
```

---
