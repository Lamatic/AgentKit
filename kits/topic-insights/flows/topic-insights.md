# Topic Insights
A lightweight entry-point flow that turns a caller-provided topic into a short AI-generated insight and returns it as a simple API response for use in apps, demos, or downstream display layers.

## Purpose
This flow is responsible for the narrow but useful task of converting a single user-supplied topic into a concise textual overview. It solves the “first-glance understanding” problem: when a user, UI component, or calling system has only a topic string and needs a brief explanation, this flow generates that explanation without requiring retrieval, tool use, or multi-step orchestration.

The outcome is a short-form generated summary returned in a structured API payload. That matters because it gives the wider system an immediately displayable artifact that can be embedded in cards, previews, onboarding surfaces, search result snippets, or lightweight assistant responses. The flow is intentionally optimized for brevity rather than completeness, making it a good fit when speed and compactness are more important than exhaustive coverage.

In the broader agent architecture, this flow sits at the simplest possible generate stage: it is a single-flow pipeline with no dedicated planning or retrieval layer in front of it. According to the parent agent context, it acts as a standalone entry point invoked directly by an API caller. It accepts a topic, performs one LLM generation step, and returns the generated text. Because there are no upstream preprocessing or downstream enrichment stages defined, it serves both as a self-contained micro-capability and as a template that could later be extended into a larger chain.

## When To Use
- Use when a caller can provide a single `topic` string and needs a compact overview rather than a detailed explanation.
- Use when you want a direct API-triggered text generation flow with no retrieval, tools, or branching logic.
- Use when building UI elements that need a short descriptive blurb, such as topic cards, previews, tooltips, or search snippets.
- Use when demonstrating Lamatic AgentKit’s basic request → LLM → response pattern.
- Use when low orchestration overhead is more important than fact depth, citations, or source grounding.
- Use when the desired output is short-form text, roughly aligned with the template’s stated intent of around 150 characters.

## When Not To Use
- Do not use when the caller needs a long-form explanation, detailed analysis, or multi-paragraph synthesis.
- Do not use when the topic must be grounded in verified external data, citations, or current public information, since this flow does not perform retrieval.
- Do not use when the input is not a simple topic string, such as a document, structured record, image, or multi-turn conversation state.
- Do not use when a sibling or custom flow exists for domain-specific summarization, retrieval-augmented answering, classification, or tool calling.
- Do not use when LLM credentials or model configuration have not been set up in Lamatic, because generation will fail.
- Do not use when strict character-count enforcement is required at the API layer; the flow is designed for short output, but no explicit hard truncation logic is implemented in the visible flow definition.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `topic` | `string` | Yes | The subject the flow should summarize into a short insight. |

The trigger definition does not declare explicit schema fields in `inputs`, but the parent agent documentation makes clear that the flow expects a `topic` field in the incoming API request. The flow assumes this value is non-empty, human-readable text suitable for direct inclusion in prompt assembly. No explicit max length, language restriction, or sanitization logic is encoded in the flow, so callers should validate for emptiness, reasonable length, and expected language before invocation if those constraints matter.

## Outputs
| Field | Type | Description |
|---|---|---|
| `tweet` | `string` | The generated short-form topic insight returned by the LLM node. |

The response is a simple object containing one prose field, `tweet`. Despite the field name, it is functionally a short textual summary rather than a social post with platform-specific formatting. The content is plain generated text and should be treated as concise, display-ready prose. Because there is no visible post-processing or truncation node, exact length and formatting depend on the prompt and model behavior.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow.
- It is invoked directly by an `API Request` trigger and does not require any prior Lamatic flow to populate its inputs.
- The only required upstream condition is that the caller provides a valid `topic` string in the request payload.

### Downstream Flows
- None are defined in the parent agent context.
- This flow returns its final response directly to the caller rather than handing off to another documented flow.
- If a broader system chains it externally, the field most likely to be consumed is `tweet`.

### External Services
- Lamatic runtime API trigger — receives the incoming request and starts the flow — no separate credential shown in the flow definition
- Configured LLM provider via Lamatic model configuration — generates the topic insight text — provider credentials depend on the referenced model configuration in `@model-configs/topic-insights_generate-text.ts`

### Environment Variables
- Provider-specific model credential variables as required by the configured model in `@model-configs/topic-insights_generate-text.ts` — enable LLM invocation — used by `Generate Text`

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the incoming API call that starts the flow. In practice, this request is expected to contain a `topic` string. This node serves as the entry point and makes the request data available to downstream nodes.

2. `Generate Text` (`LLMNode`) invokes the configured language model using the referenced system prompt `@prompts/topic-insights_generate-text_system.md` and the associated model settings from `@model-configs/topic-insights_generate-text.ts`. Its job in this flow is singular: take the supplied topic, ask the model for a concise insight, and produce generated text as `generatedResponse`. The flow metadata and parent agent description indicate that this output is intended to be short and overview-oriented.

3. `API Response` (`graphqlResponseNode`) formats the final HTTP/API response. It maps `LLMNode_875.output.generatedResponse` into a single response field named `tweet`, then returns that object to the caller as the flow’s result.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request succeeds structurally but `tweet` is empty or low quality | The `topic` value was empty, vague, or malformed | Validate that `topic` is present, non-empty, and specific before invoking the flow |
| Flow fails at generation time | LLM provider credentials are missing or invalid | Configure the provider credentials required by the model referenced in `@model-configs/topic-insights_generate-text.ts` |
| Flow returns an error before or during model invocation | The model configuration or referenced prompt asset is missing, misconfigured, or inaccessible | Verify that `@prompts/topic-insights_generate-text_system.md` and `@model-configs/topic-insights_generate-text.ts` are present and valid in the deployed package |
| Output is longer or differently formatted than expected | The prompt guides for brevity but the flow does not implement hard length enforcement | Add response validation or truncation in the caller or extend the flow with a post-processing step |
| Caller receives no useful result for a non-text or highly complex request | This flow only supports a simple topic-to-summary pattern | Route those cases to a different flow designed for document processing, retrieval, or multi-step reasoning |
| Invocation assumptions do not match another system’s chain | An external orchestrator expected an upstream preprocessing flow that does not exist here | Treat this flow as a standalone entry point and pass `topic` directly in the request |
| API request is accepted but expected field is not found | The request payload shape does not include `topic` where the runtime expects it | Align the client request with the trigger’s expected payload and test with a known-good topic string |

## Notes
- The exported `inputs` object is empty, so the expected `topic` input is inferred from runtime usage and the parent agent documentation rather than an explicit typed input declaration.
- The response field is named `tweet`, but the flow is not specifically tied to any social platform workflow. Treat it as a generic short insight string.
- No tool calls, retrieval connectors, memory stores, or conditional branches are present, which keeps latency and operational complexity low.
- The flow references a default constitution, but no explicit constitution behavior is surfaced in the node wiring. Any governance or safety behavior would come from the referenced Lamatic assets rather than custom logic in this flow file.
- Because this is a single-step generative flow, reliability depends heavily on prompt quality and model configuration. If you need tighter formatting guarantees, add explicit schema enforcement or a post-generation validator.