# 1. Agentic Generation - Generate Content
A single entry-point generation flow that routes one user instruction into text, structured JSON, or image output for the wider Lamatic generative agent system.

## Purpose
This flow is responsible for turning a caller's `instructions` and requested `mode` into a usable generated artifact through one consistent API surface. Rather than forcing the application layer to manage separate endpoints, prompts, model choices, and output handling for each content type, the flow centralises that logic inside Lamatic and applies the correct branch for `text`, `json`, or `image` generation.

Its outcome is a final response returned under a single API field, `answer`, after generation and any branch-specific post-processing have completed. That matters to the broader agent pipeline because the surrounding application can invoke one flow ID and receive a mode-appropriate result without needing to understand prompt orchestration, JSON parsing, or invalid-mode handling. This keeps the client thin while preserving room to evolve prompts and model configuration in Lamatic Studio.

Within the broader system described in the parent `agent.md`, this flow is both the primary entry point and the full synthesis layer for the generation kit. There is no separate retrieval or planning flow upstream. Instead, the flow performs routing, generation, optional parsing, and finalisation internally, then returns a polished output ready for UI rendering or downstream programmatic use.

## When To Use
- Use when a caller has a free-form instruction in `instructions` and wants generated prose or markdown by setting `mode` to `text`.
- Use when a caller wants a machine-consumable structured result and can request `mode` as `json`.
- Use when a caller wants an image generation result based on the same instruction and sets `mode` to `image`.
- Use when the application needs one stable Lamatic endpoint for multiple generation experiences rather than separate specialised APIs.
- Use when the Next.js UI or another backend service is invoking the deployed flow ID referenced by `AGENTIC_GENERATE_CONTENT`.
- Use when prompt, model, and formatting behaviour should remain controlled in Lamatic rather than duplicated in application code.

## When Not To Use
- Do not use when `mode` is missing, misspelled, or outside the supported set of `text`, `json`, or `image`; the flow will route to its invalid-mode path instead of producing the intended artifact.
- Do not use when `instructions` is absent or empty, because every generation branch depends on that input.
- Do not use for tasks that require external retrieval, web search, internal knowledge-base lookup, or tool use; this flow contains no retrieval or tool-calling nodes.
- Do not use if you need deterministic schema validation beyond the flow's JSON parsing step; the JSON branch parses model output but does not expose a full schema-contract enforcement layer in this source.
- Do not use as a downstream processing step after another Lamatic flow unless that orchestrator is explicitly passing fresh `instructions` and a supported `mode` into this flow.
- Do not use when Lamatic project credentials, model credentials, or provider configuration have not been deployed and connected.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `mode` | `string` | Yes | Selects the execution branch. Supported values in this flow are `text`, `json`, and `image`. |
| `instructions` | `string` | Yes | The user request or prompt to be transformed into the requested output type. |

The trigger is an API request node and the branch logic explicitly reads `triggerNode_1.output.mode`, so `mode` must be present and exactly match one of the supported values. The prompts referenced by the generation nodes depend on `instructions`, so callers should provide a clear natural-language instruction. No explicit maximum length or language validation is encoded in this source, so practical limits are determined by the configured models and Lamatic runtime constraints.

## Outputs
| Field | Type | Description |
|---|---|---|
| `answer` | `string` or `object` | The finalised result produced by the selected branch and returned by the API response node. |

The response always maps a single top-level field, `answer`, from `codeNode_136.output`. The exact shape of `answer` depends on the selected mode and on what the finalisation script emits. In practice, `text` mode should yield generated prose or markdown, `json` mode should yield parsed structured content after the JSON post-processing step, and `image` mode should yield the image-generation result produced by the image node and then normalised by the finaliser. Callers should not assume that all modes return the same primitive type without checking their own branch expectations.

## Dependencies
### Upstream Flows
This is a standalone entry-point flow for the generation kit. No Lamatic flow must run before it.

The only prerequisite is that an external caller such as the Next.js UI or another backend service invokes the deployed flow and provides the trigger payload fields this flow expects, especially `instructions` and `mode`.

### Downstream Flows
No downstream Lamatic flows are described as consuming this flow's output. In the kit architecture, the usual consumer is the application layer, which reads the API response field `answer` and renders or otherwise uses it directly.

