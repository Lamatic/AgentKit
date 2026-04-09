# 1. Agentic Generation - Generate Content
A single entry-point generation flow that turns a caller's `instructions` into text, JSON, or image output and serves as the core execution path for the wider Generation agent kit.

## Purpose
This flow solves the routing and execution problem for multimodal content generation behind one API contract. Instead of forcing a caller to choose different endpoints or manually coordinate different model calls, it accepts a single request, inspects the requested `mode`, and dispatches the job to the correct generation branch for text, structured JSON, or image creation. It also handles invalid mode requests safely and normalizes branch results before returning them.

The outcome is a finalized response suitable for immediate use by a UI, automation, or downstream system. In `text` mode, it returns model-generated prose content. In `json` mode, it generates structured content and runs an explicit parsing step before response finalization. In `image` mode, it invokes an image generation model from the same instruction input. This matters to the overall agent pipeline because it gives all clients a stable, unified invocation pattern while centralizing validation, prompting, and output shaping in one maintained flow.

Within the broader agent architecture described by the parent `agent.md`, this flow is the primary runtime execution unit, not a mid-pipeline helper. It sits at the front and center of the system's equivalent of a synthesize stage: the caller provides intent and desired modality, and this flow directly produces the user-facing artifact. There is no separate retrieval or planning flow upstream in this kit; orchestration happens inside this mode-routed generation pipeline.

## When To Use
- Use when a caller has free-form `instructions` and needs generated written content via `mode` = `text`.
- Use when a caller needs machine-readable structured output via `mode` = `json` and wants the flow to handle model prompting plus JSON parsing.
- Use when a caller wants an image generated from natural-language instructions via `mode` = `image`.
- Use when a UI or external system wants one stable API entry point for multiple generation modalities.
- Use when you want Lamatic to own branch selection, prompt application, and response normalization rather than implementing those concerns in application code.
- Use when the request comes from the kit's Next.js frontend or any external system capable of invoking the deployed Lamatic API trigger.

## When Not To Use
- Do not use when `mode` is absent, misspelled, or outside the supported set of `text`, `json`, or `image`; the flow will route to the invalid-mode path instead of producing useful content.
- Do not use when the caller needs conversational state, tool use, or multi-step reasoning across turns; this flow is a single request-response generator.
- Do not use when an upstream system expects a strongly typed top-level API schema beyond the single returned `answer` field; branch outputs are normalized into that wrapper.
- Do not use when required model configuration or provider credentials have not been set for the chosen branch.
- Do not use for file-based, multimodal input ingestion beyond the configured request payload; this flow is driven by trigger fields, primarily `instructions` and `mode`.
- Do not use if another sibling or external flow is responsible for retrieval, indexing, search, or data enrichment before generation; this flow assumes the caller already has the instruction to execute.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `mode` | `string` | Yes | Selects the generation branch. Supported values are `text`, `json`, and `image`. |
| `instructions` | `string` | Yes | The user prompt or task description supplied to the selected generation branch. |
| `generativeModelName` | `model` | Branch-required | Private runtime model selection for `LLMNode_430` (`Text`) and `LLMNode_255` (`JSON`). Required when the corresponding branch is used. |
| `imageGenModelName` | `model` | Branch-required | Private runtime model selection for `ImageGenNode_535` (`Generate Image`). Required when `mode` is `image`. |

The trigger itself exposes `mode` and `instructions` from the API request payload. Model selector fields are configured as private Lamatic flow inputs attached to the relevant nodes rather than end-user-facing form fields in a typical product UI. The flow assumes `instructions` is meaningful natural-language input and that `mode` exactly matches one of the supported values. No explicit max-length, language, or schema validation is shown in the flow source, so those constraints depend on the selected model providers and any hidden script logic.

## Outputs
| Field | Type | Description |
|---|---|---|
| `answer` | `string` or `object` | The finalized output from the selected branch, returned through the API response mapping from `codeNode_136.output`. |

The API response always exposes a single top-level field, `answer`, which contains the output produced after branch execution and finalization. Depending on branch behavior and the implementation of `Finalise Output`, this may be plain text, a parsed JSON object or JSON-like structured value, an image generation result payload or URL-like artifact, or an error-shaped value for unsupported modes. The response shape is therefore normalized at the transport layer but not necessarily identical in content type across modes.

## Dependencies
### Upstream Flows
- This is the entry-point flow for the Generation agent kit and does not require another Lamatic flow to run before it.
- It consumes request data directly from `API Request`, specifically `mode` and `instructions` supplied by the caller.
- In broader system terms, the invoking application or orchestration layer must already have decided that the task is a generation request and must provide the instruction text to execute.

### Downstream Flows
- No downstream Lamatic flows are identified in the provided materials.
- This flow is designed to terminate in `API Response` and hand the result back to the caller directly.
- Any downstream dependency is external to Lamatic orchestration, such as the Next.js frontend rendering the returned `answer`.

### External Services
- Lamatic GraphQL/API trigger and response handling — receives invocation payloads and returns the finalized result — requires deployed Lamatic project configuration
- Text generation model provider selected through `generativeModelName` on `LLMNode_430` — generates prose output for `text` mode — requires the provider credential bound in Lamatic model config
- Text generation model provider selected through `generativeModelName` on `LLMNode_255` — generates structured JSON-oriented output for `json` mode — requires the provider credential bound in Lamatic model config
- Image generation model provider selected through `imageGenModelName` on `ImageGenNode_535` — generates image output for `image` mode — requires the provider credential bound in Lamatic model config

