# Flow Copilot

Translates a plain-English AI agent requirement into a structured Lamatic Flow blueprint, grounded in real Lamatic node documentation via RAG.

## What this does

Give Flow Copilot a plain-English description of the AI agent you want to build (e.g., "I want a bot that reads customer emails and drafts replies"), and it returns:

- A one-sentence summary of the agent
- A numbered, step-by-step suggested flow using real Lamatic node types
- The exact node sequence
- Any assumptions it made, if the original request was ambiguous
- A structured JSON blueprint (flow name, trigger, nodes, node sequence, assumptions) for downstream use

## Setup

1. Deploy this kit's flows in Lamatic Studio: `flow-copilot` (the main conversational flow) and `ingest-node-docs` (the knowledge-base seeding flow).
2. Configure a Gemini API credential under **Settings → Connections** in your Lamatic project, and select it as the provider for each model config in this kit.
3. Run `ingest-node-docs` once before using Flow Copilot — this populates the `lamaticnodedocs` vector store that the RAG node queries. Re-run it any time you want to refresh or expand the indexed documentation.
4. Once both flows are deployed and the knowledge base is seeded, open the Chat Widget for `flow-copilot` to start using it.

## How to use

1. Open the deployed Chat Widget for this flow
2. Type a plain-English description of the AI agent you want to build
3. Read the returned blueprint — it lists the exact nodes to add and how to connect them in Lamatic Studio
4. Continue the conversation for follow-up refinements — Flow Copilot remembers prior turns

## Example

**Input:**

> I want an agent that summarizes long PDF reports into 3 bullet points.

**Output:**

> Summary: An agent that ingests a PDF, extracts its text, and generates a concise 3-bullet-point summary.
>
> Suggested Flow:
> 1. Trigger — File Upload: Receives the uploaded PDF.
> 2. Code Node — Text Extractor: Extracts raw text from the PDF.
> 3. LLM Node — Summarizer: Generates a 3-bullet-point summary.
>
> Node type sequence: Trigger → Code Node → LLM Node

## Flow structure

- **Chat Widget** — receives the user's plain-English request
- **Memory Retrieve** — pulls prior conversation context for multi-turn continuity
- **RAG Node** — retrieves relevant Lamatic node documentation from a vector store to ground the blueprint in real node types and patterns
- **Generate Text (LLM Node)** — powered by Gemini, analyzes the request plus retrieved context and produces the structured blueprint
- **Generate JSON (Instructor LLM Node)** — parses the blueprint into structured fields: `flowName`, `trigger`, `nodes`, `nodeSequence`, `assumptions`
- **Memory Add** — stores the exchange for future conversation turns
- **Chat Response** — returns the blueprint to the user

## Knowledge base

A companion flow, `ingest-node-docs`, seeds a `lamaticnodedocs` vector store with Lamatic node reference documentation, including common flow patterns and best practices, which the RAG node queries at runtime.

## Model used

Google Gemini (`gemini-3.5-flash-lite`, via Lamatic's Gemini API integration) — chosen for low latency and near-zero reasoning overhead.
