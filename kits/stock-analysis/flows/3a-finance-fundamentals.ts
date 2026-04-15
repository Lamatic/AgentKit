/*
 * # 3A. Finance - Fundamentals
 * A flow that retrieves core annual financial fundamentals for a list of public company tickers and returns them in a collated structure for downstream analysis in the wider finance agent pipeline.
 *
 * ## Purpose
 * This flow is responsible for collecting foundational financial statement data and key metrics for one or more companies. Given a list of ticker symbols, it fans out across four Financial Modeling Prep endpoints for each company: income statement, balance sheet, cash flow statement, and key metrics. It then combines those per-company results into a single fundamentals payload. This solves the data-retrieval portion of equity analysis that requires structured, current financial fundamentals rather than qualitative narrative.
 *
 * The outcome is a machine-consumable bundle of company fundamentals suitable for rendering in a UI or passing into later reasoning and synthesis steps. That matters because downstream analysis flows need normalized statement-level data in one place rather than requiring every consumer to call multiple vendor endpoints and reconcile the responses itself.
 *
 * Within the broader kit, this flow sits in the retrieval layer of the pipeline. Upstream, stock-selection and company-profile flows identify which companies should be analyzed. Parallel sibling retrieval flows gather other evidence types such as historical prices and sentiment. Downstream, the orchestration and synthesis flow uses this fundamentals output as one of the structured inputs to produce a unified analysis.
 *
 * ## When To Use
 * - Use when the caller already knows which public companies should be analyzed and needs annual fundamentals for those tickers.
 * - Use when downstream analysis requires structured financial statements and metrics rather than just company profile metadata.
 * - Use when a UI or backend wants a single API call that gathers balance sheet, income statement, cash flow, and key metrics together.
 * - Use when the broader finance pipeline is preparing inputs for `3D. Finance - Analysis`.
 * - Use when the request payload includes a `companies` collection at the trigger and each item is a Financial Modeling Prep-compatible symbol.
 *
 * ## When Not To Use
 * - Do not use when the user first needs help choosing candidate stocks; route to `1. Finance - Select Stocks` instead.
 * - Do not use when only company identity or descriptive profile data is required; use `2. Finance - Company Profiles` instead.
 * - Do not use when the required data is price history or market sentiment; those are handled by sibling `3B` and `3C` retrieval flows.
 * - Do not use when no ticker list is available yet; this flow has no internal discovery step and expects upstream selection to have already happened.
 * - Do not use when the input is a natural-language company description without resolved symbols.
 * - Do not use when quarterly fundamentals are required; this flow is hard-coded to annual data with `limit=1`.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `companies` | `string[]` | Yes | The list of company ticker symbols to process. Each item is iterated over and used as the `symbol` query parameter for all four external finance API calls. |
 *
 * The trigger schema is not explicitly declared in the flow, but the loop configuration assumes `triggerNode_1.output.companies` exists and is iterable as a list. Symbols should be valid public-market tickers accepted by Financial Modeling Prep. The flow is configured to process up to 10 iterations via the loop node settings, so callers should assume the intended input size is a small batch rather than an arbitrarily large universe.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `fundamental_data` | `object` | The final collated fundamentals payload produced by `Collate Results`, containing the aggregated per-company data assembled from the four statement/metrics endpoints. |
 *
 * The response is a structured JSON object under `fundamental_data`, not a prose summary. Its exact internal shape is determined by the two referenced collation scripts, but at a minimum it represents the merged results gathered across all requested companies and all four fundamentals sources. Completeness depends on the external API returning data for each ticker; if a vendor endpoint has missing coverage for a symbol, the collated output may contain partial company records.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This flow does not require another flow to execute first in strict technical terms; it is an API-triggered entry-point flow.
 * - In the broader kit, it is typically called after an upstream selection or profile step has already identified the target companies.
 * - Most commonly, `1. Finance - Select Stocks` or another caller must have produced a list of ticker symbols that can be passed into this flow as `companies`.
 * - If chained from a profile-oriented step, the prerequisite data is still a resolved list of ticker symbols; this flow consumes symbols only, not rich profile objects.
 *
 * ### Downstream Flows
 * - `3D. Finance - Analysis` consumes this flow's output as part of its broader multi-source analysis assembly.
 * - The specific field exposed for downstream use is `fundamental_data`.
 * - UI layers or backend services may also consume `fundamental_data` directly to render tables, cards, or comparison views without invoking the full analysis flow.
 *
 * ### External Services
 * - Financial Modeling Prep API — retrieves annual income statement, balance sheet, cash flow statement, and key metrics data for each ticker — credential used via `FMP_API_KEY`
 *
 * ### Environment Variables
 * - `FMP_API_KEY` — API credential for Financial Modeling Prep requests — used by the `Variables` node and referenced by `Fetch Income Statement`, `Fetch Balance Sheet`, `Fetch CashFlow Statement`, and `Fetch Key Metrics`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode` trigger) receives the incoming API call. This flow expects the request payload to provide a `companies` field that can be iterated as a list of ticker symbols.
 * 2. `Variables` (`variablesNode`) sets runtime variables for the flow, most importantly `FMP_API_KEY`. In this exported flow source, the key is populated directly in the variable mapping, and downstream API nodes interpolate it into request URLs.
 * 3. `Fetch Fundamentals` (`forLoopNode`) begins iterating over `{{triggerNode_1.output.companies}}`. For each loop pass, the current ticker is exposed as `forLoopNode_939.output.currentValue`.
 * 4. `Branching` (`branchNode`) fans the current ticker into four parallel retrieval paths so the flow can fetch all required fundamentals categories for the same company.
 * 5. `Fetch Income Statement` (`apiNode`) calls the Financial Modeling Prep `income-statement` endpoint for the current symbol with `period=annual` and `limit=1`, returning the latest annual income statement record available.
 * 6. `Fetch Balance Sheet` (`apiNode`) calls the Financial Modeling Prep `balance-sheet-statement` endpoint for the current symbol with the same annual, single-record configuration.
 * 7. `Fetch CashFlow Statement` (`apiNode`) calls the Financial Modeling Prep `cash-flow-statement` endpoint for the current symbol, again requesting the latest annual record only.
 * 8. `Fetch Key Metrics` (`apiNode`) calls the Financial Modeling Prep `key-metrics` endpoint for the current symbol and retrieves the latest annual metrics snapshot.
 * 9. `Collate Fundamentals` (`codeNode`) waits for the four API branches for the current company and combines them into a per-company fundamentals structure. This step is implemented by the referenced script `@scripts/3a-finance-fundamentals_collate-fundamentals.ts`.
 * 10. `Fetch Fundamentals End` (`forLoopEndNode`) marks completion of one company iteration, accumulates the per-company result, and advances the loop until all input symbols have been processed.
 * 11. `Collate Results` (`codeNode`) runs after the loop has completed and consolidates the collected per-company outputs into the final response object. This step is implemented by `@scripts/3a-finance-fundamentals_collate-results.ts`.
 * 12. `API Response` (`graphqlResponseNode`) returns the final payload to the caller, mapping `{{codeNode_387.output}}` into the response field `fundamental_data`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Response is empty or the flow fails before looping | The trigger payload did not include `companies`, or `companies` was not a list | Pass a `companies` array at invocation time, and ensure it contains iterable ticker strings |
 * | Some companies are missing from `fundamental_data` | One or more ticker symbols were invalid or unsupported by Financial Modeling Prep | Validate symbols upstream and normalize them to vendor-compatible tickers before calling this flow |
 * | All finance API calls fail with authorization or access errors | `FMP_API_KEY` is missing, invalid, expired, or lacks access | Provide a valid Financial Modeling Prep API key and verify the `Variables` node value or deployment secret configuration |
 * | Output contains partial fundamentals for a company | One or more of the four vendor endpoints returned no data for that symbol | Treat records as partially complete, add upstream ticker validation, and inspect endpoint-level coverage for the affected company |
 * | The flow returns only the latest annual snapshot and not historical periods | The API URLs are hard-coded with `period=annual&limit=1` | Modify the flow if multi-period or quarterly fundamentals are required; this is expected behavior as configured |
 * | A larger batch silently stops at a subset of companies | The loop node is configured with an `endValue` of `10`, indicating an intended maximum iteration count | Keep requests to small batches or review loop configuration before using this flow for larger universes |
 * | Downstream analysis cannot use the output | An upstream orchestrator expected a different field name or shape than `fundamental_data` | Ensure the consumer maps this flow's API response field correctly and aligns with the collation script output shape |
 * | Invocation from a broader pipeline fails semantically | The upstream flow that should have resolved company symbols did not run or did not produce usable tickers | Run the stock-selection/profile stage first and pass resolved symbols, not free-text company descriptions |
 *
 * ## Notes
 * - The flow fetches four independent datasets per ticker in parallel within each loop iteration, which is efficient for small symbol batches but may increase external API pressure as the batch size grows.
 * - The trigger input schema is not formally declared in `inputs`, so callers must rely on the implicit contract that `companies` is present.
 * - The API credential appears embedded in the exported flow source rather than sourced from a deployment secret. **This should be treated as a security risk and moved to proper environment-managed secret handling in production.**
 * - The exact output schema beneath `fundamental_data` is defined by the referenced collation scripts, so any consumer that depends on field-level structure should validate against the actual script output, not just the response mapping.
 * - No retry behavior is configured on the external API nodes, so transient vendor failures will surface directly unless retry logic is added upstream or in the flow.
 */

