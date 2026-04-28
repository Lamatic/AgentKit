/*
 * # 2. SEO Optimization
 * A flow that refines an existing blog draft for search optimization and serves as the SEO-focused middle stage in the wider blog writing automation pipeline.
 *
 * ## Purpose
 * This flow is responsible for taking a completed blog draft and improving it for search engine visibility using a supplied keyword set. Its job is not to invent a topic from scratch or publish content to a destination system, but to transform draft-quality prose into a more discoverable, keyword-aligned article while preserving the original intent of the post.
 *
 * The outcome is a single SEO-optimized blog post returned as Markdown in the `generatedResponse` field. That output matters because the broader agent pipeline is intentionally split into drafting, SEO refinement, and publishing. By isolating optimization into its own flow, operators can review or rerun SEO work independently, swap prompts or models without affecting drafting logic, and ensure the content passed to publishing is already aligned with target search terms.
 *
 * Within the larger chain described by the parent agent, this flow sits after drafting and before publishing. In practical terms, it belongs to the synthesis and refinement stage: an upstream drafting flow produces a coherent article draft, this flow improves that draft against keyword goals, and a downstream publishing flow can then push the optimized content into a CMS or blog platform.
 *
 * ## When To Use
 * - Use when you already have a blog article draft and need it revised for SEO before publication.
 * - Use when an upstream drafting flow has produced `draft` content that should be strengthened against a known keyword strategy.
 * - Use when an external automation system has both the article body and the target keywords and needs a machine-readable API response containing optimized Markdown.
 * - Use when you want to rerun only the SEO stage of the content pipeline without regenerating the article from scratch.
 * - Use when a human reviewer has approved a draft structurally, but keyword targeting and discoverability still need improvement.
 *
 * ## When Not To Use
 * - Do not use this flow to create a blog post from only a topic idea; the drafting flow is the correct entry point for content generation.
 * - Do not use this flow if you do not yet have a valid `draft` string to optimize.
 * - Do not use this flow if you need to publish content to a CMS or blog platform; that responsibility belongs to the publish flow.
 * - Do not use this flow when the required `keywords` input is missing, empty, or not meaningful for search optimization.
 * - Do not use this flow for non-blog content unless you are comfortable with a prompt and output format designed specifically for blog-style Markdown content.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `draft` | `string` | Yes | The blog post draft to optimize |
 * | `keywords` | `string` | Yes | Target keywords for SEO optimization |
 *
 * Both inputs are expected to arrive at the API trigger as plain string fields. The flow assumes `draft` contains enough substantive content to optimize and that `keywords` is a usable keyword list or phrase set, typically supplied as comma-separated terms. No explicit schema-level length checks or normalization rules are defined in the flow, so upstream systems should validate emptiness, formatting, and language suitability before invocation.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `generatedResponse` | `string` | The SEO-optimized blog post in Markdown format |
 *
 * The response is a single string returned in `generatedResponse`. In practice, this is prose content rather than a structured object: the model is expected to return a complete SEO-optimized article body in Markdown. Because the flow maps the LLM output directly into the API response, completeness, formatting consistency, and exact structure depend on the referenced prompt and model behavior.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `1. Blog Drafting` typically runs before this flow in the standard pipeline.
 *   - It must have produced the article text that this flow consumes as the `draft` input.
 *   - Its output may be named `draft` or `content` at the orchestration layer, but by the time this flow is invoked it must be mapped into the `draft` field expected by this flow.
 * - This flow is not a standalone authoring step in the intended kit workflow, even though it can be invoked directly by API if a caller already has suitable `draft` and `keywords` values.
 *
 * ### Downstream Flows
 * - `Publish Flow` consumes the optimized article produced by this flow.
 *   - It needs the SEO-refined content, typically mapped from this flow's `generatedResponse` output into the publishing flow's expected content field such as `content`.
 *   - A title may still need to be supplied separately, depending on the downstream publishing contract.
 *
 * ### External Services
 * - Lamatic `graphqlNode` trigger interface — receives the incoming API or webhook-style request — requires Lamatic deployment/runtime configuration
 * - Lamatic LLM execution runtime via `LLMNode` — generates the SEO-optimized article from the draft and keywords — requires the referenced model configuration to be available in the project
 * - Configured generative model from `@model-configs/blog-seo_seo-optimize-content.ts` — performs the actual optimization inference — required credential depends on the provider defined in that model config
 * - Prompt resource `@prompts/blog-seo_seo-optimize-content_user.md` — supplies the optimization instructions to the model — no separate credential, but must exist in the project
 *
 * ### Environment Variables
 * - No flow-specific environment variables are referenced directly inside this flow's node definitions.
 * - Lamatic platform connection variables such as `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` are required by external callers or orchestrators invoking the deployed flow, not by any individual node declared inside this flow file.
 * - Any provider-specific model credentials required by `@model-configs/blog-seo_seo-optimize-content.ts` are indirect dependencies of the `SEO Optimize Content` node, but they are not named in this flow source.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - This is the entry point for the flow and is implemented as a Lamatic `graphqlNode` trigger.
 *    - It receives the inbound request payload and exposes the incoming fields to downstream nodes.
 *    - For this flow, the important trigger fields are `draft` and `keywords`, which together define the content to optimize and the keyword strategy to apply.
 *    - The trigger is configured for a realtime response path, so callers should expect synchronous execution behavior rather than an asynchronous job pattern.
 *
 * 2. `SEO Optimize Content` (`dynamicNode` using `LLMNode`)
 *    - This node is the core of the flow.
 *    - It invokes the model configuration referenced by `@model-configs/blog-seo_seo-optimize-content.ts` and supplies a user prompt from `@prompts/blog-seo_seo-optimize-content_user.md`.
 *    - Using the trigger-provided `draft` and `keywords`, it generates an SEO-optimized version of the article.
 *    - No additional tools are attached to this node, so all optimization behavior is prompt-and-model driven.
 *    - The node emits a single text output that represents the refined article content.
 *
 * 3. `API Response` (`responseNode`)
 *    - This node packages the final result for the caller.
 *    - It maps `LLMNode_seo.output` directly into the response field `generatedResponse`.
 *    - The response is returned as JSON with `content-type` set to `application/json`.
 *    - No retry behavior is configured at this response stage, so failures upstream will surface directly rather than being retried here.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow returns an error before generation starts | The incoming request did not include required `draft` or `keywords` fields | Ensure the caller sends both required string inputs and that the orchestration layer maps upstream fields correctly |
 * | SEO output is weak, generic, or not keyword-aligned | The `keywords` input is too vague, malformed, or not suited to the draft topic | Provide a cleaner keyword list with specific target terms and align it with the article subject before invoking the flow |
 * | Output is empty or unexpectedly short | The upstream `draft` was empty, too small to optimize meaningfully, or the model returned an incomplete result | Validate that `draft` contains substantial article text and consider rerunning the flow with a stronger source draft |
 * | Invocation works in isolation but fails in the full pipeline | The upstream drafting flow did not run, or its output was not mapped into this flow's `draft` input | Verify orchestration sequencing and confirm the drafting step completed successfully and passed its content into `draft` |
 * | Model execution fails at runtime | The referenced model configuration is missing, invalid, or lacks provider credentials | Confirm that `@model-configs/blog-seo_seo-optimize-content.ts` exists, is deployed correctly, and has access to the required model provider credentials |
 * | Response shape is correct but content formatting is inconsistent | The LLM output is passed through directly, so formatting depends on prompt/model behavior | Refine the SEO prompt, tighten formatting instructions, or post-process Markdown downstream if strict formatting is required |
 * | Caller receives no published URL or status | This flow does not perform publishing; it only returns optimized content | Route the resulting `generatedResponse` into the dedicated publish flow rather than expecting publication side effects here |
 *
 * ## Notes
 * - The flow is intentionally narrow in scope: it performs SEO optimization only and does not include review gates, metadata extraction, title generation, or CMS publishing.
 * - The output field is named `generatedResponse`, which is generic; orchestration code should remap it to a clearer downstream field such as `content` or `optimized_content` if needed.
 * - Because the response node maps the LLM output directly without transformation, any Markdown conventions, heading structure, or SEO tactics are governed primarily by the prompt asset and model configuration rather than by explicit node logic.
 * - The trigger is realtime, so very large drafts may affect latency experienced by synchronous callers.
 */

