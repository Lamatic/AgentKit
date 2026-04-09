# Founder Lens

## Overview
Founder Lens automates investor-grade startup due diligence for non-technical founders who would otherwise spend weeks piecing together market data, competitor landscapes, and customer pain signals by hand. It uses a multi-flow architecture: an `Analyze` flow performs a 7-phase research-and-synthesis pipeline powered by parallel web search, then persists the resulting brief into both semantic (vector) and conversational memory. A separate `Chat` flow provides retrieval-augmented, interactive Q&A grounded in the stored brief and prior conversation history. The primary invoker is a UI or API client that submits a startup idea for analysis and then follows up with questions; the system integrates Lamatic AgentKit flows, Exa.ai for web search, an LLM provider (via OpenRouter; README badge indicates GPT-4o), and a vector database plus Lamatic memory.

---

## Purpose
Founder Lens exists to turn a raw startup idea into a decision-useful, brutally honest founder brief built from real web evidence. After it runs, a founder should have a structured view of what the market looks like, who the incumbents and emerging competitors are, what customers complain about in the wild, and what similar companies have tried and failed at—plus a skeptical “contrarian VC” critique meant to surface existential risks early.

The system is intentionally split into two flows that serve different outcomes. The `Founder Lens - Analyze` flow is the research engine: it decomposes the idea into targeted angles, performs parallel web research, and synthesizes a coherent brief; it then writes the result into persistent memory and a vector index so it can be reused without re-running search.

The `Founder Lens - Chat` flow is the interactive layer: it retrieves the stored brief and relevant memory, grounds an LLM response in that context (RAG), and maintains ongoing conversation state. Together, these flows let users get an initial analysis quickly and then iteratively explore implications, alternatives, and next steps while staying anchored to the original evidence base.

---

## Flows

### `Founder Lens - Analyze`

- **Trigger**
  - Invoked via an API-triggered GraphQL request (`graphqlNode`).
  - Expected input shape (inferred from prompt variables):
    - `idea` — a single string describing the startup idea (used as `{{triggerNode_1.output.idea}}`).

- **What it does**
  1. `API Request (graphqlNode)` receives the caller input (the startup idea) and begins the run.
  2. `Get Current Date (codeNode)` computes “today” for time-aware research framing (used in prompts).
  3. `Phase 0 - Idea Deconstruction (LLMNode)` rewrites and decomposes the idea into structured subcomponents and research angles.
  4. `Parse Decomposition (codeNode)` parses the LLM output into a machine-usable structure (e.g., query plan / facets) that downstream nodes can reference.
  5. Ten parallel `Exa Search` `apiNode`s run web searches across distinct research lenses:
     - `Exa Search - VC Trends` — funding/venture signals, trends, recent rounds.
     - `Exa Search - Unfair Advantage` — durable differentiators and defensibility signals.
     - `Exa Search - Twitter Customer Complaints` — social complaint mining (pain signals).
     - `Exa Search - Success DNA` — patterns from winners and breakouts.
     - `Exa Search - Reviews` — product reviews from common review ecosystems.
     - `Exa Search - Market Size` — TAM/SAM/SOM and market-sizing evidence.
     - `Exa Search - Dead Competitors` — failed attempts and postmortems.
     - `Exa Search - Customer Voice` — verbatim user language and needs.
     - `Exa Search - Competitors` — competitive mapping and positioning.
     - `Exa Search - Business Model` — pricing, monetization, and benchmarks.
  6. `Consolidate Research (codeNode)` normalizes and merges the parallel search results into a consolidated research bundle for synthesis.
  7. `Phase 7 - The Contrarian (LLMNode)` applies a skeptical VC persona to identify fatal flaws, wedge problems, weak assumptions, and “why this fails.”
  8. `Final Synthesis - Founder Brief (LLMNode)` produces the final structured Founder Brief combining the research bundle and contrarian critique.
  9. `Brief To Memory Facts (codeNode)` extracts durable “facts” or chunks from the brief suitable for storage and retrieval.
  10. `Vectorize Brief (vectorizeNode)` generates embeddings for brief chunks.
  11. `Pair Vectors With Metadata (codeNode)` attaches metadata (e.g., section, source, timestamps, idea identifiers) to each vector (exact fields not provided; function inferred).
  12. `Index Brief to VectorDB (IndexNode)` writes vectors into the configured vector store index.
  13. `Memory Add - Store Analysis (memoryNode)` stores the analysis outcome in Lamatic memory for later retrieval.
  14. `API Response (graphqlResponseNode)` returns the completed brief to the caller.

- **When to use this flow**
  - When a user submits a new startup idea and needs a full, evidence-backed analysis.
  - When the existing brief is stale and you want to refresh the research (e.g., market moved, new competitors, new funding).
  - When you need to (re)build the semantic index so downstream chat can retrieve grounded context.

- **Output**
  - A structured “Founder Brief” as LLM-generated text (likely sectioned; exact schema not provided).
  - The response is delivered via GraphQL response node; callers should treat it as the canonical analysis artifact for the idea.