// Flow: 3a-finance-fundamentals

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "3A. Finance - Fundamentals",
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
    "3a_finance_fundamentals_collate_fundamentals": "@scripts/3a-finance-fundamentals_collate-fundamentals.ts",
    "3a_finance_fundamentals_collate_results": "@scripts/3a-finance-fundamentals_collate-results.ts"
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
      "x": 675,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "variablesNode_683",
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
      "x": 675,
      "y": 150
    },
    "selected": true
  },
  {
    "id": "forLoopNode_939",
    "data": {
      "label": "forLoopNode node",
      "modes": {},
      "nodeId": "forLoopNode",
      "values": {
        "wait": 0,
        "endValue": "10",
        "nodeName": "Fetch Fundamentals",
        "increment": "1",
        "connectedTo": "forLoopEndNode_544",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{triggerNode_1.output.companies}}"
      }
    },
    "type": "forLoopNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "branchNode_285",
    "data": {
      "label": "Branch",
      "modes": {},
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Branch 1",
            "value": "branchNode_285-addNode_810"
          },
          {
            "label": "Branch 2",
            "value": "branchNode_285-addNode_771"
          },
          {
            "label": "Branch 3",
            "value": "branchNode_285-plus-node-addNode_891561-421"
          },
          {
            "label": "Branch 4",
            "value": "branchNode_285-plus-node-addNode_144954-658"
          }
        ],
        "nodeName": "Branching"
      }
    },
    "type": "branchNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "apiNode_845",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/balance-sheet-statement?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Balance Sheet",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "apiNode_805",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/income-statement?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Income Statement",
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
      "y": 600
    },
    "selected": false
  },
  {
    "id": "apiNode_467",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/key-metrics?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Key Metrics",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "apiNode_349",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/cash-flow-statement?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch CashFlow Statement",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 900,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_211",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/3a-finance-fundamentals_collate-fundamentals.ts",
        "nodeName": "Collate Fundamentals"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "forLoopEndNode_544",
    "data": {
      "label": "forLoopEndNode node",
      "modes": {},
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Fetch Fundamentals End",
        "connectedTo": "forLoopNode_939"
      }
    },
    "type": "forLoopEndNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "codeNode_387",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/3a-finance-fundamentals_collate-results.ts",
        "nodeName": "Collate Results"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 1050
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
        "outputMapping": "{\n  \"fundamental_data\": \"{{codeNode_387.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "forLoopNode_939-branchNode_285-169",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "forLoopNode_939",
    "target": "branchNode_285",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_805-563",
    "data": {
      "branchName": "Branch 1"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_805",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_845-401",
    "data": {
      "branchName": "Branch 2"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_845",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_349-414",
    "data": {
      "branchName": "Branch 3"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_349",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_467-605",
    "data": {
      "branchName": "Branch 4"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_467",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-variablesNode_683",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "variablesNode_683",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_683-forLoopNode_939",
    "type": "defaultEdge",
    "source": "variablesNode_683",
    "target": "forLoopNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_211-forLoopEndNode_544-370",
    "data": {},
    "type": "defaultEdge",
    "source": "codeNode_211",
    "target": "forLoopEndNode_544",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_544-codeNode_387",
    "type": "defaultEdge",
    "source": "forLoopEndNode_544",
    "target": "codeNode_387",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_387-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_387",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_805-codeNode_211-859",
    "type": "defaultEdge",
    "source": "apiNode_805",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_845-codeNode_211-847",
    "type": "defaultEdge",
    "source": "apiNode_845",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_349-codeNode_211-252",
    "type": "defaultEdge",
    "source": "apiNode_349",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_467-codeNode_211-740",
    "type": "defaultEdge",
    "source": "apiNode_467",
    "target": "codeNode_211",
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
  },
  {
    "id": "forLoopNode_939-forLoopEndNode_544-306",
    "data": {
      "condition": "Loop"
    },
    "type": "loopEdge",
    "source": "forLoopNode_939",
    "target": "forLoopEndNode_544",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_544-forLoopNode_939-229",
    "data": {
      "condition": "Loop",
      "invisible": true
    },
    "type": "loopEdge",
    "source": "forLoopEndNode_544",
    "target": "forLoopNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
