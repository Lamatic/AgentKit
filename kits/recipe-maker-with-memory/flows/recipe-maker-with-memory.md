# Recipe Maker with Memory
A memory-aware API flow that turns a user’s meal request into a personalised recipe and serves as the entry-point generation pipeline in the wider agent system.

## Purpose
This flow is responsible for generating customised recipes from user requests while preserving and reusing personal context across interactions. Its core job is not just to answer a single prompt, but to make recipe generation progressively more relevant by incorporating remembered dietary restrictions, preferences, and prior interactions. That makes it suitable for recipe assistants that need continuity rather than one-off responses.

The outcome of the flow is a single recipe response returned over an API interface. Internally, the flow first records new user context, then retrieves prior memory, and finally generates a recipe grounded in both the current request and stored context. This matters because the overall system is designed to reduce repetition, improve fit to the user’s needs, and make generated recipes safer and more useful over time.

In the broader pipeline, this flow sits at the main request-processing layer of a simple retrieve-and-synthesize pattern. According to the parent agent design, this project is implemented as a single-flow pipeline rather than a multi-flow orchestration. That means this flow acts as the entry point, the memory interaction layer, and the synthesis layer all at once: it receives the API request, enriches generation with memory, and returns the final user-facing response.

## When To Use
- Use when an external client needs a recipe generated from a natural-language meal request.
- Use when the caller wants the response personalised using remembered user preferences, dietary restrictions, or previous interactions.
- Use when the request is coming through the agent’s API entry point and no earlier flow is responsible for preparing recipe-generation context.
- Use when a stable user or session identifier is available, so memory can be written and retrieved consistently.
- Use when the user intent is to get a complete recipe or cooking instructions rather than raw preference storage or analytics.
- Use when a web app, mobile app, or backend service needs a single request/response interaction that returns recipe text in real time.

## When Not To Use
- Do not use when the request is not about recipe creation or meal planning.
- Do not use when the caller only wants to store user preferences without generating a recipe response.
- Do not use when no usable user or session scoping identifier is available and memory continuity is required by the product experience.
- Do not use when the upstream client is sending binary assets, images, or non-text inputs that this flow is not configured to interpret.
- Do not use when a different flow is responsible for external retrieval, structured nutrition analysis, or transactional actions such as grocery ordering.
- Do not use when model or memory infrastructure has not been configured, since the core behaviour depends on both services.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `message` / `prompt` | `string` | Yes | The user’s recipe request in natural language, such as desired dish type, constraints, or cooking goal. |
| `userId` or session identifier | `string` | Recommended | A stable identifier used to scope memory so preferences and prior interactions can be stored and retrieved consistently. |
| `dietaryRestrictions` | `string` or `string[]` | No | Optional dietary constraints supplied directly by the caller, such as vegetarian, gluten-free, or nut-free. |
| `cuisine` | `string` | No | Optional cuisine preference to steer recipe style. |
| `ingredientsToUse` | `string` or `string[]` | No | Optional ingredients the user wants included. |
| `ingredientsToAvoid` | `string` or `string[]` | No | Optional ingredients the user wants excluded. |
| `timeBudgetMinutes` | `number` | No | Optional time constraint for preparation and cooking. |
| `servings` | `number` | No | Optional desired serving count. |
| `equipment` | `string` or `string[]` | No | Optional equipment constraints such as air fryer, oven, or one-pan only. |

The exported flow definition does not declare a formal static `inputs` schema, and the GraphQL trigger’s `advance_schema` is empty. In practice, the accepted shape is defined by the trigger configuration in Lamatic and by whatever fields the referenced memory and model configuration expect. At minimum, the request should contain a clear recipe-generation prompt. For production use, keep the API contract stable and versioned, especially for the user or session identifier used by memory. Text inputs should be plain language rather than long structured documents, and callers should avoid ambiguous or contradictory dietary constraints.

## Outputs
| Field | Type | Description |
|---|---|---|
| `recipe` | `string` | The generated recipe text returned from `Generate Text`, mapped from `generatedResponse` into the API response. |

The API response is a simple object containing a single `recipe` field. That field is plain generated text rather than a formally structured recipe schema, unless the system prompt and model configuration enforce a structure at runtime. Consumers should therefore treat the output as prose that may contain ingredients, steps, and notes in free-form format. Completeness depends on prompt quality, model behaviour, and any length limits configured in the referenced model settings.

## Dependencies
### Upstream Flows
- This is a standalone entry-point flow in the current agent design.
- No other Lamatic flow must run before it.
- The true upstream dependency is the external caller, which must provide the recipe request and, ideally, a stable `userId` or equivalent session key so memory operations can behave consistently.

### Downstream Flows
- No downstream Lamatic flows are described in the current agent definition.
- The primary consumer of this flow’s output is an external client application that reads the `recipe` field and presents it to the user or chains it into its own application logic.

### External Services
- Lamatic GraphQL trigger/runtime — receives the inbound API request and returns the realtime response — required runtime deployment in Lamatic
- Lamatic memory service — stores and retrieves user context for personalisation — required memory backend configured through Lamatic memory node settings
- Generative language model referenced by `@model-configs/recipe-maker-with-memory_generate-text.ts` — produces the final recipe text — required model credentials depend on the provider selected in the model config
- Embedding model referenced by the memory resources — supports semantic retrieval for memory search — required model credentials depend on the provider selected in the memory config

