# Plant Care
A single-flow API-invoked plant identification and care-generation pipeline that turns a user-provided plant image link into a structured response for downstream applications or operators.

## Purpose
This flow is responsible for the core task of transforming a plant image reference into usable plant intelligence. It accepts an API request, passes the image-linked context into a configured language model, and returns the model's generated result as the response payload. Its job is not broad orchestration or multi-step retrieval; it is the focused execution unit that performs the actual image-driven plant analysis and care-guide generation.

The outcome of this flow is a machine-consumable result that can be stored, displayed, or forwarded into later automation. That matters because the wider system is designed to reduce ambiguity for both users and developers: instead of receiving loosely phrased advice, calling systems receive a predictable payload they can use for plant profiles, reminders, support flows, or catalog enrichment.

Within the broader agent context, this flow is both the entry point and the synthesis stage. There are no separate planning or retrieval subflows in this kit. The caller supplies the key source artifact — an image URL — and this flow performs the interpretation and response generation in one pass, then returns the result directly through the API boundary.

## When To Use
- Use when a caller has a plant image URL and needs the system to identify the plant and generate care guidance.
- Use when a UI, backend, or automation needs a single API-call flow that returns structured plant-analysis output.
- Use when downstream systems expect a normalized response rather than free-form conversational text.
- Use when this kit is deployed as the primary entry point for plant-care analysis in an application.
- Use when no prior Lamatic flow has already performed plant identification or produced a care-guide payload for the same image.

## When Not To Use
- Do not use when the caller does not have an image reference or cannot supply a usable image URL.
- Do not use when the input is plain text plant symptoms, gardening questions, or care history without an image; this flow is designed around image-based analysis.
- Do not use when a different system already identified the plant and only downstream scheduling, notification, or storage work remains.
- Do not use when strict deterministic computer-vision classification is required; this flow relies on an LLM-driven generation step.
- Do not use when API credentials, model access, or the deployed endpoint are not configured, because the flow has no fallback path.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `imageUrl` | `string` | Yes | A user-provided URL pointing to the plant image the flow should analyze. |

The trigger configuration does not declare a formal advanced schema in the flow source, so the exact API request envelope is deployment-defined. However, the broader kit documentation makes clear that the flow expects at minimum a single image-link input that the model can reference. The URL should be reachable by the model runtime and should point to a valid plant image. Non-image links, inaccessible resources, or ambiguous images may degrade output quality or cause failure.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | The generated response from the LLM node, returned directly as the API response payload. |

The response contains a single top-level field, `output`, whose value is whatever the `Generate Text` node produced. Based on the flow's README and parent agent definition, this is intended to be a structured JSON-formatted plant identification and care guide emitted as text. In practice, callers should treat the field as model-generated content: it is expected to be machine-readable, but its completeness and strict validity depend on prompt adherence and model behavior.

## Dependencies
### Upstream Flows
This is a standalone entry-point flow. No other Lamatic flow must run before it.

The only upstream prerequisite is the external caller supplying a valid plant image URL in the API request. No prior flow outputs are consumed.

### Downstream Flows
No downstream Lamatic flows are defined in the provided agent context. This flow returns its result directly to the invoking client or orchestration layer.

In deployed systems, external consumers such as UIs, backend services, databases, reminder engines, or cataloging workflows may use the `output` field after this flow completes.

### External Services
- Lamatic GraphQL/API trigger endpoint — receives the incoming request and starts flow execution — required deployment-level API exposure configured by Lamatic
- Configured LLM service via AgentKit model configuration — analyzes the plant image reference and generates the structured response — required model provider credentials as defined by the referenced model configuration
- Lamatic GraphQL/API response endpoint — returns the final payload to the caller — required deployment-level API exposure configured by Lamatic

### Environment Variables
- Model-provider environment variables defined in `@model-configs/plant-care_generate-text.ts` — authenticate and configure the generative model used for analysis — used by the `Generate Text` node
- Any Lamatic deployment/API environment settings required to expose the trigger and response endpoint — enable invocation of the flow over API — used by the `API Request` and `API Response` nodes

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the incoming API invocation that starts the flow. In this template it is the trigger node, configured for realtime response handling. Its practical role is to accept the caller's plant image link and place that request data into the execution context for downstream use.

2. `Generate Text` (`LLMNode`) performs the core work of the flow. It uses the system prompt reference `plant-care_generate-text_system.md` together with the model configuration reference `plant-care_generate-text.ts` to instruct the model to analyze the supplied plant image and generate the plant-identification and care result. There are no tools attached to this node and no branching logic; the flow depends entirely on this single generation step.

3. `API Response` (`graphqlResponseNode`) sends the result back to the caller. Its output mapping assigns `{{LLMNode_507.output.generatedResponse}}` to the response field `output`, meaning the API returns exactly the generated text produced by the LLM node under that field name.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request succeeds but `output` is empty or unhelpful | The supplied image URL is invalid, inaccessible, points to non-image content, or the image does not clearly depict a plant | Validate that the URL is public or otherwise accessible to the runtime, points directly to an image, and contains a clear plant subject |
| Flow invocation fails before generation | The API endpoint is not deployed correctly or Lamatic trigger/response configuration is unavailable | Confirm the flow is deployed, the API endpoint is active, and the trigger node can receive realtime requests |
| Generation fails with authentication or provider errors | Model credentials or provider settings required by `@model-configs/plant-care_generate-text.ts` are missing or incorrect | Configure the required model-provider environment variables and verify the referenced model configuration is valid |
| Returned `output` is not valid JSON even though structured output is expected | The model did not fully comply with the prompt contract or output formatting instructions | Strengthen prompt constraints, add downstream validation, and treat the response as model-generated text unless validated |
| Plant identification is incorrect or low confidence | The image quality is poor, the plant is partially obscured, or the model lacks enough visual/contextual signal | Provide a clearer image, consider multiple images if the implementation is extended, or add a user review step before automated use |
| Caller sends text or another data type instead of an image link | The flow expects an image-reference input and has no alternate parsing path | Route non-image requests to a different flow or normalize inputs upstream into a valid image URL |
| An orchestrator expects prior flow outputs to be present | This flow is being chained incorrectly in a larger system even though it is designed as an entry-point flow | Invoke this flow directly with the required request payload rather than waiting for upstream Lamatic flow context |

## Notes
This flow has no declared private `inputs` object in the source, so required runtime configuration is implicit rather than exposed as named flow inputs. Most operational dependencies therefore live in deployment settings and the referenced model configuration.

Although the README and parent agent description describe the result as structured JSON, the response contract implemented in the flow is simply a string field named `output`. Consumers that require strict schema compliance should validate and parse this field before relying on it in production automation.

The flow contains only three nodes and no conditional branches, retries, guardrails, or post-processing steps. That keeps invocation simple, but it also means error handling, validation, and normalization are primarily the responsibility of the caller or of future extensions to the template.