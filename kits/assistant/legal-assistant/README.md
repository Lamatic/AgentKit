# Legal Assistant

Legal Assistant is a Lamatic-powered research kit for answering legal questions against a connected legal corpus. It is built for statutes, regulations, case summaries, internal policy libraries, or legal memos that you have already indexed in Lamatic.

The UI asks for 3 things:

1. **Jurisdiction** so the answer is framed in the right legal system.
2. **Context** so the assistant sees the facts and procedural posture.
3. **Question** so the flow can return a research-style answer.

Every response is framed as informational only and pushes for citations plus practical next steps.

## Prerequisites

- Node.js 18+
- A Lamatic project with the bundled legal RAG flow imported and deployed
- A Lamatic-backed legal knowledge base or vector store connected to that flow

## Environment Variables

Create a `.env` file in this directory:

```bash
ASSISTANT_LEGAL_CHATBOT="your-deployed-flow-id"
LAMATIC_API_URL="https://your-org.lamatic.dev"
LAMATIC_PROJECT_ID="your-project-id"
LAMATIC_API_KEY="your-api-key"
```

## Lamatic Setup

Import `flows/legal-rag-chatbot/` into Lamatic Studio, connect the RAG node to your legal corpus, then deploy it and copy the deployed flow ID into `ASSISTANT_LEGAL_CHATBOT`.

The flow is meant to sit on top of legal source material such as:

- public statutes and regulations
- internal policy manuals
- legal knowledge bases
- case summaries or research notes

## Run Locally

```bash
cd kits/assistant/legal-assistant
npm install
cp .env.example .env
npm run dev
```

Then open `http://localhost:3000`.

## API Route

The frontend posts to `POST /api/legal` with:

```json
{
  "jurisdiction": "California",
  "context": "Commercial lease, 2 months unpaid rent, no prior default notices.",
  "question": "What notice is typically required before termination?"
}
```

The route packages that into a Lamatic `chatMessage`, executes the deployed legal RAG flow, and returns:

```json
{
  "answer": "Research-style legal response...",
  "disclaimer": "Informational only, not legal advice...",
  "jurisdiction": "California"
}
```

## Project Structure

```text
kits/assistant/legal-assistant/
├── app/
│   ├── api/legal/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── flows/
│   └── legal-rag-chatbot/
├── .env.example
├── config.json
├── package.json
└── README.md
```

## Important Note

This kit is for legal research support. It should not be presented as legal advice, and the bundled UI keeps that disclaimer visible by default.
