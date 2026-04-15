/*
 * # Firecrawl Scrapping
 * This flow starts a Firecrawl crawl from a caller-supplied URL and serves as the entry-point crawl launcher in a larger crawl-to-index pipeline.
 *
 * ## Purpose
 * This flow is responsible for initiating a controlled crawl of a public webpage from a single starting URL. It solves the narrow but important sub-task of taking an API request, extracting the target `url`, and handing that URL to a configured crawler so page discovery can begin without the caller needing to manage crawl execution directly.
 *
 * The outcome of the flow is a synchronous API response that reports whether the crawler started successfully via a returned `status` field. That outcome matters because it gives upstream callers and operators a standard, automatable way to trigger crawl jobs and confirm that the handoff to the crawling layer succeeded. In the broader system, this creates the bridge between an external request and downstream indexing activity.
 *
 * Within the wider agent pipeline, this flow sits at the ingestion front door rather than in retrieval or synthesis. Using the parent agent context, its role is to begin the crawl phase of a crawl-then-index chain: it receives the crawl request, invokes Firecrawl with fixed crawl controls, and prepares discovered pages to be forwarded onward to a webhook-based indexing process or another ingestion destination outside this flow.
 *
 * ## When To Use
 * - Use when a system or operator needs to start crawling a website from a known public `url`.
 * - Use when you want a simple API-triggered entry point for crawl initiation inside Lamatic.
 * - Use when the goal is to discover pages for later indexing into search, RAG, or document storage systems.
 * - Use when you want crawl execution constrained to a shallow, bounded crawl rather than an open-ended site scan.
 * - Use when this flow is the first step in a larger ingestion pipeline and downstream indexing is handled elsewhere.
 *
 * ## When Not To Use
 * - Do not use when you already have the page content and only need chunking, embedding, or indexing; a downstream ingestion or indexing flow is the better fit.
 * - Do not use when the input is not a valid crawlable web `url`.
 * - Do not use when you need deep recursive crawling across many levels of a site; this flow is configured with `crawlDepth` of `1` and `crawlLimit` of `10`.
 * - Do not use when you need subpage crawling enabled beyond the configured behavior; `crawlSubPages` is set to `false` in this flow.
 * - Do not use when Firecrawl credentials have not been configured in the environment.
 * - Do not use when a sibling or custom flow is responsible for non-web sources such as files, databases, or internal repositories.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `url` | `string` | Yes | The starting webpage URL passed into the `API Request` trigger and forwarded to the crawler as the target to crawl. |
 *
 * The trigger schema is not explicitly declared in the flow source, but the crawler reads `{{triggerNode_1.output.url}}`, so the request must provide a `url` field that resolves to a valid web address. This flow assumes the URL is crawlable by Firecrawl and does not expose caller-configurable overrides for depth, limit, include paths, or exclude paths in its current version.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `status` | `boolean` or `string` | The crawler success value returned from `crawlerNode_476.output.success`, surfaced by the `API Response` node as the flow's response payload. |
 *
 * The response is a small structured object containing a single field, `status`. It does not return discovered pages, page content, crawl metadata, or downstream indexing results. It is best understood as an acknowledgement of crawl execution success rather than a full crawl report.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly through its `API Request` trigger.
 * - The only prerequisite is that the caller supplies a valid `url` field at invocation time.
 *
 * ### Downstream Flows
 * - No Lamatic downstream flow is explicitly wired inside this flow definition.
 * - By design and according to the kit context, this flow is intended to feed a separate webhook-based indexing flow or external ingestion system.
 * - That downstream consumer would typically need discovered page URLs and related crawl artifacts, but those fields are not exposed by this flow's API response; they are handled internally or externally by the crawler integration.
 *
 * ### External Services
 * - Firecrawl — performs webpage crawling and page discovery for the supplied `url` — required credential: `FIRECRAWL_API_KEY`
 * - Lamatic API Request / API Response GraphQL interface — receives invocation requests and returns synchronous responses — no separate credential shown in this flow definition
 *
 * ### Environment Variables
 * - `FIRECRAWL_API_KEY` — authenticates the Firecrawl crawler request — used by the `Crawler` node
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the incoming API call and serves as the trigger for the flow. In this flow, it is expected to supply a `url` field that becomes the crawl target. The response mode is configured as `realtime`, so the request stays within a synchronous request-response cycle.
 * 2. `Crawler` (`crawlerNode`) reads the incoming `url` from `triggerNode_1.output.url` and starts a Firecrawl crawl against that address. The crawl is tightly constrained: `crawlDepth` is `1`, `crawlLimit` is `10`, `crawlSubPages` is `false`, and both `includePath` and `excludePath` are empty, meaning no additional path filtering rules are applied in this version. The node authenticates using `FIRECRAWL_API_KEY` and produces a success indicator consumed later by the response node.
 * 3. `API Response` (`graphqlResponseNode`) maps the crawler's success value into the outbound response object as `status`. This is the only explicit response field returned to the caller, making the external contract intentionally minimal.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | The flow fails immediately when the crawler runs | `FIRECRAWL_API_KEY` is missing, invalid, or not available to the runtime | Set `FIRECRAWL_API_KEY` correctly in the deployment environment and verify the credential is valid for Firecrawl |
 * | The API request returns an error or no useful result | The incoming request did not include a valid `url` field | Ensure the trigger payload includes `url` as a well-formed absolute web URL |
 * | `status` is `false` | Firecrawl could not start or complete the crawl successfully | Verify the target site is reachable, the URL is correct, Firecrawl service access is healthy, and credentials are valid |
 * | The crawl returns no meaningful discovered pages downstream | The target page has no crawlable links within the configured limits, or the crawl configuration is too restrictive | Test the target URL manually, and if needed clone or revise the flow to increase `crawlDepth`, raise `crawlLimit`, or enable broader crawl behavior |
 * | Expected page data is not present in the API response | This flow only returns `status`, not crawl results | Consume crawl artifacts through the downstream webhook/indexing path or extend the response mapping to expose additional fields |
 * | A broader pipeline appears stalled after this flow succeeds | A downstream webhook indexing flow is expected operationally but is not actually configured or reachable | Confirm the external or sibling indexing flow exists, is deployed, and is correctly connected to receive crawl outputs |
 * | Invocation assumptions differ between client and flow | The trigger schema is effectively implicit because `advance_schema` is empty | Document the request contract for clients and, if needed, define or enforce an explicit trigger schema to reduce integration errors |
 *
 * ## Notes
 * - Despite the template description mentioning that crawled pages are sent to a webhook flow for indexing, that forwarding behavior is not explicitly visible in this flow source. It may be encapsulated inside the crawler integration or handled outside the exported flow graph.
 * - The flow is intentionally minimal and returns only a success flag. Teams that need observability, crawl IDs, discovered URL counts, or crawl artifacts should extend the response mapping.
 * - Crawl behavior is fixed in the current implementation: shallow depth, low page limit, no include or exclude path filters, and no subpage crawling. That makes it safer as a starter template but potentially too limited for production-scale discovery.
 * - The trigger input schema is not formally declared in the exported `inputs` object. Client developers should treat `url` as the required contract because it is directly referenced by the crawler node.
 */

// Flow: firecrawl-scrapping

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Firecrawl Scrapping",
  "description": "This flow allows the user to start the crawling process of a webpage and send its pages to a webhook flow to commence indexing the document.",
  "tags": [
    "🚀 Startup",
    "📱 Apps"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/firecrawl-scrapping",
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
    "id": "crawlerNode_476",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "crawlerNode",
      "values": {
        "nodeName": "Crawler",
        "url": "{{triggerNode_1.output.url}}",
        "crawlDepth": 1,
        "crawlLimit": 10,
        "credentials": "FIRECRAWL_API_KEY",
        "excludePath": [],
        "includePath": [],
        "crawlSubPages": false
      }
    }
  },
  {
    "id": "graphqlResponseNode_412",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"status\": \"{{crawlerNode_476.output.success}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-crawlerNode_476",
    "source": "triggerNode_1",
    "target": "crawlerNode_476",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "crawlerNode_476-graphqlResponseNode_412",
    "source": "crawlerNode_476",
    "target": "graphqlResponseNode_412",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_412",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_412",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
