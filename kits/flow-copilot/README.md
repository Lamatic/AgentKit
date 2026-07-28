# Flow Copilot

Translates a plain-English AI agent requirement into a structured Lamatic Flow blueprint.

## What this does

Give Flow Copilot a plain-English description of the AI agent you want to build (e.g., "I want a bot that reads customer emails and drafts replies"), and it returns:

- A one-sentence summary of the agent
- A numbered, step-by-step suggested flow using real Lamatic node types
- The exact node sequence (e.g., `Chat Trigger → LLM Node → Condition Node → LLM Node`)
- Any assumptions it made, if the original request was ambiguous

## How to use

1. Open the deployed Chat Widget for this flow
2. Type a plain-English description of the AI agent you want to build
3. Read the returned blueprint — it lists the exact nodes to add and how to connect them in Lamatic Studio

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

- **Chat Trigger** — receives the user's plain-English request
- **Generate Text (LLM Node)** — powered by Gemini, analyzes the request and produces the structured blueprint using a system prompt that enforces Lamatic's real node types and output format
- **Chat Response** — returns the blueprint to the user

## Model used

Google Gemini (via Lamatic's Gemini API integration)