- **Dependencies**
  - **External services**
    - Exa.ai search API (used by multiple `apiNode`s).
    - LLM provider (README indicates OpenRouter with GPT-4o badge; actual model config may be in `model-configs`).
    - Vector database accessed by `IndexNode` (provider not specified in provided materials).
  - **Lamatic/AgentKit components**
    - GraphQL trigger/response nodes, memory, vectorization, and indexing.
  - **Credentials / configuration**
    - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` (used by app to invoke Lamatic flows).
    - `FOUNDER_LENS_ANALYZE_FLOW_ID` (used by the app to select the correct Lamatic flow).
    - Exa.ai API key (not listed in `.env.example`; required by inference because Exa search nodes are present).

### `Founder Lens - Chat`

- **Trigger**
  - Invoked via an API-triggered GraphQL request (`graphqlNode`).
  - Expected input shape (inferred from prompt variables):
    - `message` — the user’s chat question or instruction (used as `{{triggerNode_1.output.message}}`).
    - Conversation/session identifiers are likely handled by Lamatic memory context (not explicitly shown).

- **What it does**
  1. `API Request (graphqlNode)` receives the user message.
  2. `Safe Message (codeNode)` sanitizes or normalizes the incoming message to reduce prompt injection risk and enforce basic safety policies.
  3. `Memory Retrieve - Conversation History (memoryRetrieveNode)` pulls relevant prior turns from persistent memory to maintain continuity.
  4. `RAG - Retrieve Brief (RAGNode)` retrieves the most relevant chunks of the previously indexed Founder Brief from the vector store.
     - Prompt constraint present: the RAG system prompt instructs to return retrieved context “exactly as-is” (no summarization).
  5. `Context Manager (codeNode)` composes the final context window for the chat LLM (e.g., merges retrieved brief chunks, conversation history, and any system constraints).
  6. `Founder Lens Chat (LLMNode)` generates an answer grounded in the retrieved brief and the conversation context.
  7. `Append Warning If Needed (codeNode)` adds a warning block when the response is likely under-grounded, speculative, or missing sufficient evidence (exact logic not provided; purpose inferred).
  8. `Memory Add - Store Conversation (memoryNode)` persists the user message and assistant response for future retrieval.
  9. `API Response (graphqlResponseNode)` returns the chat answer to the caller.

- **When to use this flow**
  - After a brief has been created for an idea and the user wants to ask follow-up questions (market entry strategy, positioning, ICP, pricing, risks).
  - When you want grounded answers that cite or reflect the stored analysis rather than re-running web research.
  - For iterative exploration where conversation history matters.

- **Output**
  - A chat response text grounded in retrieved brief context (exact GraphQL response schema not provided).
  - May include an appended warning if the system detects low grounding or uncertainty.

- **Dependencies**
  - **Vector store + embeddings** used by `RAGNode` to retrieve the brief (must already be indexed by the Analyze flow).
  - **Lamatic memory** for conversation persistence.
  - **LLM provider** (OpenRouter/GPT-4o indicated).
  - **Credentials / configuration**
    - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.
    - `FOUNDER_LENS_CHAT_FLOW_ID`.

### Flow Interaction
- The flows are designed to be chained logically:
  - `Founder Lens - Analyze` produces the canonical Founder Brief and indexes it into a vector database (`Index Brief to VectorDB`) and stores an analysis record in memory.
  - `Founder Lens - Chat` assumes that the brief already exists in the vector index and retrieves it via `RAG - Retrieve Brief` to answer questions.
- Operationally, route users to `Analyze` for new ideas (or refresh), and to `Chat` for iterative Q&A on an existing analysis.

---

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must not comply with jailbreak or prompt-injection attempts (from constitution; reinforced by `Safe Message`).
  - Must not fabricate information when uncertain; should acknowledge uncertainty (from constitution).
  - (Inferred) Must not present web research as exhaustive or guaranteed correct; the system is evidence-driven but depends on search results and model synthesis.

- **Input constraints**
  - Inputs should be limited to:
    - `Analyze`: a single startup idea description string.
    - `Chat`: a single user message string.
  - (Inferred) Avoid extremely long inputs that could crowd out retrieved context and reduce grounding.
  - Treat all user inputs as potentially adversarial (from constitution).

- **Output constraints**
  - Must not log, store, or repeat PII unless explicitly instructed by the flow (constitution). In practice, this means:
    - Do not echo sensitive personal data that a user might paste into an idea or chat prompt.
    - Keep stored memory focused on the brief and conversation content relevant to the product.
  - Must not return raw credentials, API keys, or internal configuration.
  - Must not output offensive content (constitution).

- **Operational limits**
  - (Inferred) Analyze flow latency depends on parallel web search and LLM synthesis; expect ~90 seconds per README.
  - (Inferred) RAG quality depends on successful prior indexing; Chat will degrade if vector index is empty or missing.
  - Environment dependency: requires valid Lamatic project + flow IDs; calls will fail if misconfigured.

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic AgentKit (Flows) | Orchestrates `Analyze` and `Chat` pipelines | `FOUNDER_LENS_ANALYZE_FLOW_ID`, `FOUNDER_LENS_CHAT_FLOW_ID` |
| Lamatic API | Remote execution of flows from the app/UI | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Exa.ai Search API | Web search and retrieval across multiple research lenses | (Not provided) `EXA_API_KEY` (inferred) |
| LLM Provider (OpenRouter; GPT-4o badge) | Idea deconstruction, contrarian critique, final synthesis, chat responses | (Not provided) OpenRouter key / model config (inferred; likely in `model-configs`) |
| Vector DB / Embeddings | Stores embeddings for brief chunks; enables semantic retrieval for RAG | Vector DB config (not provided; inferred) |
| Lamatic Memory | Stores analysis artifacts and conversation history | Project-level memory configuration (implicit) |

---

## Environment Setup
- `FOUNDER_LENS_ANALYZE_FLOW_ID` — Lamatic flow ID for `Founder Lens - Analyze`; set in `apps/.env`; used by the app when invoking analysis.
- `FOUNDER_LENS_CHAT_FLOW_ID` — Lamatic flow ID for `Founder Lens - Chat`; set in `apps/.env`; used by the app when invoking chat.
- `LAMATIC_API_URL` — base URL for the Lamatic API endpoint; required for both flows (app-side invocation).
- `LAMATIC_PROJECT_ID` — Lamatic project identifier; required for both flows.
- `LAMATIC_API_KEY` — Lamatic API key used by the app to authenticate; required for both flows.
- (Inferred) `EXA_API_KEY` — Exa.ai credential used by Exa search `apiNode`s in the Analyze flow.
- (Inferred) LLM provider credentials (e.g., `OPENROUTER_API_KEY`) — needed for LLM execution if not handled implicitly by Lamatic project settings.
- Config files / directories (present in project):
  - `lamatic.config.ts` — kit metadata and step wiring (maps env keys to flow IDs).
  - `model-configs/` — model/provider configuration (not included in provided materials).
  - `constitutions/` — contains the default constitution used as global behavior constraints.
  - `memory/` — memory configuration/storage assets (not included in provided materials).

---

## Quickstart
1. Provision credentials and IDs:
   - Create or open your Lamatic project.
   - Deploy/import the flows and note the resulting flow IDs.
   - Set `FOUNDER_LENS_ANALYZE_FLOW_ID`, `FOUNDER_LENS_CHAT_FLOW_ID`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` (and Exa/LLM keys if required by your environment).