### Environment Variables
- `AGENTIC_GENERATE_CONTENT` — deployed flow identifier used by the application layer to invoke this flow — used outside the node graph when calling the deployed flow
- `LAMATIC_API_URL` — Lamatic API base URL for flow invocation — used by the external caller that triggers `API Request`
- `LAMATIC_PROJECT_ID` — Lamatic project scoping for API access — used by the external caller that triggers `API Request`
- `LAMATIC_API_KEY` — authentication for Lamatic API access — used by the external caller that triggers `API Request`

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the incoming API call in realtime mode and exposes the caller payload to the rest of the graph. The two critical runtime values are `triggerNode_1.output.mode` for routing and `triggerNode_1.output.instructions` for prompt construction in the generation branches.

2. `Condition` (`conditionNode`) evaluates `triggerNode_1.output.mode` and selects one of four paths. If the value is `text`, it routes to `Text`. If it is `image`, it routes to `Generate Image`. If it is `json`, it routes to `JSON`. Any other value, including missing or unsupported values, falls through to `Invalid Mode`.

3. `Text` (`LLMNode`) runs only for `mode` = `text`. It uses the shared text-oriented system prompt reference `@prompts/text-system.md` and the flow-specific user prompt reference `@prompts/agentic-generate-content_text_user.md`, along with model configuration from `@model-configs/agentic-generate-content_text.ts`. Its job is to turn the caller's `instructions` into natural-language output.

4. `JSON` (`LLMNode`) runs only for `mode` = `json`. It uses `@prompts/json-system.md` and `@prompts/agentic-generate-content_json_user.md`, plus model configuration from `@model-configs/agentic-generate-content_json.ts`, to generate content intended to be valid JSON or JSON-like structured output.

5. `Parse JSON` (`codeNode`) runs immediately after `JSON`. Its purpose is to post-process the raw model output from the JSON branch using `@scripts/agentic-generate-content_parse-json.ts`, converting the LLM response into a parsed and cleaner structured result before final response assembly.

6. `Generate Image` (`ImageGenNode`) runs only for `mode` = `image`. It uses the system prompt `@prompts/generate-image-system.md`, the user prompt `@prompts/agentic-generate-content_generate-image_user.md`, and the model configuration referenced by `@model-configs/agentic-generate-content_generate-image.ts`. It transforms the user's `instructions` into an image generation request and captures the provider's result.

7. `Invalid Mode` (`codeNode`) runs only when the `Condition` node does not match `text`, `json`, or `image`. Using `@scripts/agentic-generate-content_invalid-mode.ts`, it constructs a safe fallback output indicating that the requested mode is not supported.

8. `Finalise Output` (`codeNode`) is the convergence point for all branches. Whether the upstream result came from `Text`, `Parse JSON`, `Generate Image`, or `Invalid Mode`, this node runs `@scripts/agentic-generate-content_finalise-output.ts` to normalize the branch result into the single output value consumed by the response mapping.

9. `API Response` (`responseNode`) returns the finalized result to the caller. Its output mapping sets `answer` to `{{codeNode_136.output}}`, making `answer` the sole top-level response field regardless of which branch executed.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow returns an invalid-mode style response instead of generated content | `mode` was omitted, misspelled, or provided with an unsupported value | Send `mode` as exactly `text`, `json`, or `image`; validate this in the client before invocation |
| Text or JSON generation fails before producing output | The selected `generativeModelName` is unset, misconfigured, or linked to missing provider credentials | Configure a valid text generation model in Lamatic for `LLMNode_430` and `LLMNode_255`, and verify provider credentials |
| Image generation fails or returns no asset | `imageGenModelName` is missing, invalid, or the image provider credential is unavailable | Configure a valid image generation model for `ImageGenNode_535` and confirm provider access and quotas |
| `json` mode returns parsing errors or malformed structured output | The LLM produced non-JSON text, partial JSON, or unexpected formatting that `Parse JSON` could not cleanly parse | Tighten the JSON prompt, test the selected model for structured generation reliability, and review `agentic-generate-content_parse-json.ts` behavior |
| Response contains an empty or null `answer` | The selected model returned no usable content, or `Finalise Output` could not normalize the upstream branch result | Inspect the branch node output in Lamatic logs, verify prompt inputs, and review `agentic-generate-content_finalise-output.ts` |
| API call cannot reach the flow | The external application is missing `AGENTIC_GENERATE_CONTENT`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, or `LAMATIC_API_KEY`, or they are incorrect | Set the required environment variables from the deployed Lamatic project and verify authentication and flow ID |
| Upstream flow not having run | An external orchestrator assumed prior enrichment or preprocessing, but this entry-point flow does not depend on another Lamatic flow and received incomplete instructions | Ensure the caller passes fully formed `instructions`; do not assume hidden upstream preparation unless your application explicitly performs it |

## Notes
- The flow is deliberately mode-routed rather than tool-augmented: each branch is a separate model path with its own prompt set and post-processing behavior.
- `json` mode is the only branch with explicit intermediate parsing, which suggests it is intended for more deterministic downstream consumption than raw text generation.
- The final transport contract is intentionally simple: everything is returned under `answer`. Consumers that need stronger typing should branch on the request `mode` or inspect the returned content.
- The flow source leaves `meta.description`, tags, and public documentation links empty, so the TypeScript graph itself is the authoritative source of execution behavior.
- Because model selector inputs are marked private, operational configuration is expected to be handled in Lamatic deployment rather than exposed directly to end users.