### External Services
- Lamatic API runtime — hosts and executes the flow via the API trigger and response nodes — requires `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the calling application context
- Text generation model for `LLMNode_430` — generates `text` mode output from the system and user prompts — requires a Lamatic-configured text model credential selected through `generativeModelName`
- Text generation model for `LLMNode_255` — generates raw JSON-oriented content for `json` mode — requires a Lamatic-configured text model credential selected through `generativeModelName`
- Image generation model for `ImageGenNode_535` — creates image output for `image` mode — requires a Lamatic-configured image model credential selected through `imageGenModelName`

### Environment Variables
- `AGENTIC_GENERATE_CONTENT` — deployed flow ID used by the external application to invoke this flow — used by the caller outside the flow, corresponding to this flow deployment
- `LAMATIC_API_URL` — base URL for Lamatic API access — used by the external caller to reach the `API Request` trigger
- `LAMATIC_PROJECT_ID` — Lamatic project scoping for API invocation — used by the external caller to invoke this flow instance
- `LAMATIC_API_KEY` — authentication for Lamatic API calls — used by the external caller to invoke the `API Request` node

## Node Walkthrough
1. `API Request` (`triggerNode`)
   - This is the runtime entry point for the flow. It receives the incoming API payload and exposes fields such as `mode` and `instructions` to downstream nodes.
   - The trigger is configured for realtime response behaviour, so the flow executes synchronously from request to final API response.

2. `Condition` (`conditionNode`)
   - This node inspects `{{triggerNode_1.output.mode}}` and routes execution into one of four branches.
   - If `mode` equals `text`, it sends the request to `Text`.
   - If `mode` equals `image`, it sends the request to `Generate Image`.
   - If `mode` equals `json`, it sends the request to `JSON`.
   - Any other value falls through to `Invalid Mode`.

3. `Text` (`LLMNode`)
   - This branch handles `text` mode generation.
   - It calls a configured chat-capable text model using the referenced `text_system` system prompt and `agentic_generate_content_text_user` user prompt.
   - Its model, message, attachment, credential, and memory configuration are all sourced from `@model-configs/agentic-generate-content_text.ts`, which means the exact provider-specific details are abstracted out of the flow source.
   - The node produces the raw text-generation result that is sent directly to `Finalise Output`.

4. `JSON` (`LLMNode`)
   - This branch handles `json` mode generation.
   - It calls a configured chat text model with the referenced `json_system` system prompt and `agentic_generate_content_json_user` user prompt, aiming to produce JSON-oriented output rather than plain prose.
   - As with the text branch, operational model settings are resolved through `@model-configs/agentic-generate-content_json.ts`.
   - Its output is not returned immediately; it is first sent to `Parse JSON` for post-processing.

5. `Parse JSON` (`codeNode`)
   - This code step runs only after the `JSON` branch.
   - It uses the script `@scripts/agentic-generate-content_parse-json.ts` to transform or validate the raw model output into a parsed JSON structure suitable for a cleaner final response.
   - This step is the branch-specific safeguard that distinguishes `json` mode from plain text generation.

6. `Generate Image` (`ImageGenNode`)
   - This branch handles `image` mode generation.
   - It calls the configured image-generation model using the `generate_image_system` system prompt and `agentic_generate_content_generate-image_user` user prompt.
   - The actual image model selection comes from `@model-configs/agentic-generate-content_generate-image.ts` through the private input `imageGenModelName`.
   - The resulting image-generation payload is then passed to `Finalise Output`.

7. `Invalid Mode` (`codeNode`)
   - This branch runs when `mode` does not match `text`, `json`, or `image`.
   - It executes `@scripts/agentic-generate-content_invalid-mode.ts` to produce an explicit invalid-mode result rather than letting the flow fail silently.
   - Its output is also sent to `Finalise Output`, ensuring all branches converge on a common response pathway.

8. `Finalise Output` (`codeNode`)
   - This node is the convergence point for all branches.
   - It executes `@scripts/agentic-generate-content_finalise-output.ts` to normalise the branch output into the final API payload shape expected by the response mapping.
   - Because every branch feeds into this node, it is the final place where text output, parsed JSON, image output, or invalid-mode messaging is packaged consistently.

9. `API Response` (`responseNode`)
   - This node returns the flow result to the caller.
   - Its output mapping sets the response field `answer` to `{{codeNode_136.output}}`, making the finaliser's output the canonical API response body for this flow.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow returns an invalid-mode style response instead of generated content | `mode` was not one of `text`, `json`, or `image` | Validate `mode` before invocation and send one of the supported literal values |
| No useful content is returned in `text` mode | `instructions` was empty, too vague, or the configured text model is unavailable | Ensure `instructions` is non-empty and meaningful, then verify the model configured for `LLMNode_430` is deployed and credentialed |
| JSON branch fails or returns malformed structured content | The model produced non-JSON output or formatting that the parse script could not handle | Strengthen caller instructions, review the JSON prompts, and verify the script `agentic-generate-content_parse-json.ts` matches the model's output style |
| Image branch returns empty or failed output | No valid image model is configured or provider credentials for `ImageGenNode_535` are missing | Configure a supported image-generation provider in Lamatic and bind it to `imageGenModelName` |
| API invocation fails before the flow runs | Lamatic API credentials or project configuration are missing in the calling app | Set `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and `AGENTIC_GENERATE_CONTENT` correctly in the environment |
| The caller cannot find the expected response field | The application expects a branch-specific field rather than the canonical response mapping | Read the response from top-level `answer`; if branch-specific typing is needed, add client-side handling per mode |
| Output shape differs across modes | `answer` is finalised from different branch payloads and may not be uniform across `text`, `json`, and `image` | Treat `mode` as part of the contract and deserialize `answer` according to the requested branch |
| Invocation from another orchestration layer fails due to missing context | An upstream system did not pass `instructions` and `mode` when chaining into this flow | Ensure any upstream caller forwards the required trigger payload explicitly; no prior Lamatic flow populates it automatically |
| Generation fails after deployment changes | Model config, prompt references, or credentials in Lamatic Studio no longer match the deployed environment | Reconcile the referenced model configs and prompts, redeploy the flow, and retest each branch with representative inputs |

## Notes
- The flow's metadata includes a `testInput` of `{"mode": "text", "instructions": "write me a poem on AI"}`, which is a useful smoke test for verifying the text branch after deployment.
- The text and JSON branches both use `LLMNode` nodes, but they are intentionally separated so that prompts, model settings, and post-processing can diverge by output type.
- The JSON branch is more operationally fragile than the text branch because it depends on both generation quality and a subsequent parsing script.
- The response node always returns a single mapped field, `answer`, which simplifies client integration but means consumers should rely on the requested `mode` to interpret the payload correctly.
- Although the README describes markdown rendering support in the UI, markdown formatting is an application concern; this flow simply generates and returns the content produced by its configured prompts and models.