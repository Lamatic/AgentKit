/*
 * # 3. CMS Publishing
 * A flow that publishes finalized blog content to a CMS endpoint and returns publication metadata for the wider blog automation pipeline.
 *
 * ## Purpose
 * This flow is responsible for the final delivery step in the blog-writing pipeline: taking a prepared `title` and finalized `content` and sending them to a CMS for creation as a live post. In this implementation, the target is WordPress via its REST API, using a site-scoped post creation endpoint and an authenticated bearer token. The flow solves the operational problem of turning approved, machine-generated content into an actual published asset that can be visited, shared, indexed, and tracked.
 *
 * The outcome of the flow is a compact publication result containing the post `url`, publication `status`, and CMS-assigned `id`. That outcome matters because upstream generation work is only useful once content exists in the destination system. The returned metadata gives operators and downstream automation a reliable handle for confirmation, reporting, analytics registration, editorial auditing, or follow-up notifications.
 *
 * In the broader agent architecture, this is the terminal execution stage of the drafting → SEO → publishing chain described in the parent agent. It does not generate or improve content itself; instead, it consumes the final post payload after drafting and optimization have already happened, and converts that finalized artifact into a persistent CMS record. In plan-to-execution terms, this flow is the delivery step, not the synthesis step.
 *
 * ## When To Use
 * - Use when a blog post has already been drafted and finalized, and you need to create a live CMS post from that content.
 * - Use when the upstream drafting and SEO flows have produced publish-ready text and a stable `title`.
 * - Use when an external automation system, dashboard action, or orchestration layer needs a machine-readable publish result including `url`, `status`, and `id`.
 * - Use when the target CMS is WordPress-compatible through the configured WordPress REST API endpoint.
 * - Use when the intended action is immediate publication, not staging or review, because this flow hard-codes the post `status` to `publish`.
 *
 * ## When Not To Use
 * - Do not use this flow to generate a draft; the drafting flow is the correct stage for creating initial article content.
 * - Do not use this flow to improve keyword alignment, metadata, or SEO structure; the SEO flow is the correct stage for optimization.
 * - Do not use this flow when the content is still under review or should remain unpublished, because the flow submits posts with `status` set to `publish` rather than `draft`.
 * - Do not use this flow if `title` or `content` is missing, empty, or not a string.
 * - Do not use this flow until CMS credentials and site configuration have been supplied through environment variables.
 * - Do not use this flow for non-WordPress CMS targets unless they are exposed through a compatible endpoint and request contract; this implementation is explicitly wired to the WordPress post creation API.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `title` | `string` | Yes | The title of the blog post |
 * | `content` | `string` | Yes | The blog post content to publish |
 *
 * The trigger expects both fields to arrive in the API request payload exposed by `API Request`. The flow assumes both values are already publication-ready strings. No explicit in-flow validation, transformation, sanitization, or fallback logic is configured, so callers should ensure the title is non-empty and the content is complete, correctly formatted, and suitable for direct CMS publication.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `url` | `string` | The URL of the published blog post |
 * | `status` | `string` | The publish status such as `publish` or another CMS-returned state |
 * | `id` | `number` | The ID of the published post |
 *
 * The response is a small structured JSON object returned by the flow's API response node. Each field is mapped directly from the CMS API response: `url` comes from the WordPress `link`, `status` comes from the CMS post status, and `id` comes from the CMS-assigned post identifier. If the CMS call fails, these fields will not be meaningfully populated because the flow has no alternate response mapping for error normalization.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `1. Blog Drafting` — typically produces the initial article body that later becomes the `content` input to this flow, either directly or after review and optimization.
 * - SEO optimization flow — produces the finalized, publication-ready article body that this flow most commonly consumes as `content`.
 * - Any optional review or orchestration layer in the kit — may supply or confirm the final `title` and `content` before invoking this flow.
 *
 * This flow is API-invokable on its own, but within the intended kit architecture it usually runs after drafting and SEO have already completed. It consumes the final post payload as direct inputs, not by automatically fetching upstream flow outputs itself.
 *
 * ### Downstream Flows
 * - No Lamatic flow is shown as consuming this flow directly.
 * - External orchestrators, dashboards, notification systems, analytics registration jobs, or reporting layers may consume `url`, `status`, and `id` after publication.
 *
 * ### External Services
 * - WordPress REST API — creates the CMS post and returns publication metadata — requires `WORDPRESS_SITE_ID` and `WORDPRESS_TOKEN`
 * - Lamatic API/webhook-style trigger and response interface — receives invocation payloads and returns structured flow outputs — uses the flow's deployed trigger endpoint rather than an in-flow credential
 *
 * ### Environment Variables
 * - `WORDPRESS_SITE_ID` — identifies the target WordPress site in the REST endpoint URL — used by `Publish to WordPress`
 * - `WORDPRESS_TOKEN` — bearer token for authenticated CMS post creation — used by `Publish to WordPress`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the incoming API payload for the flow. It exposes the caller-provided `title` and `content` as structured trigger outputs for downstream use. This is the public entry point for the publishing operation.
 *
 * 2. `Publish to WordPress` (`apiNode`) sends an authenticated `POST` request to the WordPress posts endpoint for the configured site. It builds the request body from the trigger payload by mapping `title` to the CMS post title and `content` to the CMS post body, and it forces the outgoing post `status` to `publish`. Authentication is provided through the `Authorization` header using `Bearer {{env.WORDPRESS_TOKEN}}`, and the destination URL is parameterized with `{{env.WORDPRESS_SITE_ID}}`.
 *
 * 3. `API Response` (`responseNode`) returns the final structured result to the caller. It maps the WordPress response fields into the flow contract: the CMS `link` becomes `url`, the returned publication state becomes `status`, and the returned numeric identifier becomes `id`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Authentication failure from WordPress, often as `401` or `403` | `WORDPRESS_TOKEN` is missing, invalid, expired, or lacks permission to create posts | Verify `WORDPRESS_TOKEN`, ensure it is loaded in the deployment environment, and confirm the token has post creation rights for the target site |
 * | CMS endpoint not found or site-specific request failure | `WORDPRESS_SITE_ID` is missing or incorrect | Confirm the correct site identifier for the WordPress target and update `WORDPRESS_SITE_ID` in the environment |
 * | Flow returns no useful publication fields | The WordPress API call failed, returned an unexpected payload, or the response mapping did not find `link`, `status`, or `id` | Inspect the raw API execution logs, verify the CMS response shape, and confirm the post was actually created |
 * | Post is published with wrong or empty content | Caller sent malformed, empty, or incorrect `content` | Validate upstream outputs before invocation and ensure the final content string is passed into this flow exactly as intended |
 * | Post title is missing or poor quality | Caller omitted `title` or failed to derive a final publishable title upstream | Ensure the invoking system always supplies a non-empty `title`; add upstream validation if needed |
 * | Publishing should have created a draft but content went live | The flow is configured with a fixed outgoing `status` of `publish` | Modify the flow if draft behavior is required, or route review-stage content to a different flow/configuration |
 * | Upstream pipeline appears incomplete when this flow runs | Drafting or SEO flow did not run, failed, or did not produce final content before invocation | Ensure orchestration enforces upstream completion and passes the finalized `title` and `content` into this flow |
 * | Request rejected at trigger time or flow invocation fails early | Input payload is missing required fields or fields are of the wrong type | Send both `title` and `content` as strings and validate request shape before calling the flow |
 *
 * ## Notes
 * - The flow's metadata describes publishing to WordPress or another CMS, but the actual implementation is specifically wired to the WordPress REST API.
 * - The publishing behavior is intentionally simple: one trigger, one API call, one response mapping. There is no branching, retry policy, fallback CMS, or draft/publish mode switch in the current design.
 * - The response node is configured with `retries` set to `0`, and there is no explicit error-handling node, so transient API failures are surfaced directly rather than being retried within the flow.
 * - A default constitution reference is present, but this flow does not contain an LLM step or prompt-driven transformation; its runtime behavior is operational rather than generative.
 * - The README for the kit refers to publish outputs like `publish_status` and `url`, while this concrete flow returns `status`, `url`, and `id`. Orchestration code should map field names accordingly if a broader contract expects different naming.
 */

