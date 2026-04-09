# Get Started
A minimal entry-point flow that accepts an API request, runs a single LLM generation step, and returns the generated text as the response for the wider Lamatic starter pipeline.

## Purpose
This flow exists to solve the smallest useful unit of an AI automation workflow: take a caller-supplied topic, pass it into a prompt-driven language model, and return a generated answer over an API-style response channel. It is intentionally narrow in scope so developers can validate that trigger wiring, prompt templating, model execution, and response mapping all work correctly before introducing more complex orchestration.

The outcome of the flow is a structured API response containing one field, `output`, whose value is the generated text from the LLM. That matters because it gives downstream callers a deterministic invocation pattern and a predictable response shape, which is essential for early integration testing, operator troubleshooting, and extending the template into richer multi-step agents.

In the broader agent context, this flow sits at the very start and also completes the full loop by itself. It is both the entry point and the terminal response path in a simple request → generate → respond chain. Unlike a larger plan-retrieve-synthesize architecture, there is no separate planning, retrieval, or tool-use stage here; the flow is the baseline synthesis-only example that other, more advanced flows can be modeled on.

## When To Use
- Use when you need a minimal working Lamatic flow to verify end-to-end request and response execution.
- Use when the caller can provide a single `topic` string and expects a direct LLM-generated insight without retrieval, tools, or branching.
- Use when testing model configuration, prompt variable substitution, or API trigger wiring in Lamatic Studio or a deployed runtime.
- Use when you want a simple reference implementation for chaining or extending into more advanced agent workflows.
- Use when the request intent is generic content generation or brief insight generation about a supplied subject.

## When Not To Use
- Do not use when the request requires external data retrieval, search, database access, or tool invocation; this flow has no tools configured.
- Do not use when the caller cannot provide the `topic` input expected by the prompt template.
- Do not use when you need structured multi-field output beyond a single text field named `output`.
- Do not use when a sibling or future flow is responsible for planning, retrieval, validation, moderation, or post-processing.
- Do not use when model credentials or the underlying model configuration have not been set up; the LLM node cannot produce a response without them.
- Do not use when deterministic business logic is required instead of generative text.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `topic` | `string` | Yes | The subject or theme the caller wants the LLM to generate insight about. This is expected in the trigger payload and is referenced by the prompt template as `{{triggerNode_1.output.topic}}`. |

Although the exported `inputs` object is empty, the flow logic clearly assumes that the trigger payload contains `topic`. In practice, this field should be a non-empty string. No explicit length, format, or language validation is encoded in the flow definition, so validation should be enforced by the caller or surrounding runtime if needed.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | The generated text returned by the `Generate Text` LLM node, mapped from `LLMNode_398.output.generatedResponse`. |

The response format is a simple object containing one prose field. The value is whatever text the configured model generates from the system prompt after substituting the provided `topic`. Because the flow performs no post-processing, schema enforcement, or truncation logic of its own, output length, style, and completeness depend on the model configuration and prompt behavior.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow and does not require any other flow to run before it.
- The only prerequisite is that the caller invoke the trigger with a payload that includes `topic` so the prompt can be rendered correctly.

### Downstream Flows
- None are defined in this kit. This flow returns its result directly to the caller through `API Response`.
- If an external orchestrator chooses to chain from this flow, it would most likely consume the `output` field as freeform generated text.

### External Services
- Lamatic GraphQL/API trigger runtime — used to receive the incoming request and emit the response — required runtime deployment and trigger accessibility
- Configured LLM provider via Lamatic model configuration — used by `Generate Text` to produce the response text — required provider credentials as defined by the referenced model configuration

### Environment Variables
- No flow-specific environment variables are declared in the flow source.
- Any required credential variables are indirect and come from the referenced model configuration `@model-configs/get-started_generate-text.ts`, which is used by the `Generate Text` node.

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the incoming invocation for the flow. It acts as the trigger node and starts execution in realtime mode. For this flow to work as intended, the request payload must include `topic`, which becomes available to downstream prompt templating through `triggerNode_1.output.topic`.

2. `Generate Text` (`LLMNode`) takes the trigger data and runs a single language model generation step. It uses the system prompt reference `@prompts/get-started_generate-text_system.md`, along with the referenced model configuration `@model-configs/get-started_generate-text.ts` for model selection, message settings, and memory-related configuration. The prompt is expected to interpolate the caller's `topic` value and ask the model to produce an insight about it. No tools are attached to this node, so the output is generated solely from the prompt and model behavior.

3. `API Response` (`graphqlResponseNode`) formats the final API response and returns it to the caller. Its output mapping sets `output` to `{{LLMNode_398.output.generatedResponse}}`, which means the flow's public response is just the generated text from the LLM node wrapped in a single-field object.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| No response or LLM execution failure | The underlying model provider credentials are missing or invalid in the referenced model configuration | Verify the credentials and provider settings used by `@model-configs/get-started_generate-text.ts`, then redeploy or retest the flow. |
| Response is empty, generic, or low quality | The `topic` field is missing, empty, or too vague, causing the prompt to render poorly | Ensure the trigger payload includes a non-empty, specific `topic` string. Add request validation before invoking the flow if needed. |
| The flow runs but output does not match expectations | The model configuration or prompt content differs from what the caller assumes | Review the referenced prompt and model configuration, then align caller expectations or adjust the prompt/model settings. |
| Malformed input error at invocation time | The API caller is not sending the expected request shape or is using the wrong field name | Send a properly structured request that includes `topic` exactly as expected by the prompt template. |
| `output` is null or missing in the final response | The LLM node did not produce `generatedResponse`, or the node failed before the response mapping executed | Inspect the `Generate Text` node run logs, confirm successful model execution, and verify that the response mapping still points to `LLMNode_398.output.generatedResponse`. |
| Invocation fails in an orchestrated chain because prior data is unavailable | An external orchestrator assumed another flow would populate `topic`, but this flow has no built-in upstream dependency handling | Pass `topic` directly when invoking this flow, or add an upstream orchestration step that explicitly maps the required field before execution. |

## Notes
- This flow is intentionally linear and minimal: one trigger, one LLM step, one response node.
- The flow metadata declares no private `inputs`, but the effective runtime contract still includes `topic` because the prompt depends on it.
- The trigger is configured with `responeType` set to realtime, so this flow is suited to synchronous request/response usage.
- There is no branching, retry policy, fallback model, guardrail node, or output validation layer in the flow definition.
- The flow references a default constitution and a dedicated prompt file, but only the prompt and model configuration are directly involved in the visible execution path of this flow.
- Because there is no downstream post-processing, any formatting, verbosity, or factual limitations of the returned text come directly from the selected model and prompt design.