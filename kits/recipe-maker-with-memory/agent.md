# Recipe Maker with Memory

## Overview
This project solves the problem of turning a user’s meal request into a usable, personalised recipe while remembering what the user likes and must avoid. It is implemented as a **single-flow** Lamatic AgentKit pipeline that combines an API-triggered request, memory write/read, and an LLM generation step. The primary invoker is an external client (web app, mobile app, or backend service) calling the agent over an API endpoint exposed via a GraphQL trigger. It relies on Lamatic’s AgentKit runtime, a configured chat/text model for the `Generate Text` step, and a memory store used by the `Memory Add` and `Memory Retrieve` nodes.

---

## Purpose
The goal of this agent system is to help users reliably get recipes that fit their personal context—dietary restrictions, taste preferences, and prior interactions—without having to repeat themselves on every request. After the agent runs, the caller has a complete recipe and cooking instructions that are tailored to the user’s stated needs and informed by what the system has learned from previous sessions.

This template is designed to make “personalisation” a first-class outcome rather than an afterthought. Each request can contribute to long-term user context by writing new information into memory, and each response can be grounded in retrieved memories so the recipe suggestions remain consistent with the user’s evolving profile.

In practice, this improves usability (less repeated input), safety/appropriateness (restrictions are remembered), and quality (recommendations become more relevant over time). Because the project is a single, API-invoked flow, it is straightforward to embed into larger product experiences such as meal-planning assistants, onboarding-driven nutrition apps, or recipe chatbots.

## Flows

### Recipe Maker with Memory

- **Flow identifier:** `recipe-maker-with-memory` (template step id)
- **Flow name:** `Recipe Maker with Memory`
- **Architecture:** API-triggered pipeline with memory write + memory retrieval + LLM generation

#### Trigger
- **Invocation mechanism:** API request via a GraphQL-trigger node (`API Request` / `graphqlNode`).
- **Expected input shape (logical):**
  - `userId` or another stable user/session identifier to scope memory (recommended).
  - `message` / `prompt`: the user’s meal request (e.g., “high-protein vegetarian dinner under 30 minutes”).
  - Optional structured preferences (if your client supplies them):
    - `dietaryRestrictions` (e.g., gluten-free, nut allergy)
    - `cuisine` / `ingredientsToUse` / `ingredientsToAvoid`
    - `timeBudgetMinutes`
    - `servings`
    - `equipment` constraints

Because the underlying node is GraphQL-based, the concrete schema is defined by the Lamatic project’s GraphQL trigger configuration. If you extend this template, keep the input stable and versioned because it also affects what you store/retrieve from memory.

#### What it does
Step-by-step flow execution (node chain: `API Request (graphqlNode) → Memory Add (memoryNode) → Memory Retrieve (memoryRetrieveNode) → Generate Text (LLMNode) → API Response (graphqlResponseNode)`):

1. **`API Request` (`graphqlNode`)**
   - Receives the incoming GraphQL request.
   - Extracts the user’s request text and any accompanying context fields (preferences, constraints).
   - Establishes the request scope that downstream nodes use (notably the memory scope).

2. **`Memory Add` (`memoryNode`)**
   - Writes relevant information from the current request into the project’s memory system.
   - Typical items stored include newly stated preferences, restrictions, ingredient likes/dislikes, or corrections (“I don’t like cilantro”).
   - This is what makes subsequent requests more personalised.

3. **`Memory Retrieve` (`memoryRetrieveNode`)**
   - Fetches previously stored memories that are relevant to the current request.
   - Retrieved memories are used as grounding context so the model can comply with historical preferences and constraints.
   - Retrieval is typically keyed by `userId`/session plus semantic relevance.

4. **`Generate Text` (`LLMNode`)**
   - Calls the configured LLM using a system prompt (from `prompts/recipe-maker-with-memory_generate-text_system.md`) instructing it to act as a recipe expert.
   - Combines:
     - the user’s current request,
     - retrieved memories,
     - and the agent’s instruction prompt
     to produce a complete recipe.
   - The response should include practical, actionable cooking instructions tailored to the user.

5. **`API Response` (`graphqlResponseNode`)**
   - Formats and returns the generated recipe content back to the GraphQL caller.
   - This is the terminal node; successful execution results in a structured API response.