// Flow: blog-publish

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "3. CMS Publishing",
  "description": "Publishes the optimized blog post to WordPress or another CMS.",
  "tags": [
    "publish",
    "wordpress",
    "cms",
    "api"
  ],
  "testInput": {
    "title": "Test Blog Post Title",
    "content": "This is the test content for the blog post."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "inputs": [
    {
      "name": "title",
      "type": "string",
      "required": true,
      "description": "The title of the blog post"
    },
    {
      "name": "content",
      "type": "string",
      "required": true,
      "description": "The blog post content to publish"
    }
  ],
  "outputs": [
    {
      "name": "url",
      "type": "string",
      "description": "The URL of the published blog post"
    },
    {
      "name": "status",
      "type": "string",
      "description": "The publish status (publish, draft, etc.)"
    },
    {
      "name": "id",
      "type": "number",
      "description": "The ID of the published post"
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_3",
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
    "id": "apiNode_publish",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://public-api.wordpress.com/wp/v2/sites/{{env.WORDPRESS_SITE_ID}}/posts",
        "body": {
          "title": "{{triggerNode_3.output.title}}",
          "content": "{{triggerNode_3.output.content}}",
          "status": "publish"
        },
        "method": "POST",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer {{env.WORDPRESS_TOKEN}}"
        },
        "nodeName": "Publish to WordPress"
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
    "id": "responseNode_triggerNode_3",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"url\": \"{{apiNode_publish.output.link}}\",\n  \"status\": \"{{apiNode_publish.output.status}}\",\n  \"id\": \"{{apiNode_publish.output.id}}\"\n}"
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
    "id": "triggerNode_3-apiNode_publish",
    "type": "defaultEdge",
    "source": "triggerNode_3",
    "target": "apiNode_publish",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_publish-responseNode_triggerNode_3",
    "type": "defaultEdge",
    "source": "apiNode_publish",
    "target": "responseNode_triggerNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_3",
    "type": "responseEdge",
    "source": "triggerNode_3",
    "target": "responseNode_triggerNode_3",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
