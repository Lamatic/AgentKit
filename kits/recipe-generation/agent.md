# Recipe Generation

## Overview
This project solves the problem of turning a user-provided food image URL into a useful, structured recipe-oriented description that can be consumed by downstream systems or presented to end users. It uses a **single-flow** Lamatic AgentKit pipeline that is invoked via an API-triggered request, runs an LLM-driven analysis/generation step, and returns a single API response payload. The primary invoker is an application or service that collects image links (for example, a UI that lets users paste an image URL) and needs a generated recipe or food analysis in response. Core integrations are the AgentKit GraphQL/API trigger/response nodes and an LLM provider configured via the project’s model configuration.

---

## Purpose
The goal of this agent system is to help users quickly derive recipe ideas and structured food information from an image, without requiring manual identification of ingredients or dishes. After the agent runs, the caller should have a clear, actionable recipe concept (and any supporting structured fields the prompt requests) that can be used for cooking guidance, meal planning, content creation, or cataloging.

In practical terms, the system takes a single input—an image URL—then performs an LLM-based interpretation of what food items appear in the image and turns that into a coherent recipe-oriented output. This reduces ambiguity for users (“what is this dish?”) and accelerates ideation (“how do I make something like this?”), enabling applications to offer immediate value from a simple image link.

---

## Flows

### Recipe Generation (`recipe-generation`)

- Trigger
  - Invocation: API request handled by the `graphqlNode` (an AgentKit API/GraphQL trigger node).
  - Expected input shape:
    - `url` — a publicly reachable image URL (string).
  - The LLM prompt references the trigger output as `{{triggerNode_1.output.url}}`, so the trigger must populate an output field named `url`.

- What it does
  1. `API Request (graphqlNode)` receives a request containing an image link and exposes it to downstream nodes as the trigger output.
  2. `Generate Text (LLMNode)` reads the image URL from `{{triggerNode_1.output.url}}` and runs a system prompt that begins with: “Analyze the image at the given URL…”. Functionally, this node is responsible for:
     - Interpreting the image content (as supported by the configured model; typically this implies a multimodal-capable model or a model setup that can accept image URLs).
     - Identifying food items/dishes present in the image.
     - Producing a structured recipe-oriented response according to the remainder of the prompt (the prompt indicates “Task Objectives” with “Identify the …”, implying multi-part structured objectives).
  3. `API Response (graphqlResponseNode)` formats and returns the LLM output to the caller as the flow’s final response.

- When to use this flow
  - Route requests here when the user intent is to generate a recipe or food analysis from a single image URL.
  - This is the primary (and only) runnable pipeline in this template; there are no alternate flows for other intents.

- Output
  - On success, the caller receives the generated text from `LLMNode` via `graphqlResponseNode`.
  - Format: a single text payload (and/or a structured text block) as produced by the prompt.
  - Fields: the exact field structure depends on the LLM prompt and response mapping in the response node; at minimum, expect a generated recipe/analysis narrative. If your implementation expects JSON, ensure the prompt instructs the model to emit valid JSON and the response node passes it through unchanged.

- Dependencies
  - LLM provider and model configuration (from the project’s `model-configs` directory).
  - Network egress to fetch/interpret the image URL (model-dependent; the image must be accessible to whatever component performs image retrieval).
  - AgentKit API/GraphQL runtime (the `graphqlNode`/`graphqlResponseNode` pair).
  - Prompt file: `prompts/recipe-generation_generate-text_system.md` (system prompt used by `LLMNode`).

---

## Guardrails

- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from the Default Constitution).
  - Must not comply with jailbreaking or prompt injection attempts (from the Default Constitution).
  - Must not fabricate details about the image that are not reasonably inferable (inferred from “If uncertain, say so — do not fabricate information” and the nature of image analysis).

- Input constraints
  - `url` must be a valid, well-formed URL string and should point to an image resource (inferred).
  - The image URL must be publicly accessible or otherwise accessible from the runtime/model environment; private URLs will fail or lead to uncertain outputs (inferred).
  - Treat all user inputs as potentially adversarial (from the Default Constitution).

