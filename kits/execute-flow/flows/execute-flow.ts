/*
 * # Execute Flow
 * This flow exposes an API-triggered wrapper that executes another Lamatic flow, passes the required input variables into it, and returns the downstream result as a stable orchestration interface within the wider agent system.
 *
 * ## Purpose
 * This flow is responsible for one narrowly defined orchestration task: receiving an inbound API request, extracting the caller-provided input needed by a target Lamatic flow, invoking that downstream flow, and returning the result to the caller. It solves the common integration problem of flow-to-flow delegation, where the calling system should not need to know the internal mechanics of the downstream workflow.
 *
 * The outcome of this flow is a single API response field, `flowOutput`, containing the result produced by the executed downstream flow. That matters because it creates a clean execution boundary: upstream callers interact with one simple endpoint, while the real business logic can live in a separate specialized flow. This keeps the interface stable even as the downstream implementation evolves.
 *
 * In the broader agent architecture, this flow sits at the entry and orchestration layer rather than at the retrieval or synthesis layer itself. Per the parent agent context, it acts as a thin router/orchestrator in a modular multi-flow pattern: an external caller invokes this flow over the GraphQL trigger, this flow delegates to another Lamatic flow, and the delegated flow performs the substantive work. Use it when you want explicit composition between flows without requiring external orchestration code.
 *
 * ## When To Use
 * - Use when you want to invoke another Lamatic flow through a stable API endpoint rather than calling that downstream flow directly.
 * - Use when the downstream flow requires a `topic` input and the caller can provide that value in the inbound request.
 * - Use when you are building a modular agent system where one flow should act as an orchestrator and another flow should own the actual business logic.
 * - Use when you need a minimal reference implementation for flow-to-flow execution, variable mapping, and response forwarding.
 * - Use when external systems expect a single API response but the work should be delegated internally to a separate flow.
 *
 * ## When Not To Use
 * - Do not use when the required inbound field `topic` is missing, empty, or not shaped as the downstream flow expects.
 * - Do not use when you need this flow itself to perform reasoning, retrieval, enrichment, or transformation logic; that work belongs in the downstream flow it executes.
 * - Do not use when the target downstream flow ID is invalid, unavailable, unpublished, or not accessible in the current Lamatic workspace.
 * - Do not use when a sibling or specialized flow already exposes the desired business capability directly and no extra orchestration layer is needed.
 * - Do not use when you need to dynamically select between multiple downstream flows at runtime; this template is configured for one fixed `flowId`.
 * - Do not use for non-API-triggered execution patterns unless you first adapt the trigger and response interface.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `topic` | `string` | Yes | The value extracted from the inbound API request and passed to the downstream flow as its `topic` input. |
 *
 * This flow has no separately declared private inputs in `inputs`, but it does assume the API caller sends a request payload containing `topic`. The flow performs direct variable mapping rather than validation or normalization, so `topic` should already be in the exact format expected by the downstream flow. No maximum length, language restriction, or schema enforcement is defined in this flow’s configuration.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `flowOutput` | `unknown` | The value returned by the downstream executed flow and forwarded unchanged in the API response. |
 *
 * The response is a structured API payload with one mapped field, `flowOutput`. The exact shape of `flowOutput` depends entirely on the downstream flow identified by the configured `flowId`, so callers should treat it as downstream-defined rather than guaranteed by this wrapper. This flow does not reshape, validate, or enrich the downstream result before returning it.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow. It does not require any other Lamatic flow to run before it.
 *
 * Its only upstream dependency is the external API caller, which must provide the `topic` request value consumed from `triggerNode_1.output.topic` and forwarded into the downstream execution request.
 *
 * ### Downstream Flows
 * - A single downstream Lamatic flow is invoked by the `Execute Flow` node via the configured `flowId` `3f94aedc-9887-4977-a8d4-9676aaf8bbf7`.
 * - That downstream flow consumes the input field `topic`.
 * - This wrapper flow then consumes the downstream flow’s returned field `flowOutput` and exposes it in its own API response.
 *
 * No additional downstream flows are referenced in this flow definition. External systems or other orchestrators may call this flow, but no further internal chaining is encoded here.
 *
 * ### External Services
 * - Lamatic GraphQL trigger/response interface — receives the inbound API request and returns the API response — required credential or environment variable: none explicitly declared in this flow
 * - Lamatic flow execution service — executes the downstream flow identified by `flowId` — required credential or environment variable: none explicitly declared in this flow
 *
 * ### Environment Variables
 * - None explicitly declared in this flow — no node in this flow references a named environment variable
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the inbound API call that starts the flow. In this template, it acts as the public entrypoint and exposes request data to the rest of the graph. The flow specifically relies on this node to make the inbound `topic` value available as `triggerNode_1.output.topic`.
 *
 * 2. `Execute Flow` (`flowNode`) calls another Lamatic flow using the fixed `flowId` `3f94aedc-9887-4977-a8d4-9676aaf8bbf7`. It constructs the downstream request body by mapping the inbound `topic` from the trigger node into the downstream input payload. This node is the core of the template: it waits for the downstream flow to execute and captures the downstream result, including the field exposed here as `flowOutput`.
 *
 * 3. `API Response` (`graphqlResponseNode`) returns the final response to the caller. It maps `flowNode_390.output.flowOutput` into the outward-facing response field `flowOutput`, so the caller receives the downstream flow’s result through this wrapper endpoint without seeing the internal execution details.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | API call fails or returns an error before execution starts | The inbound request is malformed or does not include `topic` in the expected place | Send a valid API request payload that includes `topic` with the shape expected by this flow and the downstream flow |
 * | Downstream flow execution fails | The configured `flowId` is incorrect, unavailable, unpublished, deleted, or inaccessible in the current workspace | Verify that flow `3f94aedc-9887-4977-a8d4-9676aaf8bbf7` exists, is deployable, and is accessible to this flow |
 * | Response contains empty or unusable `flowOutput` | The downstream flow ran but returned no meaningful result for the provided `topic` | Test the downstream flow directly with the same `topic`, confirm its expected output contract, and add validation if needed |
 * | Output shape is different from what the caller expects | `flowOutput` is defined by the downstream flow, not by this wrapper | Document the downstream flow’s output schema for callers or add a transformation layer before responding |
 * | Flow behaves correctly in wiring but returns business-level errors | The downstream flow received a `topic` value in an invalid format or unsupported domain | Validate or normalize `topic` before invocation, or update caller contracts to provide valid input |
 * | Execution cannot proceed in a larger pipeline because prerequisite business context is missing | An upstream system or prior flow that should have produced the `topic` value did not run or did not supply it | Ensure the upstream orchestration layer provides `topic` before invoking this entry-point wrapper |
 * | Authorization or platform access issues occur during API invocation or downstream execution | Workspace permissions or platform configuration prevent trigger access or flow execution | Confirm deployment state, workspace permissions, and platform-level access settings for both this flow and the downstream flow |
 *
 * ## Notes
 * This is a minimal wrapper template intended to demonstrate flow-to-flow execution rather than domain-specific processing. Its value lies in explicit orchestration, variable plumbing, and modular composition.
 *
 * The flow is configured with a fixed downstream `flowId`, so it is not a general-purpose dynamic router. If you need runtime flow selection, conditional branching, retries, or response normalization, those capabilities must be added explicitly.
 *
 * A `default` constitution reference exists in the flow resources, but no node in this flow directly uses it in the current configuration.
 *
 * The trigger response type is configured as `realtime`, so callers should expect synchronous request/response behavior rather than deferred job handling.
 */

// Flow: execute-flow

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Execute Flow",
  "description": "This flow introduces the execute flow function, which allows executing another flow and passing required variables.",
  "tags": [
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/execute-flow",
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
    "id": "flowNode_390",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "flowNode",
      "values": {
        "nodeName": "Execute Flow",
        "flowId": "3f94aedc-9887-4977-a8d4-9676aaf8bbf7",
        "requestInput": "{\n  \"topic\": \"{{triggerNode_1.output.topic}}\"\n}"
      }
    }
  },
  {
    "id": "graphqlResponseNode_611",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"flowOutput\": \"{{flowNode_390.output.flowOutput}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-flowNode_390",
    "source": "triggerNode_1",
    "target": "flowNode_390",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "flowNode_390-graphqlResponseNode_611",
    "source": "flowNode_390",
    "target": "graphqlResponseNode_611",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_611",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_611",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