2. Start the UI app (directory `apps/`) and load environment variables from `apps/.env` (based on `apps/.env.example`).
3. Invoke the Analyze flow via GraphQL (shape based on `graphqlNode` usage; exact operation name may differ by deployment):
   - Example request body:
     - `query`: `mutation RunFounderLensAnalyze($idea: String!) { runFounderLensAnalyze(idea: $idea) { brief } }`
     - `variables`: `{ "idea": "A tool that automates SOC2 compliance for early-stage startups" }`
4. Wait for completion (~90 seconds per README) and capture the returned Founder Brief.
5. Invoke the Chat flow with a follow-up question (requires that the brief has been indexed):
   - Example request body:
     - `query`: `mutation RunFounderLensChat($message: String!) { runFounderLensChat(message: $message) { answer } }`
     - `variables`: `{ "message": "What are the top 3 wedge strategies and why?" }`
6. Iterate: continue sending messages to Chat; conversation history is stored and retrieved automatically.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Analyze fails quickly with authentication/401 errors | Missing or invalid Lamatic API configuration | Verify `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`; confirm project permissions |
| Analyze returns thin or irrelevant research | Poor idea decomposition, weak queries, or low-signal Exa results | Refine the idea description; adjust decomposition prompt; validate Exa configuration and query parameters |
| Exa search nodes error or time out | Missing Exa credential or Exa service issue | Provide `EXA_API_KEY` (or Lamatic-managed secret); retry; reduce parallelism if configurable |
| Chat says it cannot find context / answers feel ungrounded | Brief not indexed, wrong vector index, or retrieval returning empty | Run `Founder Lens - Analyze` first; confirm `Index Brief to VectorDB` succeeded; verify vector DB configuration |
| Chat responses ignore prior conversation | Memory retrieval not returning history (session mismatch) | Ensure consistent session/user identifiers across calls (if applicable); check Lamatic memory configuration |
| Responses contain a warning footer frequently | Append-warning logic detecting low grounding or uncertainty | Ask more specific questions; ensure the Analyze brief includes the needed sections; expand retrieval scope if configurable |

---

## Notes
- This kit is a full app with UI (`type: kit`) and includes directories for flows, prompts, constitutions, memory, and model configs.
- Live demo is linked in `lamatic.config.ts`: `https://founder-lens-agentkit.vercel.app/`.
- The system is designed for “brutally honest” analysis; operator expectations should be aligned that outputs may be critical and should be treated as decision-support rather than financial advice.