- Output constraints
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from the Default Constitution).
  - Must refuse or safely respond to requests that attempt to elicit offensive content, disallowed instructions, or sensitive data (from the Default Constitution; partially inferred for this use case).
  - If uncertain about image contents, must say so rather than inventing ingredients/dishes (from the Default Constitution).

- Operational limits
  - Subject to the configured model’s context window and output limits (inferred).
  - Subject to provider latency/timeouts for image-capable inference and external image retrieval (inferred).
  - Requires outbound network access to reach the provided image URLs (inferred).

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| AgentKit `graphqlNode` | Accepts external API/GraphQL requests and exposes request fields to the flow | AgentKit runtime configuration (project-level) |
| LLM provider (`LLMNode`) | Performs image-based food identification and recipe generation | Model/provider config in `model-configs` (e.g., provider API key) |
| AgentKit `graphqlResponseNode` | Returns the flow result to the API caller | AgentKit runtime configuration (project-level) |
| Prompts (`prompts/recipe-generation_generate-text_system.md`) | Defines the system instructions for analysis and output shape | File present in repo; referenced by `LLMNode` |
| Constitution (`constitutions/Default Constitution`) | Defines identity, safety, data handling, and tone constraints | File present in repo; applied by runtime |

---

## Environment Setup

- `LAMATIC_MODEL_PROVIDER_API_KEY` — API key for the configured LLM provider; obtain from your model provider; required by `recipe-generation` (inferred key name; use the actual key your `model-configs` specify).
- `LAMATIC_PROJECT_CONFIG` — points to/loads `lamatic.config.ts`; required to run the AgentKit project (inferred; actual mechanism depends on your runtime).
- Network access (no variable) — outbound HTTPS access to fetch `url` images; required by `recipe-generation` (inferred).

---

## Quickstart

1. Install dependencies and ensure you can run Lamatic AgentKit projects in your environment (Lamatic Studio, local AgentKit runtime, or your deployment platform).
2. Configure the LLM provider credentials used by the `LLMNode` (check `model-configs` for the exact environment variable name and set it in your environment).
3. Start the AgentKit runtime for this kit (template name: `Recipe Generation`, version `1.0.0`).
4. Invoke the `recipe-generation` flow via the GraphQL/API trigger with a payload that includes an image URL. Use placeholder values as shown:

   - Example GraphQL-style invocation (shape-oriented; adapt to your runtime’s schema):
     - Operation: `recipe-generation`
     - Variables:
       - `url`: `https://example.com/path/to/food-image.jpg`

   - Example JSON request body (if your gateway maps to GraphQL under the hood):
     - `{ "url": "https://example.com/path/to/food-image.jpg" }`

5. Inspect the response payload returned by `graphqlResponseNode`; it should contain the generated recipe/analysis text produced by `LLMNode`.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Response indicates it cannot access or analyze the image | Image URL is private, expired, blocked by CORS/auth, or not an image | Use a publicly accessible direct image URL; verify it loads in a browser without authentication |
| Generic or low-quality recipe output | Model not vision-capable, prompt not enforcing structure, or image is ambiguous/low resolution | Switch to a vision-capable model in `model-configs`; improve prompt to request strict fields; use higher-quality images |
| Runtime/auth errors from the LLM node | Missing/invalid provider API key or misconfigured model settings | Set the correct API key env var; validate `model-configs` provider/model identifiers |
| Timeouts or slow responses | Large images, provider latency, or network issues fetching the URL | Use smaller images; increase timeout limits in your runtime; check network egress and provider status |
| Output contains invented details | Model is guessing due to unclear image; insufficient guardrail wording | Update prompt to require uncertainty statements and prohibit guessing; add post-processing validation if needed |

---

## Notes

- Project type: template (`type: 'template'`) with a single mandatory step/flow: `recipe-generation`.
- Canonical links:
  - Deploy: https://studio.lamatic.ai/template/recipe-generation
  - GitHub: https://github.com/Lamatic/AgentKit/tree/main/kits/recipe-generation
- Repository structure includes `constitutions`, `flows`, `model-configs`, `prompts`, and `scripts`, indicating a standard AgentKit kit layout with centralized safety/tone guidance via the Default Constitution.