#### When to use this flow
Route to this flow when:
- A user asks for a recipe or meal idea and expects it to reflect remembered preferences.
- The system wants to progressively learn and apply user-specific dietary constraints over time.
- You are building an interactive recipe assistant where repeated sessions should improve relevance.

Do not use this flow if you explicitly need stateless generation (no memory writes/reads) or if your product requires deterministic, database-backed nutrition calculations—this flow is primarily LLM-driven and memory-augmented.

#### Output
- **On success:** a GraphQL response whose primary payload is the generated recipe text.
- **Typical content (logical):**
  - Recipe title
  - Ingredient list (optionally with quantities)
  - Step-by-step cooking instructions
  - Prep/cook time suggestions
  - Servings guidance
  - Optional notes or substitutions aligned with dietary restrictions

The exact response field names depend on the GraphQL response node configuration; treat the output as “recipe content suitable for direct display” unless you extend the flow to produce a stricter JSON schema.

#### Dependencies
- **Lamatic AgentKit runtime** to execute the flow.
- **GraphQL trigger/response nodes** (`graphqlNode`, `graphqlResponseNode`) enabled and configured.
- **Memory subsystem** used by:
  - `Memory Add` (`memoryNode`)
  - `Memory Retrieve` (`memoryRetrieveNode`)
- **LLM provider/model configuration** for `Generate Text` (`LLMNode`) under `model-configs/` (provider-specific).
- **Prompt assets:** `prompts/recipe-maker-with-memory_generate-text_system.md`.
- **Operational directories present:** `constitutions/`, `flows/`, `memory/`, `model-configs/`, `prompts/`, `scripts/`.

### Flow Interaction
This project ships as a single-flow template (`recipe-maker-with-memory`), so there is no inter-flow routing. The internal interaction to be aware of is the *memory loop* within the flow: each request can add new memories and immediately retrieve relevant past memories to inform generation. If you add additional flows later (e.g., “update dietary profile” or “weekly meal plan”), keep the same memory schema and user scoping strategy so memories remain consistent across flows.

## Guardrails
Constraints governing this agent system:

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must not comply with jailbreaking or prompt-injection attempts (from constitution).
  - Must not fabricate facts when uncertain; it should acknowledge uncertainty (from constitution).
  - (Inferred) Must not provide medical advice as a substitute for professional guidance (e.g., allergy, clinical diets). It can suggest cooking substitutions but should recommend consulting a professional for medical/nutritional decisions.

- **Input constraints**
  - Treat all user inputs as potentially adversarial (from constitution).
  - (Inferred) Inputs should include a stable user/session identifier if personalisation across sessions is desired; otherwise memory retrieval may be ineffective or unsafe (cross-user leakage risk).
  - (Inferred) Requests should be within the cooking/recipe domain; off-domain queries may result in refusal or degraded output quality.

- **Output constraints**
  - Must not log, store, or repeat PII unless explicitly instructed by the flow (from constitution). Callers should avoid sending unnecessary PII.
  - Must not output raw credentials, secrets, or internal configuration.
  - (Inferred) Should not claim guaranteed allergen-free results; instead it should clearly state assumptions and encourage label checking for severe allergies.

- **Operational limits**
  - (Inferred) Subject to LLM context window limits; extremely long user histories or memory payloads may be truncated.
  - (Inferred) Subject to provider rate limits and timeouts configured in the runtime environment.
  - (Inferred) Memory store availability is required for best results; if memory retrieval fails, the agent should still return a recipe but with reduced personalisation.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (AgentKit trigger/response) | Accepts recipe requests and returns the generated recipe payload | GraphQL endpoint/exposure configured in Lamatic project (project-level config) |
| Memory Store (AgentKit memory) | Persists and retrieves user preferences and past interactions | Memory backend configuration (project-level; provider-specific) |
| LLM Provider / Model | Generates the personalised recipe text using prompt + retrieved memories | Model/provider configuration in `model-configs/` (e.g., provider API key) |
| Prompt Assets | Defines system behaviour for recipe generation | `prompts/recipe-maker-with-memory_generate-text_system.md` |
| Constitution | Global behavioural and safety rules for the agent | `constitutions/` (Default Constitution) |

