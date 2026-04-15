/*
 * # Medical Assistant Chat
 * A conversational medical-information flow that serves as the system’s single API entry point for answering general health questions, offering symptom guidance, and returning medically cautious responses for UI or service consumption.
 *
 * ## Purpose
 * This flow is responsible for handling direct end-user medical-information queries in a safe, conversational format. It accepts a single text question or symptom description, passes that query to a configured language model, and produces a response designed for general education rather than diagnosis. Its core job is not to determine clinical truth for a specific individual, but to translate broad, widely accepted medical knowledge into clear, readable guidance with explicit caution around limitations.
 *
 * The outcome of this flow is a single generated `answer` string that can be rendered directly in a chat UI or consumed by another caller. That outcome matters because it is the user-facing response surface for the kit: it is where disclaimers, emergency escalation guidance, symptom context, and general wellness suggestions are actually delivered. In this project, the quality and safety of that final answer determine whether the broader assistant behaves as intended.
 *
 * Within the wider agent architecture, this flow sits at both the entry point and synthesis layer. According to the parent agent, the kit uses a single-flow design: there is no separate planning, retrieval, or routing chain before execution. The `APITrigger` collects the request, and the `LLMNode` performs the full response generation step in one pass. That makes this flow the canonical endpoint for the system’s medical-assistant capability and the primary unit to invoke or chain from external orchestration.
 *
 * ## When To Use
 * - Use when a caller has a natural-language medical or wellness question that can be answered with general informational guidance.
 * - Use when a user wants common symptom descriptions, possible associations, or high-level explanations of conditions without requesting a formal diagnosis.
 * - Use when a chat UI needs a markdown-friendly answer for a health-related prompt.
 * - Use when the goal is to provide cautious, empathetic medical education that explicitly recommends professional consultation.
 * - Use when the interaction should include safety language, such as directing the user to emergency services if the described situation appears urgent.
 * - Use when no separate retrieval, records lookup, or multi-step medical workflow has been configured and a single-turn LLM response is sufficient.
 * - Use as the default medical-assistant endpoint in this kit, since the parent agent defines this as the only flow in the pipeline.
 *
 * ## When Not To Use
 * - Do not use when the input does not contain a text `query`; this flow only accepts a single string field at its trigger.
 * - Do not use when a caller expects a medical diagnosis, prescription, treatment order, or personalized clinical decision.
 * - Do not use when a workflow requires access to patient records, structured clinical data, or external medical databases; this flow has no retrieval or EHR integration.
 * - Do not use when the task is non-medical and should be routed to a general assistant or another domain-specific flow.
 * - Do not use when a downstream system requires structured medical entities, coded symptoms, or machine-validated triage outputs; this flow returns free-form prose only.
 * - Do not use when the necessary Lamatic deployment and credentials have not been configured, because the flow cannot be invoked successfully without them.
 * - Do not use as a substitute for emergency response handling; if a user is in immediate danger, the correct action is to direct them to emergency services rather than rely on this flow alone.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `query` | `string` | Yes | The user’s medical question, symptom description, or request for general health guidance. |
 *
 * The trigger expects a plain-text natural-language input in `query`. No explicit max length, format pattern, or language restriction is defined in the flow source, but the prompting assumes a coherent user message that the model can interpret conversationally. The flow also assumes the content is suitable for informational medical guidance and does not perform explicit schema-level validation beyond requiring a string-shaped field.
 *
 * In addition to trigger input, the flow requires runtime configuration of the private node input `generativeModelName` on `LLMNode_1`. This is not supplied by the caller at request time through the API trigger; it is a deployment-time or operator-selected model configuration that determines which text-generation model handles the response.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `string` | The generated medical-information response produced by the language model. |
 *
 * The response is a single prose field, not a structured object with separate diagnosis, disclaimer, or triage keys. The system prompt instructs the model to format its reply with headers and bullet points for readability, so the returned `answer` may contain markdown-like structure suitable for chat rendering. Completeness depends on model behavior and token limits, and the flow does not add a post-processing step to guarantee that every response includes all desired sections beyond what the prompt requests.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow and the primary invocation surface for the Medical Assistant kit.
 * - The parent agent describes a single-flow architecture, so no prior Lamatic flow must run before this one.
 * - The only prerequisite data is the inbound API payload containing `query`, supplied directly by the caller rather than another flow.
 *
 * ### Downstream Flows
 * - None are defined in the provided flow or parent agent context.
 * - The typical downstream consumer is an external caller such as the included web UI or another service that reads the returned `answer` field and renders or relays it.
 * - No Lamatic sibling flow is documented as consuming this flow’s outputs.
 *
 * ### External Services
 * - Lamatic Flow Runtime — hosts and orchestrates execution of the deployed flow — required through Lamatic project and API credentials
 * - Configured text generation model via `LLMNode_1` — generates the medical-information response from the user query and system prompt — required through the selected `generativeModelName` model configuration
 *
 * ### Environment Variables
 * - `MEDICAL_ASSISTANT_CHAT` — deployed Flow ID used by external callers to invoke this specific flow — used outside the flow by the application or orchestration layer targeting this flow
 * - `LAMATIC_API_URL` — base URL for Lamatic API access — used outside the flow by the application or orchestration layer invoking the deployed flow
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated flow execution — used outside the flow by the application or orchestration layer invoking the deployed flow
 * - `LAMATIC_API_KEY` — API credential for Lamatic authentication — used outside the flow by the application or orchestration layer invoking the deployed flow
 *
 * ## Node Walkthrough
 * 1. `API Trigger` (`APITrigger`) receives an API request containing the `query` field. In this flow, that field is the full user message, such as a symptom question or a request for wellness advice. This node defines the public contract of the flow and is the sole entry point.
 *
 * 2. `Medical Assistant LLM` (`LLMNode`) takes the incoming `query` and injects it directly into the node’s user prompt. It also applies a fixed system prompt that frames the model as a medical information assistant rather than a doctor, instructs it not to diagnose, requires it to recommend consultation with healthcare professionals, tells it to escalate emergencies to emergency services, and asks for clear, empathetic, structured output. The node then generates a single `answer` string and returns that as the flow result.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow invocation fails before execution | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, or `LAMATIC_API_URL` is missing or invalid in the calling environment | Verify Lamatic credentials and project configuration in the caller’s environment, then retry the request. |
 * | Caller cannot find or invoke the flow | `MEDICAL_ASSISTANT_CHAT` is missing, incorrect, or points to an undeployed flow ID | Confirm the deployed flow ID in Lamatic Studio, update `MEDICAL_ASSISTANT_CHAT`, and ensure the flow is deployed. |
 * | Request is rejected or model output is absent | The input payload is missing `query` or `query` is not a string | Send a valid API payload with a non-empty string in `query`. |
 * | Response quality is poor or off-policy | `LLMNode_1` is configured with an unsuitable or unavailable `generativeModelName` | Select a valid chat-capable text generation model for `LLMNode_1` and retest with known sample prompts. |
 * | The flow returns an empty or truncated answer | Model generation limits, provider-side issues, or transient runtime failures | Retry the request, inspect model configuration, and choose a model or settings that support the expected response length. |
 * | Safety disclaimers are inconsistent | The model did not fully follow prompt instructions in a particular generation | Strengthen the system prompt, add post-processing or validation if strict disclaimer enforcement is required, and test against edge-case prompts. |
 * | A user expects structured triage or diagnosis but receives narrative guidance only | This flow is designed for informational prose and has no structured output schema beyond `answer` | Route such use cases to a different flow or extend this flow with structured extraction and validation steps. |
 * | An orchestration layer expects upstream context that is not present | No upstream flow exists in this kit; the caller assumed prior planning or retrieval had already run | Treat this flow as the entry point and provide the complete user request directly in `query`, or add an explicit upstream flow in a broader pipeline. |
 *
 * ## Notes
 * - The flow depends heavily on prompt-based safety behavior. It instructs the model to include disclaimers and avoid diagnosis, but there is no separate guardrail node or rule-enforcement layer in the exported flow.
 * - The referenced constitution `@constitutions/default.md` is part of the flow’s dependency set and may apply additional baseline behavior at runtime, even though its contents are not in the provided source.
 * - The node-level model selection input `generativeModelName` is marked private and required, which means operators must configure an appropriate model in Lamatic Studio for the flow to function.
 * - Because the flow is single-step and retrieval-free, it is best suited for broad, common medical-information questions rather than cases requiring citations, patient-specific context, or current clinical guidelines verification.
 * - The README and project intent indicate the returned text is expected to render well in a chat interface with markdown support.
 */

