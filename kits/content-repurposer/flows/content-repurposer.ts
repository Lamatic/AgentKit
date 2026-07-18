/*
 * # Content Repurposer
 * This flow accepts a blog post/article URL or raw text, extracts the content, and returns repurposed versions for LinkedIn, Twitter/X, newsletter, and key takeaways as the canonical entrypoint for the content repurposing pipeline.
 *
 * ## Purpose
 * This flow is responsible for the core sub-task of turning a single piece of long-form content into a complete cross-platform distribution package. It solves the problem of efficiently repurposing content for multiple channels without manual rewriting.
 *
 * In practical terms, it receives a URL (or raw text), scrapes the main article body, and hands that extracted text to a language model with platform-specific prompts to generate LinkedIn posts, Twitter/X threads, newsletter blurbs, and key takeaways.
 *
 * The outcome is a structured JSON response containing all four formats. That output matters because it enables content teams to publish across LinkedIn, Twitter/X, email newsletters, and internal summaries with a single action, saving hours of manual content adaptation.
 *
 * Within the broader agent context, this is an entry-point flow in a simple retrieve-and-synthesize chain. It sits after invocation and before any downstream publishing or scheduling layers.
 *
 * ## When To Use
 * - Use when a caller needs to repurpose a blog post or article for LinkedIn, Twitter/X, and email distribution.
 * - Use when the desired input is a public web page URL rather than pasted raw text.
 * - Use when you want the system to extract the main readable content automatically before repurposing it.
 * - Use when a backend service, UI action, or automation needs a synchronous API-style content-to-multiple-formats transformation.
 * - Use when you need consistent, on-brand messaging across channels without manual rewriting.
 *
 * ## When Not To Use
 * - Do not use when the input is not a URL or text, such as images, PDFs, or audio files.
 * - Do not use when the target page is private, login-gated, blocked from the runtime, or otherwise inaccessible to the scraper.
 * - Do not use when you need repurposing across multiple articles in one request unless you first extend the flow to support batching explicitly.
 * - Do not use when the caller requires only a single format (e.g., just a LinkedIn post) — a simpler flow would be more appropriate.
 * - Do not use when credentials for the scraping provider or configured LLM provider are unavailable, because the flow depends on both stages completing successfully.
 * - Do not use for content under 100 characters, as there is insufficient material for meaningful repurposing.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `contentUrl` | `string` | No | Public article URL supplied to the `API Request` trigger and passed into the `Scraper` node. |
 * | `contentText` | `string` | No | Raw text content to repurpose (used when no URL is provided). |
 *
 * At least one of `contentUrl` or `contentText` must be provided. If both are provided, `contentUrl` takes precedence and `contentText` serves as a fallback.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `content` | `string` | A single response containing all repurposed formats (LinkedIn post, Twitter/X thread, newsletter blurb, key takeaways) separated by section headers, mapped directly from `{{LLMNode_160.output.generatedResponse}}`. |
 *
 * The API response is a JSON object with a single `content` field containing all four formats with clear section headers for client-side parsing.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly by an API request.
 * - The only prerequisite is that the caller provide a valid `contentUrl` or `contentText` value at invocation time.
 *
 * ### Downstream Flows
 * - None are defined in this kit. The flow returns its result directly to the caller.
 * - If extended in a larger system, downstream consumers would typically use the four output fields for publishing workflows, scheduling tools, or content management systems.
 *
 * ### External Services
 * - Firecrawl-backed scraping via the `scraperNode` integration — used to fetch the target web page and extract readable main content — requires the scraping connector credentials configured in the Lamatic environment for the `Scraper` node.
 * - Configured LLM provider via `LLMNode` — used to generate the repurposed content formats from scraped content using the referenced prompts and model configuration — requires the provider credentials associated with `@model-configs/content-repurposer_generate-text.ts`.
 *
 * ### Environment Variables
 * - `FIRECRAWL_API_KEY` — enables page fetching and content extraction for the `Scraper` node.
 * - LLM provider credentials as required by `@model-configs/content-repurposer_generate-text.ts` — enable content generation in the `Generate Text` node. The exact variable names depend on the selected provider in that model config.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`)
 *    - This is the flow trigger and public entrypoint. It receives the incoming API payload and exposes request fields to downstream nodes.
 *    - It supplies the `contentUrl` and `contentText` fields that downstream nodes consume.
 *
 * 2. `Scraper` (`scraperNode`)
 *    - This node fetches the page at `{{triggerNode_1.output.contentUrl}}` and extracts article content from it.
 *    - It is configured with `onlyMainContent` enabled, so the flow favors the primary readable article body over navigation, sidebars, and page chrome.
 *    - The output of this node is the retrieved page content used by the content generation prompts.
 *
 * 3. `Generate Text` (`LLMNode`)
 *    - This node takes the scraped article content (or raw text, if provided) and sends it to the configured language model along with a system prompt and a user prompt specific to content repurposing.
 *    - The prompts are referenced from `@prompts/content-repurposer_generate-text_system.md` and `@prompts/content-repurposer_generate-text_user.md`, and model behavior is controlled by `@model-configs/content-repurposer_generate-text.ts`.
 *    - It generates four distinct content formats: LinkedIn post, Twitter/X thread, newsletter blurb, and key takeaways.
 *    - The node emits `generatedResponse`, which becomes the final structured output returned by the flow.
 *
 * 4. `API Response` (`graphqlResponseNode`)
 *    - This node shapes the outward API response.
 *    - It maps four fields from `{{LLMNode_160.output.generatedResponse}}` and returns that object to the caller in realtime mode.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before scraping starts | Neither `contentUrl` nor `contentText` provided | Ensure at least one of `contentUrl` or `contentText` is included in the request. |
 * | Scraper returns little or no usable content | The page is blocked, highly dynamic, non-article content, or inaccessible from the runtime | Test the URL manually, verify it is publicly reachable, and use pages with readable HTML article content. |
 * | Scraper authentication or connector error | Missing or invalid `FIRECRAWL_API_KEY` or scraper credential configuration | Configure the correct scraping credentials in the Lamatic environment and verify the integration is active. |
 * | Output is empty or low quality | The scraped content was empty, extremely short, noisy, or poorly extracted | Check scraper output quality first, then adjust extraction settings or target a cleaner source page. |
 * | LLM node fails to run | Missing model provider credentials or invalid model configuration reference | Verify the credentials and provider settings required by `@model-configs/content-repurposer_generate-text.ts`. |
 * | API response contains empty fields | The `Generate Text` node did not produce expected output format | Inspect the LLM response format and adjust prompts in `prompts/` to ensure structured output. |
 *
 * ## Notes
 * - The flow accepts either a URL or raw text; if both are provided, the URL takes precedence.
 * - The response mode is configured as realtime, so the flow is intended for synchronous request-response usage rather than long-running background execution.
 * - Because `onlyMainContent` is enabled, repurposing quality is generally improved for standard article pages, but results can still vary on sites with unusual DOM structures.
 * - No explicit content moderation, language detection, or retry logic is defined in the flow.
 * - The exact output style, verbosity, and structure are governed by the external prompt files and model configuration rather than hardcoded node logic.
 */