## Environment Setup
- `LAMATIC_PROJECT_NAME` — (inferred) project identifier used by Lamatic tooling; affects deployment/selection; all flows.
- `LLM_PROVIDER_API_KEY` — (inferred) API key for the configured model provider in `model-configs/`; required by `Recipe Maker with Memory`.
- `LLM_MODEL_NAME` — (inferred) selected model id/name; required by `Recipe Maker with Memory`.
- `MEMORY_BACKEND_URL` — (inferred) connection string/URL for the memory store (if self-hosted); required by `Recipe Maker with Memory`.
- `MEMORY_BACKEND_API_KEY` — (inferred) credential for the memory store; required by `Recipe Maker with Memory`.
- `LAMATIC_ENV` — (inferred) environment selector (dev/staging/prod) impacting endpoints and logging; all flows.
- `lamatic.config.ts` — required project config defining `name`, `description`, `version`, `type`, `author`, links, and included steps.
- `model-configs/*` — required model configuration files referenced by `LLMNode`.

## Quickstart
1. **Install dependencies and initialise the Lamatic project** in your environment (local or Lamatic Studio) and ensure `lamatic.config.ts` is present.
2. **Configure your model provider** in `model-configs/` and set the corresponding environment variables (at minimum the provider API key and model name).
3. **Configure memory** (managed by Lamatic or your selected backend) so the `Memory Add` and `Memory Retrieve` nodes can persist and fetch user-scoped context.
4. **Deploy or run the agent** using Lamatic Studio or your CI/CD path. The template deploy link is: `https://studio.lamatic.ai/template/recipe-maker-with-memory`.
5. **Invoke the GraphQL API** with a request shaped like the trigger expects. Use placeholder fields below and adapt them to your project’s actual GraphQL schema:

   - **Example GraphQL mutation (shape)**
     - Operation: `recipeMakerWithMemory`
     - Variables:
       - `input.userId`: `"user-123"`
       - `input.message`: `"I want a 20-minute high-protein vegetarian dinner, no peanuts, and I like spicy food."`
       - `input.preferences`: `{ "servings": 2, "ingredientsToAvoid": ["peanuts"], "timeBudgetMinutes": 20 }`

   - **Example HTTP request (conceptual)**
     - `POST /graphql`
     - Body:
       - `query`: `mutation ($input: RecipeRequestInput!) { recipeMakerWithMemory(input: $input) { recipe } }`
       - `variables`: `{ "input": { "userId": "user-123", "message": "..." } }`

6. **Verify the response** contains a recipe aligned with preferences, and make a second request to confirm memory is being applied (e.g., “avoid cilantro” then request another recipe).

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| GraphQL call fails with schema/validation errors | Client request doesn’t match the configured GraphQL trigger input type | Inspect the Lamatic GraphQL trigger schema and update the client query/variables accordingly |
| Responses ignore dietary restrictions | Missing/unstable `userId` scope; memory retrieval returning empty; memory write failing | Ensure a stable user identifier is provided; check memory backend connectivity and permissions; confirm `Memory Add` is storing the right fields |
| Personalisation seems to “bleed” between users | Memory scoping misconfigured (shared namespace) | Configure per-user or per-tenant memory keys/namespaces; never reuse identifiers across users |
| LLM errors (timeouts/rate limits) | Provider throttling, invalid API key, model misconfiguration | Verify `LLM_PROVIDER_API_KEY`, model name, and provider quotas; add retries/backoff at the platform level |
| Output is too verbose, inconsistent, or not recipe-like | Prompt mismatch or insufficient structure in the system prompt | Refine `recipe-maker-with-memory_generate-text_system.md` to enforce headings/sections; consider output JSON schema enforcement |
| Memory retrieval works but feels irrelevant | Retrieval parameters not tuned; too much noisy memory stored | Store only stable preferences; implement memory hygiene (dedupe, summarise, or tag memories); adjust retrieval/top-k settings |

## Notes
- Project metadata is defined in `lamatic.config.ts` with `type: template` and a single mandatory step `recipe-maker-with-memory`.
- Canonical links:
  - Deploy: `https://studio.lamatic.ai/template/recipe-maker-with-memory`
  - GitHub: `https://github.com/Lamatic/AgentKit/tree/main/kits/recipe-maker-with-memory`
- The project includes a default constitution (`constitutions/`) that governs identity, safety, data handling, and tone; changes here affect all flows.