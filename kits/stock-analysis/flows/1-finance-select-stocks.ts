/*
 * # 1. Finance - Select Stocks
 * A lightweight entry-point flow that turns a user-provided company search query into stock suggestions for the wider finance analysis pipeline.
 *
 * ## Purpose
 * This flow is responsible for the first narrowing step in the finance kit: taking a simple search-oriented user input and resolving it into candidate public securities. Instead of asking downstream flows to interpret free-form company names or themes directly, it performs a targeted external lookup and converts the raw vendor response into a cleaner suggestion payload that can be used by a UI or a later orchestration step.
 *
 * The outcome is a list of stock suggestions returned as the `suggestions` response field. That matters because the rest of the finance system works best once a caller has identified one or more concrete securities or tickers to analyze. By separating stock selection from deeper profile, fundamentals, price-history, and sentiment retrieval, the kit keeps each flow focused and easier to chain.
 *
 * In the broader plan-retrieve-synthesize pattern described by the parent agent, this flow sits at the very front of the pipeline. It is an entry-point retrieval flow, typically called before `2. Finance - Company Profiles` and before any of the `3A`, `3B`, `3C`, or `3D. Finance - Analysis` flows that require concrete company identifiers. It does not synthesize analysis itself; it helps establish the candidate symbols that later flows can enrich and evaluate.
 *
 * ## When To Use
 * - Use when a user supplies a company name, partial company name, or search phrase and you need candidate public stocks to choose from.
 * - Use when a UI needs autocomplete-style or suggestion-style stock matches before requesting deeper company data.
 * - Use when the caller has intent to analyze companies but does not yet have a validated ticker symbol.
 * - Use when an orchestration layer needs an initial stock lookup step before invoking profile or analysis flows.
 * - Use when the request is best satisfied by external market/security name matching rather than internal stored metadata.
 *
 * ## When Not To Use
 * - Do not use when the caller already has one or more confirmed ticker symbols; route directly to downstream enrichment flows such as `2. Finance - Company Profiles` or the analysis chain.
 * - Do not use when the task is to retrieve company fundamentals, historical prices, or sentiment; sibling flows in the kit handle those deeper datasets.
 * - Do not use when the request is not a stock/security lookup problem, such as narrative investment analysis or portfolio reasoning with already known inputs.
 * - Do not use when the trigger payload does not include a usable `searchQuery`; this flow has no alternate input path.
 * - Do not use if a prior step has already resolved the user intent into canonical securities and only downstream enrichment remains.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `searchQuery` | `string` | Yes | User-supplied search text used to look up matching stocks via the external market data API. |
 *
 * Although the exported `inputs` object is empty, the trigger node clearly expects a runtime field exposed as `triggerNode_1.output.searchQuery`, so `searchQuery` is an operational requirement. The value should be plain text suitable for a company-name lookup. Best results are likely when the query is a company name, brand, or short identifying phrase rather than a long natural-language paragraph. No explicit length or schema validation is configured in the flow itself.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `suggestions` | `unknown[]` | Collated stock suggestion results produced by the `Collate Suggestions` code step from the upstream API response. |
 *
 * The response is a JSON object containing a single top-level field, `suggestions`. That field is populated directly from the output of the `Collate Suggestions` script, so its exact internal shape is defined by that script rather than by the flow declaration. In practical terms, callers should treat it as a structured list of candidate securities derived from the external search response. If the upstream API returns no matches, `suggestions` may be empty.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly through a `graphqlNode` API trigger.
 * - The only prerequisite is that the caller provides a valid `searchQuery` in the trigger payload.
 *
 * ### Downstream Flows
 * - `2. Finance - Company Profiles` may be invoked after this flow once the caller or orchestrator selects one or more specific stocks from `suggestions`.
 * - The broader finance analysis chain, including `3D. Finance - Analysis`, depends indirectly on this flow when ticker selection has not yet been resolved upstream.
 * - Downstream consumers primarily need the chosen company or ticker candidates derived from `suggestions`, not the raw external API response.
 *
 * ### External Services
 * - Financial Modeling Prep search API — used to find matching securities by company name query — credential used via `FMP_API_KEY`
 * - Lamatic GraphQL trigger interface — used to receive the inbound API request and return the response — no explicit credential declared inside this flow
 * - Local code script `@scripts/1-finance-select-stocks_collate-suggestions.ts` — used to transform vendor results into final suggestions — no external credential required
 *
 * ### Environment Variables
 * - `FMP_API_KEY` — API key for the Financial Modeling Prep search request — used by the `Variables` node and injected into `Fetch Stock`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the inbound API call and exposes the trigger payload to the flow. In this flow, the key runtime value is `searchQuery`, which becomes the lookup term for stock discovery.
 *
 * 2. `Variables` (`variablesNode`) defines runtime variables used downstream. Here it provides `FMP_API_KEY`, which is then interpolated into the external request URL for the stock search call.
 *
 * 3. `Fetch Stock` (`apiNode`) sends a `GET` request to Financial Modeling Prep's stable search endpoint. It builds the request URL from the incoming `searchQuery` and the `FMP_API_KEY`, asking the external service for securities whose names match the caller's query.
 *
 * 4. `Collate Suggestions` (`codeNode`) runs the referenced script `@scripts/1-finance-select-stocks_collate-suggestions.ts` against the API result. Its role is to normalize, reduce, or clean the raw vendor payload into the final suggestion structure expected by callers.
 *
 * 5. `API Response` (`graphqlResponseNode`) returns a JSON response with one mapped field: `suggestions`. That field is set directly to the full output of `Collate Suggestions`, making the script's transformed result the public contract of the flow.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before suggestions are returned | `FMP_API_KEY` is missing, invalid, expired, or blocked by the data provider | Provide a valid Financial Modeling Prep API key and ensure the `Variables` node is populated correctly for the deployed environment |
 * | Response contains empty `suggestions` | `searchQuery` is too vague, misspelled, too long, or does not correspond to a listed public company | Retry with a shorter and more specific company name, brand, or known ticker-like query |
 * | External API returns an error or non-200 response | Financial Modeling Prep service issue, rate limiting, network failure, or malformed request URL | Check provider availability, verify key quotas, and confirm the incoming `searchQuery` can be safely interpolated into a URL |
 * | Flow returns unexpected suggestion structure | The `Collate Suggestions` script transforms results in a way the caller did not anticipate | Inspect and document the script output contract, then align consuming UI or orchestration logic to that structure |
 * | Trigger succeeds but no useful lookup happens | The caller omitted `searchQuery` or passed it under the wrong field name | Ensure the GraphQL request includes `searchQuery` exactly as expected by the trigger mapping |
 * | Downstream profile or analysis flow cannot proceed | This flow returned candidates, but no ticker or company was selected for the next step | Add a selection step in the caller or orchestrator to choose one or more entries from `suggestions` before invoking downstream flows |
 * | Request works locally but fails after deployment | Hard-coded credential handling differs across environments or the key is not approved for production usage | Move the API key to secure environment management where appropriate and verify deployment-time configuration |
 *
 * ## Notes
 * - The flow metadata does not include a description, explicit schema, or test input, so the real contract is inferred from node configuration rather than declared inputs.
 * - The API key appears directly in the flow source via the `Variables` node. **This is a security risk** in source-controlled or shared environments and should be replaced with secure secret management.
 * - No retry policy is configured on the external API node or response node; transient provider failures will surface immediately rather than being retried.
 * - The exact fields inside `suggestions` are determined by `@scripts/1-finance-select-stocks_collate-suggestions.ts`. Any integration that depends on field-level stability should treat that script as part of the flow contract.
 * - This flow is intentionally narrow: it performs discovery only. It does not validate investment suitability, fetch detailed company information, or produce analysis.
 */

