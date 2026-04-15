/*
 * # Currency Converter
 * A real-time currency conversion entry flow that accepts an API request, uses exchange-rate retrieval plus LLM formatting, and returns a concise end-user answer for the wider agent system.
 *
 * ## Purpose
 * This flow is responsible for handling a focused but common operational task: converting a supplied amount from one currency into another using current exchange-rate data and turning that result into a user-ready response. It exists so calling systems do not need to separately orchestrate rate lookup, numeric conversion handling, and response phrasing.
 *
 * The outcome of the flow is a single API response field, `answer`, containing the generated conversion result. That matters because the broader agent system is designed for direct invocation by applications, widgets, chat experiences, or backend services that want a conversion they can display immediately without extra formatting logic.
 *
 * Within the broader pipeline, this flow is the full execution path rather than a mid-pipeline helper. The parent agent describes it as a single-flow system: the request enters through an API trigger, the flow retrieves or uses exchange-rate data through its configured tool layer, the LLM synthesizes that data into a concise textual result, and the response node returns it. In plan-retrieve-synthesize terms, this flow combines retrieval and synthesis inside one invocation and serves as the system’s entry point.
 *
 * ## When To Use
 * - Use when a caller needs to convert a specific monetary amount from one currency to another and wants a human-readable answer.
 * - Use when the result should be based on current or near-real-time exchange-rate information rather than static rates.
 * - Use when the invoking system expects a synchronous API-style response with a single formatted output field.
 * - Use when a UI widget, chatbot, ecommerce workflow, travel tool, or financial dashboard needs a quick conversion result suitable for direct display.
 * - Use when no additional downstream processing is required beyond returning a concise text answer.
 *
 * ## When Not To Use
 * - Do not use when historical exchange rates are required; this flow is described for real-time conversion, not time-series or date-specific lookup.
 * - Do not use when the caller needs a fully structured financial payload such as raw rate tables, timestamps, provider metadata, or multi-currency batch results.
 * - Do not use when the input does not include a valid amount and currency pair conceptually represented as `amount`, `from`, and `to`.
 * - Do not use when strict deterministic numeric formatting must be guaranteed entirely without LLM involvement.
 * - Do not use when credentials or configuration for the underlying exchange-rate retrieval tool or model are unavailable.
 * - Do not use another upstream flow first; this flow is itself the entry-point flow in this kit.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `amount` | `number` or numeric `string` | Yes | The quantity of money to convert. The trigger payload is expected to provide this value conceptually even though no explicit `inputs` schema is declared in the exported flow definition. |
 * | `from` | `string` | Yes | The source currency code, typically an ISO 4217 code such as `INR` or `USD`. |
 * | `to` | `string` | Yes | The target currency code, typically an ISO 4217 code such as `USD` or `EUR`. |
 *
 * The flow file declares no formal `inputs` object, so validation is implicit rather than schema-enforced in the exported source. Based on the parent agent description, callers should provide `amount`, `from`, and `to` at trigger time. Currency values should be valid currency codes, and `amount` should be parseable as a positive numeric value. There is an important prompt-level caveat: the parent agent notes that the included prompt references `{{triggerNode_1.output.amount}}` and hard-codes `INR` to `USD` wording. If arbitrary currency pairs are intended, the prompt and associated retrieval logic should be updated to interpolate `from` and `to` explicitly.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `string` | The final generated currency conversion response returned by the `API Response` node, mapped from `{{LLMNode_424.output.generatedResponse}}`. |
 *
 * The response format is a single structured API object containing one prose field, `answer`. That field is intended to be concise and directly displayable to an end user. Completeness depends on successful tool execution inside the LLM step and on the prompt/model configuration; the flow does not expose raw exchange-rate data or intermediate structured values in its outward response.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow for the kit and is invoked directly via an API request trigger.
 * - The only prerequisite is that the caller supplies the conversion request data the flow expects, conceptually `amount`, `from`, and `to`.
 *
 * ### Downstream Flows
 * - None are defined in the provided kit context.
 * - This flow returns its final `answer` directly to the caller rather than feeding a subsequent flow.
 *
 * ### External Services
 * - Configured LLM model via `@model-configs/currency-converter_generate-text.ts` — used to generate the final human-readable conversion response — required model/provider credentials depend on that model configuration.
 * - Tool bundle defined in `@tools/currency-converter_generate-text_tools.ts` — used by `Generate Text` to obtain exchange-rate or conversion data needed for the answer — required credentials depend on the underlying API or connector implemented in that tool file.
 * - Prompt resource `@prompts/currency-converter_generate-text_system.md` — used to instruct the model on response behavior — no credential required.
 * - Constitution `@constitutions/default.md` — used as inherited behavioral guidance for the flow environment — no credential required.
 *
 * ### Environment Variables
 * - Model-provider environment variables referenced indirectly by `@model-configs/currency-converter_generate-text.ts` — authenticate the LLM used by `Generate Text` — used by node `Generate Text`.
 * - Exchange-rate API credentials or connector-specific environment variables referenced indirectly by `@tools/currency-converter_generate-text_tools.ts` — authenticate the real-time currency or exchange-rate lookup — used by node `Generate Text`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`)
 *    - This is the trigger node and entry point for the flow. It receives the incoming API payload from the caller and makes that request data available to downstream nodes. In this flow’s intended contract, the payload carries the conversion request, especially `amount` and conceptually the source and target currencies.
 *
 * 2. `Generate Text` (`LLMNode`)
 *    - This node performs the core work of the flow. It runs with the configured system prompt, model configuration, and attached tool bundle. Using the incoming trigger data, it invokes its available tool(s) to obtain the exchange-rate information needed for conversion, then generates the final text response. The flow’s design places both retrieval and synthesis here: tool usage supplies the numeric basis, while the model turns that into a concise answer.
 *
 * 3. `API Response` (`graphqlResponseNode`)
 *    - This node shapes the outward API response. It maps the LLM output field `generatedResponse` into a single response property, `answer`, and returns that object to the original caller over the response edge linked back to the trigger.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request returns an authentication or provider error | Missing or invalid credentials for the configured model provider or exchange-rate lookup tool | Verify the environment variables required by `@model-configs/currency-converter_generate-text.ts` and `@tools/currency-converter_generate-text_tools.ts`, then redeploy or retest. |
 * | `answer` is empty, vague, or unrelated to the requested currencies | The tool did not return usable rate data, the prompt is misaligned, or the trigger payload did not include the expected fields | Confirm that the incoming payload includes `amount`, `from`, and `to`, verify the tool configuration, and inspect the system prompt for correct variable usage. |
 * | Conversion only appears to work for `INR` to `USD` | The prompt is hard-coded for that pair rather than using dynamic `from` and `to` values | Update the system prompt and any associated tool/query logic to interpolate source and target currencies from trigger variables. |
 * | Caller gets malformed or nonsensical conversion text | `amount` is not numeric, currency codes are invalid, or the tool returned unexpected data | Add input validation before invocation or at the API boundary, and ensure currencies use valid ISO 4217-style codes. |
 * | Flow cannot be chained from an upstream process as expected | An external orchestrator assumed a prior flow should populate this flow’s inputs | Treat this flow as the kit’s entry point and pass the required request fields directly when invoking it. |
 * | Response lacks raw rate details needed by downstream systems | This flow only exposes `answer` and does not map intermediate tool results to the API response | Extend the response mapping or add a sibling flow if structured rate data is required. |
 *
 * ## Notes
 * - The exported `inputs` object is empty, so the trigger contract is documented by behavior and parent-agent context rather than enforced schema.
 * - The `API Response` node exposes only `answer`. If consumers need structured fields such as `convertedAmount`, `rate`, `baseCurrency`, or `quoteCurrency`, the output mapping must be expanded.
 * - The prompt, tool bundle, and model configuration are externalized into referenced files. Operational behavior may change materially if those referenced resources are edited, even when the flow graph itself remains unchanged.
 * - The README states that private inputs may require configuration, but no private input fields are declared in the provided flow source. Treat referenced model and tool configuration as the likely source of runtime prerequisites.
 * - Because the final response is generated by an LLM, formatting may vary slightly unless the prompt tightly constrains wording and decimal presentation.
 */

// Flow: currency-converter

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Currency Converter",
  "description": "This flow builds a currency converter that fetches real-time exchange rates, enabling users to accurately convert between any currencies.",
  "tags": [
    "🛠️ Tools"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/currency-converter",
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
    "currency_converter_generate_text_system": "@prompts/currency-converter_generate-text_system.md"
  },
  "modelConfigs": {
    "currency_converter_generate_text": "@model-configs/currency-converter_generate-text.ts"
  },
  "tools": {
    "currency_converter_generate_text_tools": "@tools/currency-converter_generate-text_tools.ts"
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
    "id": "LLMNode_424",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": "@tools/currency-converter_generate-text_tools.ts",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/currency-converter_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/currency-converter_generate-text.ts",
        "messages": "@model-configs/currency-converter_generate-text.ts",
        "generativeModelName": "@model-configs/currency-converter_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_737",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_424.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_424",
    "source": "triggerNode_1",
    "target": "LLMNode_424",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_424-graphqlResponseNode_737",
    "source": "LLMNode_424",
    "target": "graphqlResponseNode_737",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_737",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_737",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
