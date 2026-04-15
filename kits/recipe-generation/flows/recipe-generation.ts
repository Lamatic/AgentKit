/*
 * # Recipe Generation
 * A flow that accepts an API request with a food image URL, uses an LLM to analyze the image and generate recipe-oriented output, and serves as the entry-point execution path for this single-flow agent system.
 *
 * ## Purpose
 * This flow is responsible for turning a user-provided image link into a useful recipe-generation result without requiring manual dish identification or ingredient entry. Its core job is to receive an image URL, pass that URL into a configured language model workflow, and return the model’s generated response through a synchronous API interface.
 *
 * The outcome of the flow is a single response payload containing the model-generated recipe-oriented text. That matters because it gives applications an immediate way to transform raw visual food input into something actionable for end users, such as recipe ideation, food analysis, or cooking guidance. In the wider system, this is the primary business outcome rather than an intermediate artifact.
 *
 * Within the broader pipeline described by the parent agent, this flow sits at the full request-to-response layer. There is no separate retrieval, planning, or post-processing flow ahead of or behind it. Instead, the `graphqlNode` trigger collects the image URL, the `LLMNode` performs the interpretation and synthesis step, and the response node returns the result directly. In other words, this flow combines intake and synthesis in one execution path and acts as the standalone entry point for the agent.
 *
 * ## When To Use
 * - Use when a caller has a publicly reachable food image URL and wants recipe ideas or food analysis generated from that image.
 * - Use when the request should be handled synchronously through an API-triggered Lamatic flow.
 * - Use when the desired outcome is a single generated response rather than a multi-step workflow with retrieval, enrichment, or approval stages.
 * - Use when the upstream application can provide the image link in a field named `url`.
 * - Use when the configured model supports the prompt’s expected behavior for image-based food interpretation.
 *
 * ## When Not To Use
 * - Do not use when the input is not an image URL, such as raw binary image data, local file paths, or unhosted images.
 * - Do not use when the image is not publicly accessible to the model or runtime environment.
 * - Do not use when the caller needs guaranteed structured JSON fields beyond the single returned text field.
 * - Do not use when another flow is responsible for preprocessing uploads, hosting images, or validating media before analysis.
 * - Do not use when no LLM credentials or model configuration are available in the deployment environment.
 * - Do not use when the request is unrelated to food imagery or recipe generation.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `url` | `string` | Yes | Publicly reachable URL of the food image to analyze and use as the basis for recipe-oriented generation. |
 *
 * The trigger definition does not declare typed inputs in `inputs`, but the flow logic clearly expects the trigger output field `url` to exist. The URL should be a valid, reachable image location, ideally over `https`, and should point to content the configured model can access. No explicit max length or schema validation is encoded in the flow source, so validation should be enforced by the caller or gateway before invocation.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `receipe` | `string` | The generated response produced by the `Generate Text` node and returned as the flow’s final API payload. |
 *
 * The output is a single text field mapped directly from `LLMNode_254.output.generatedResponse`. Despite the flow description mentioning structured output, this specific flow returns one top-level string field rather than a strongly typed object. Also note that the response field is spelled `receipe` in the output mapping; consumers should use that exact field name unless the flow is revised.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly by an API request.
 * - The only prerequisite is that the caller supplies a `url` value at trigger time so the `graphqlNode` can expose `triggerNode_1.output.url` to the LLM step.
 *
 * ### Downstream Flows
 * - None are defined in the provided flow or parent agent context.
 * - The parent agent describes this as a single-flow pipeline, so no additional Lamatic flows are shown consuming this flow’s output.
 * - External applications may consume the `receipe` response field directly for UI display, storage, or further processing.
 *
 * ### External Services
 * - Lamatic API/GraphQL trigger-response runtime — receives the inbound request and returns the final response — credential requirements depend on the deployment’s Lamatic environment
 * - Configured LLM provider via `@model-configs/recipe-generation_generate-text.ts` — analyzes the image URL according to the system prompt and generates the recipe-oriented response — provider credential is defined in the model configuration used by `Generate Text`
 * - Prompt resource `@prompts/recipe-generation_generate-text_system.md` — supplies the system-level instructions that govern image analysis and recipe generation — no separate credential
 *
 * ### Environment Variables
 * - Provider-specific LLM credential variable(s) — authenticate the model configured in `@model-configs/recipe-generation_generate-text.ts` — used by `Generate Text`
 * - No explicit environment variable names are exposed in the flow source. Check the referenced model configuration for the exact variable names required by the selected model provider.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the incoming API call and starts the flow. In practice, this node must expose an output field named `url`, because the downstream generation step reads the image location from `triggerNode_1.output.url`.
 *
 * 2. `Generate Text` (`LLMNode`) takes the image URL from the trigger context and runs the referenced system prompt together with the referenced model configuration. This node performs the core reasoning step of the flow: it interprets the food image, identifies what is shown, and generates recipe-oriented text based on the prompt instructions and the capabilities of the configured model.
 *
 * 3. `API Response` (`graphqlResponseNode`) returns the final API payload. It maps the LLM node’s `generatedResponse` into a single response field named `receipe`, which becomes the flow’s externally visible output.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request succeeds but the generated output is empty or unhelpful | The `url` field was missing, blank, inaccessible, or did not point to a usable food image | Validate that `url` is present, non-empty, publicly reachable, and points to a clear food image before invoking the flow |
 * | The flow fails during the LLM step | Missing or invalid model provider credentials in the environment or model configuration | Verify the credential variables required by `@model-configs/recipe-generation_generate-text.ts` and redeploy with valid values |
 * | The model does not appear to interpret the image correctly | The configured model may not support image URL understanding as expected, or the prompt-model pairing is misaligned | Confirm that the selected model is multimodal or otherwise supports the prompt’s image-analysis behavior; update the model configuration if needed |
 * | The caller cannot find the expected response field | The output key is named `receipe`, not `recipe` | Update the consuming client to read `receipe`, or revise the flow mapping if that spelling is unintended |
 * | The API returns an error before generation | Malformed request payload or wrong trigger field name | Ensure the request includes a field named `url` with a string value matching the flow’s expected input |
 * | The image URL works in a browser but not in the flow | The image host may block automated fetches, require authentication, or serve content conditionally | Use a stable public image URL with no authentication requirement and permissive access controls |
 * | Expected upstream preparation did not occur | A calling system assumed another flow would host, normalize, or validate uploaded images first | Add that preprocessing step outside this flow, or invoke the flow only after a public image URL has already been produced |
 *
 * ## Notes
 * - This flow is intentionally minimal: one trigger, one LLM generation step, and one response node.
 * - The flow source declares no private `inputs`, so operational configuration is concentrated in the referenced prompt and model configuration files rather than in the flow’s top-level input schema.
 * - Although the metadata and README describe “structured output,” the implemented response contract is currently a single string field. Any stronger structure must come from prompt formatting conventions inside the generated text, not from the API schema itself.
 * - The trigger node is configured for `realtime` response behavior, so callers should expect synchronous execution characteristics and model-latency-dependent response times.
 * - There is a default constitution reference in the flow, but no node-level behavior in the provided source explicitly maps or describes how it alters execution. If governance behavior is important, inspect the referenced constitution file alongside the model configuration.
 */

// Flow: recipe-generation

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Recipe Generation",
  "description": "This AI-powered recipe generation system processes user-provided image links, identifies food items, and generates structured output, enabling seamless analysis and recipe ideation from food images.",
  "tags": [
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/recipe-generation",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "recipe_generation_generate_text_system": "@prompts/recipe-generation_generate-text_system.md"
  },
  "modelConfigs": {
    "recipe_generation_generate_text": "@model-configs/recipe-generation_generate-text.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_254",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/recipe-generation_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/recipe-generation_generate-text.ts",
        "messages": "@model-configs/recipe-generation_generate-text.ts",
        "generativeModelName": "@model-configs/recipe-generation_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_393",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"receipe\": \"{{LLMNode_254.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_254",
    "source": "triggerNode_1",
    "target": "LLMNode_254",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_254-graphqlResponseNode_393",
    "source": "LLMNode_254",
    "target": "graphqlResponseNode_393",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_393",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_393",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
