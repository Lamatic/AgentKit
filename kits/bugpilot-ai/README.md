# bugpilot-debugger

BugPilot Debugger is an AI-powered debugging assistant built using Lamatic AgentKit and Next.js.

The application helps developers analyze runtime errors and code issues by generating:

- Root cause analysis
- Beginner-friendly explanations
- Severity assessment
- Step-by-step fixes
- Corrected code examples
- Prevention tips

The project integrates a custom frontend with a Lamatic AI workflow using GraphQL APIs.

---

# Features

- AI-powered bug analysis
- Multi-language debugging support
- Clean developer-focused UI
- Real-time debugging responses
- Lamatic workflow integration
- GraphQL API communication
- Error handling for provider failures and quota limits
- Responsive frontend built with Tailwind CSS

---

# Tech Stack

## Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS

## Backend

- Next.js Route Handlers
- GraphQL API Integration

## AI Workflow

- Lamatic AgentKit
- Groq / Gemini models

---

# Project Structure

```bash
bugpilot-debugger/
│
├── apps/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── analyze/
│   │   │   │       └── route.ts
│   │   │   └── page.tsx
│
├── flows/
├── prompts/
├── model-configs/
├── constitutions/
├── agent.md
└── README.md
```

Prerequisites

Before running the project, ensure you have:

Node.js installed
npm installed
Lamatic account
Lamatic API Key
Lamatic deployed workflow

Setup Instructions

1. Clone Repository
   git clone <your-repository-url>
   cd bugpilot-debugger/apps
2. Install Dependencies
   npm install
3. Configure Environment Variables

Create a .env.local file inside the app directory.

LAMATIC_API_KEY=your_api_key
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_API_URL=your_api_url
BUGPILOT_DEBUGGER_FLOW_ID=your_flow_id

4. Start Development Server
   npm run dev

Open:

http://localhost:3000

Usage Example

Input
Programming Language: JavaScript
Error Message: Cannot read properties of undefined (reading 'map')
Code Snippet: const items = data.map(item => item.name)

Expected Output

The AI assistant returns:

Root cause analysis
Beginner-friendly explanation
Severity level
Step-by-step fix
Corrected code example
Prevention recommendations
Lamatic Workflow

The workflow contains:

1. API Request Node

Receives frontend payload.

2. Generate Text Node

Analyzes bug details using AI.

3. API Response Node

Returns debugging analysis to frontend.

API Flow

Frontend → Next.js API Route → Lamatic GraphQL API → AI Model → Frontend Response

Error Handling

The app gracefully handles:

AI provider overload
API failures
Invalid responses
Missing fields
Quota exceeded errors

Example fallback message:

AI provider is currently busy. Please retry in a few seconds.
Deployment
Frontend

Deploy using:

Vercel

Root directory:

kits/bugpilot-debugger/apps
Lamatic Workflow

Deploy through Lamatic Studio.

Future Improvements
Authentication
Markdown rendering
Syntax highlighting
Chat history
File upload support
Multi-agent debugging
Export debugging reports

Author: Aman Kumar