// Flow: medical-assistant-chat
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Medical Assistant Chat",
  "description": "A conversational medical assistant that provides general health information, symptom guidance, and wellness tips. Always includes disclaimers and recommends professional medical consultation.",
  "tags": [
    "medical",
    "chatbot",
    "health",
    "assistant"
  ],
  "testInput": {
    "query": "What are the common symptoms of the flu?"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate medical information responses based on the user query.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "APITrigger_1",
    "type": "APITrigger",
    "data": {
      "name": "API Trigger",
      "inputSchema": {
        "query": {
          "type": "string",
          "description": "The user's medical question or symptom description"
        }
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "LLMNode",
    "data": {
      "name": "Medical Assistant LLM",
      "systemPrompt": "You are a helpful medical information assistant. You provide general health information, symptom descriptions, and wellness guidance based on widely accepted medical knowledge.\n\nIMPORTANT GUIDELINES:\n1. Always clarify that you are an AI assistant, NOT a doctor.\n2. Never diagnose conditions — only describe possible associations.\n3. Always recommend consulting a healthcare professional for specific medical concerns.\n4. Provide evidence-based information when possible.\n5. If a query suggests a medical emergency, immediately advise calling emergency services.\n6. Be empathetic and clear in your responses.\n7. Structure your responses with headers and bullet points for readability.\n8. Include relevant general health tips when appropriate.",
      "userPrompt": "{{query}}",
      "outputSchema": {
        "answer": {
          "type": "string",
          "description": "The medical information response"
        }
      }
    }
  }
];

export const edges = [
  {
    "source": "APITrigger_1",
    "target": "LLMNode_1"
  }
];

export default { meta, inputs, references, nodes, edges };