### Environment Variables
- Provider-specific model credentials — authenticate the generative model used by `Generate Text` — used by `Generate Text`
- Provider-specific embedding model credentials — authenticate the embedding model used for memory retrieval and possibly memory write processing — used by `Memory Add` and `Memory Retrieve`
- Any Lamatic memory backend configuration variables required by the workspace — enable storage and lookup of user memories — used by `Memory Add` and `Memory Retrieve`

## Node Walkthrough
1. `API Request` (`graphqlNode`)
   - This is the flow’s trigger and entry point. It receives the incoming API request from an external client in realtime mode. The concrete request schema is not embedded in the exported TypeScript, so the trigger passes through whatever fields the Lamatic GraphQL configuration exposes, such as the user’s prompt and any identifiers or preferences.

2. `Memory Add` (`memoryNode`)
   - This node writes new memory associated with the current request. Its detailed behaviour is defined in the referenced memory resource rather than inline in the flow file, but its purpose is clear from the architecture: capture useful user context from the current interaction so future recipe generations can remain personalised. In practice, this is where the system can persist preferences, restrictions, or interaction details tied to the user or session.

3. `Memory Retrieve` (`memoryRetrieveNode`)
   - After writing current context, the flow retrieves relevant prior memory entries. The retrieval parameters, including search query, filters, collection, and result limit, come from the referenced memory configuration. This step supplies historical user context to the generation stage so the model can account for known restrictions, tastes, and patterns instead of relying only on the current prompt.

4. `Generate Text` (`LLMNode`)
   - This node generates the recipe. It uses a system prompt from `@prompts/recipe-maker-with-memory_generate-text_system.md` and a model configuration from `@model-configs/recipe-maker-with-memory_generate-text.ts`. The node is also configured to receive memory context through the referenced `memories` and `messages` settings. The result is a recipe response tailored to the current user request and informed by retrieved memory.

5. `API Response` (`graphqlResponseNode`)
   - This node shapes the outbound API payload. It maps `LLMNode_730.output.generatedResponse` into a single response field named `recipe`, then returns that object to the caller through the GraphQL response path established by the trigger.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request fails before generation starts | The GraphQL trigger is misconfigured, unpublished, or receiving a payload that does not match the expected request shape | Verify the Lamatic trigger schema and deployment, then send a payload containing the fields expected by the client contract and memory/model configs |
| `recipe` is empty or missing | The model call failed, the prompt/messaging config did not populate correctly, or the response mapping could not read `generatedResponse` | Check the `Generate Text` node execution logs, confirm the referenced prompt and model config exist, and verify the output field name is still `generatedResponse` |
| Response ignores user preferences | Memory write or retrieval did not receive a stable session/user identifier, or the memory query did not match useful prior records | Ensure the caller sends a consistent `userId` or session key and review the memory add/retrieve resource configuration for collection, filters, and search query behaviour |
| Memory-related node fails | Missing memory backend setup, missing embedding credentials, or invalid memory resource configuration | Configure the Lamatic memory backend, supply required provider credentials, and validate the referenced files under `@memory/...` |
| Model node fails with authentication or provider errors | Missing or invalid credentials for the configured generative model | Add or correct the provider API key or environment variables used by the model configuration referenced by `Generate Text` |
| Retrieval returns no useful context | No prior memory exists, filters are too restrictive, or the search query is too weak | Seed memory through normal usage, relax retrieval filters, and improve the search query logic in the memory retrieval resource |
| Recipe quality is poor or contradictory | Malformed user input, conflicting constraints, or an insufficiently specific prompt | Validate input before invoking the flow, ask the user for clarification when constraints conflict, and refine the system prompt or message construction |
| Personalisation seems inconsistent across sessions | The client changes the session identifier between requests | Use a stable, durable user-scoping field and keep its semantics consistent across all client integrations |
| Flow is invoked as if it depended on a prior Lamatic flow | External orchestration assumes an upstream flow should have prepared context, but this template is designed as the entry point | Route recipe-generation requests directly to this flow and let the calling application provide raw user context at invocation time |

## Notes
- The flow is linear and deterministic in topology: trigger, memory write, memory retrieval, generation, response. There are no branches, guards, or fallback paths in the exported definition.
- The absence of a declared static input schema means contract discipline must be enforced by the client integration and Lamatic trigger configuration rather than by the flow file alone.
- `Memory Add` executes before `Memory Retrieve`. That design can be useful for capturing current-session context immediately, but developers should verify whether the write should influence same-request retrieval or only future requests, depending on the underlying memory implementation.
- The response is intentionally minimal. If downstream consumers need structured fields such as `title`, `ingredients`, `steps`, or `nutrition`, the system prompt and response mapping should be extended accordingly.
- Because the flow returns realtime output, latency will be driven primarily by memory operations and the LLM generation step. Keep prompts concise and retrieval focused if low response time is important.