// Flow: blog-seo

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "2. SEO Optimization",
  "description": "Optimizes a blog post draft for SEO using target keywords.",
  "tags": [
    "seo",
    "optimization",
    "content",
    "ai"
  ],
  "testInput": {
    "draft": "This is a sample blog post about AI in content creation...",
    "keywords": "AI, content, automation, blogging"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
// Deployer-configurable fields, keyed by node ID (matches deep-search pattern).
// Payload fields (draft, keywords) come in via the trigger's `advance_schema`
// and are NOT part of `inputs` — those are runtime args, not pre-deployment config.
export const inputs = {
  "LLMNode_seo": [
    {
      "mode": "chat",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model used to SEO-optimize the blog draft.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "modelConfigs": {
    "blog_seo_seo_optimize_content": "@model-configs/blog-seo_seo-optimize-content.ts"
  },
  "prompts": {
    "blog_seo_seo_optimize_content_user": "@prompts/blog-seo_seo-optimize-content_user.md"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_2",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "LLMNode_seo",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "seo_prompt_1",
            "role": "user",
            "content": "@prompts/blog-seo_seo-optimize-content_user.md"
          }
        ],
        "nodeName": "SEO Optimize Content",
        "generativeModelName": "@model-configs/blog-seo_seo-optimize-content.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_2",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"generatedResponse\": \"{{LLMNode_seo.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 300
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_2-LLMNode_seo",
    "type": "defaultEdge",
    "source": "triggerNode_2",
    "target": "LLMNode_seo",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_seo-responseNode_triggerNode_2",
    "type": "defaultEdge",
    "source": "LLMNode_seo",
    "target": "responseNode_triggerNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_2",
    "type": "responseEdge",
    "source": "triggerNode_2",
    "target": "responseNode_triggerNode_2",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