// Flow: 1-finance-select-stocks

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Finance - Select Stocks",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
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
  "scripts": {
    "1_finance_select_stocks_collate_suggestions": "@scripts/1-finance-select-stocks_collate-suggestions.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
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
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "variablesNode_716",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "variablesNode",
      "values": {
        "mapping": "{\n  \"FMP_API_KEY\": {\n    \"type\": \"string\",\n    \"value\": \"YGC31QqHgXSaUQeYlauxQUPKmrwy1qY3\"\n  }\n}",
        "nodeName": "Variables"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 150
    },
    "selected": true
  },
  {
    "id": "apiNode_431",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/search-name?query={{triggerNode_1.output.searchQuery}}&apikey={{variablesNode_716.output.FMP_API_KEY}}",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Stock",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "codeNode_572",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/1-finance-select-stocks_collate-suggestions.ts",
        "nodeName": "Collate Suggestions"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"suggestions\": \"{{codeNode_572.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 600
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-variablesNode_716",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "variablesNode_716",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_716-apiNode_431",
    "type": "defaultEdge",
    "source": "variablesNode_716",
    "target": "apiNode_431",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_431-codeNode_572",
    "type": "defaultEdge",
    "source": "apiNode_431",
    "target": "codeNode_572",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_572-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_572",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