// Flow: content-repurposer

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Content Repurposer",
  "description": "Takes a blog post/article URL or raw text and repurposes it into multiple content formats: LinkedIn post, Twitter/X thread, newsletter blurb, and key takeaways for efficient cross-platform content distribution.",
  "tags": [
    "Content",
    "Social Media",
    "Marketing"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/content-repurposer",
  "author": {
    "name": "Tanay Mitra",
    "email": "tanaymitra54@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "content_repurposer_generate_text_user": "@prompts/content-repurposer_generate-text_user.md",
    "content_repurposer_generate_text_system": "@prompts/content-repurposer_generate-text_system.md"
  },
  "modelConfigs": {
    "content_repurposer_generate_text": "@model-configs/content-repurposer_generate-text.ts"
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
    "id": "scraperNode_252",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "scraperNode",
      "values": {
        "nodeName": "Scraper",
        "url": "{{triggerNode_1.output.contentUrl}}",
        "mobile": false,
        "waitFor": 123,
        "credentials": null,
        "excludeTags": [],
        "includeTags": [],
        "onlyMainContent": true,
        "skipTLsVerification": false
      }
    }
  },
  {
    "id": "LLMNode_160",
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
            "id": "user-prompt-001",
            "role": "user",
            "content": "@prompts/content-repurposer_generate-text_user.md"
          },
          {
            "id": "system-prompt-001",
            "role": "system",
            "content": "@prompts/content-repurposer_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/content-repurposer_generate-text.ts",
        "messages": "@model-configs/content-repurposer_generate-text.ts",
        "generativeModelName": "@model-configs/content-repurposer_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_651",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"content\": \"{{LLMNode_160.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-scraperNode_252",
    "source": "triggerNode_1",
    "target": "scraperNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "scraperNode_252-LLMNode_160",
    "source": "scraperNode_252",
    "target": "LLMNode_160",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_160-graphqlResponseNode_651",
    "source": "LLMNode_160",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_651",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
