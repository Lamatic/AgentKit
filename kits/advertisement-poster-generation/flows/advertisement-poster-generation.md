# Advertisement Poster Generation
A flow that accepts an input image via API, analyzes it with a multimodal model, and returns both creative advertising insights and a generated poster image as the end-to-end execution path for this single-flow agent.

## Purpose
This flow is responsible for transforming a raw source image into marketing-ready creative output. It solves the sub-task of understanding what is in the image, extracting or inferring persuasive advertising angles, and converting that understanding into a new poster-style image generation request. In practice, it reduces the manual work of reviewing an asset, drafting messaging, and preparing a visual concept for an advertisement.

The outcome of the flow is twofold: a textual `insights` payload produced by the multimodal analysis stage, and an `image` URL produced by the image generation stage. Together, these outputs give downstream consumers both the reasoning behind the creative direction and the final rendered asset. This matters because operators, applications, or automated systems can use the insights for review, audit, or iterative prompting while immediately displaying or storing the generated poster.

In the broader agent pipeline, this flow is the primary and only runnable execution path in the kit. According to the parent agent definition, it sits across the full ingestion-to-synthesis chain: it begins at the API boundary, performs multimodal interpretation and concept expansion, and then synthesizes a poster image from that derived creative brief. There is no separate planning or retrieval flow in this template; this flow serves as the entry point and completion path for the entire advertisement-poster-generation capability.

## When To Use
- Use when a caller has a product, brand, or promotional image and wants an automatically generated advertisement poster from it.
- Use when an application needs both machine-generated creative reasoning and a final poster asset in a single API invocation.
- Use when the request includes an image that should be interpreted by a multimodal model before image generation.
- Use when marketing teams, creator tools, or e-commerce back-office systems need a fast “upload image to ad creative” workflow.
- Use when sparse creative guidance is available and the system should infer advertising angles from the image content itself.
- Use when this kit is deployed as a standalone API-driven poster generation service.

## When Not To Use
- Do not use when there is no input image available; this flow is designed around multimodal image analysis as its first substantive step.
- Do not use when the goal is only image captioning, classification, or extraction without generating a new poster image.
- Do not use when the caller needs a purely text-only ad copy workflow; this flow is optimized for image-in, poster-out generation.
- Do not use when strict deterministic layout control or editable design-layer output is required; this flow returns a generated image, not a structured design file.
- Do not use when the upstream API layer cannot provide the image in a format the deployed multimodal model can access or ingest.
- Do not use a different sibling flow for chaining purposes in this kit, because the parent agent describes this as a single-flow template with no alternate execution branch.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `image` | `string` or binary/image reference | Yes | The source image to analyze and use as the creative basis for poster generation. Depending on deployment, this is typically a URL, upload handle, or encoded image payload accepted by the API gateway and model configuration. |
| `notes` | `string` | No | Optional creative or marketing notes that help the multimodal model infer intent, messaging, audience, or constraints. |
| `brief` | `string` | No | Optional short campaign brief or supporting prompt text for the concept-generation stage. |
| `brandName` | `string` | No | Optional brand identifier to inform advertising language or poster context. |
| `productName` | `string` | No | Optional product identifier to guide the generated concept and poster prompt. |
| `style` | `string` | No | Optional desired visual style such as minimal, premium, playful, or cinematic. |

The flow source does not declare a fixed typed `inputs` object, so the trigger accepts data through the API request boundary rather than through statically enumerated private inputs. The exact GraphQL schema is not embedded in the flow source, but the parent agent documentation makes clear that an `image` is the essential input and that optional supporting fields may accompany it.

Input quality strongly affects output quality. The image should be accessible to the configured multimodal model and should clearly depict the product, brand asset, or promotional subject. Optional text fields should be concise and goal-oriented; overly vague or contradictory guidance may produce generic or inconsistent creative output.

## Outputs
| Field | Type | Description |
|---|---|---|
| `insights` | `string` | The multimodal model’s generated analysis and creative direction derived from the input image and any accompanying context. |
| `image` | `string` | The generated poster image URL returned by the image generation node. |

The API response is a simple object with two top-level fields. `insights` is prose generated by the multimodal step, likely containing observations, positioning ideas, value propositions, or visual guidance. `image` is a single URL-like reference to the rendered poster output from the image generation model.

Because the flow maps raw node outputs directly into the response, the completeness and structure of `insights` depend on the referenced system prompt and model behavior rather than a hard schema enforced in this file. Likewise, `image` assumes the image generation provider returns an accessible URL; if the provider uses expiring links or asset-hosting indirection, consumers should store or proxy the image as needed.

## Dependencies
### Upstream Flows
- This is a standalone entry-point flow. No other Lamatic flow must run before it.
- The only prerequisite is that the caller invokes the API trigger with a usable `image` and any optional creative context.

### Downstream Flows
- No downstream flows are defined in this kit.
- External applications, orchestration systems, or user interfaces may consume `insights` for review and `image` for display, storage, or publishing, but no additional Lamatic flow dependency is declared.

### External Services
- GraphQL/API trigger service — receives the incoming request and initiates execution — required credential or environment variable depends on the deployment gateway configuration.
- Multimodal LLM configured by `@model-configs/advertisement-poster-generation_multi-modal.ts` — analyzes the input image and generates creative advertising insights — requires the provider credentials referenced by that model configuration.
- Image generation model configured by `@model-configs/advertisement-poster-generation_generate-image.ts` — renders the final advertisement poster image from the derived prompt — requires the provider credentials referenced by that model configuration.

### Environment Variables
- `MULTIMODAL_MODEL_PROVIDER` — identifies or configures the multimodal model backend used for image understanding — used by the `Multi Modal` node through `@model-configs/advertisement-poster-generation_multi-modal.ts`.
- `MULTIMODAL_MODEL_API_KEY` — authenticates the multimodal model request — used by the `Multi Modal` node through `@model-configs/advertisement-poster-generation_multi-modal.ts`.
- `IMAGE_GEN_MODEL_PROVIDER` — identifies or configures the image generation backend — used by the `Generate Image` node through `@model-configs/advertisement-poster-generation_generate-image.ts`.
- `IMAGE_GEN_MODEL_API_KEY` — authenticates the image generation request — used by the `Generate Image` node through `@model-configs/advertisement-poster-generation_generate-image.ts`.

The exact variable names are not present in the flow source. Use the environment variables required by the specific providers declared inside the referenced model configuration files.

## Node Walkthrough
1. `API Request` (`graphqlNode` trigger): This node is the entry point for the flow. It receives the incoming API request in realtime mode and makes the request payload available to downstream nodes. In this flow, that payload is expected to include the source `image` and may also include optional campaign context such as notes, branding, product identity, or style preferences.

2. `Multi Modal` (`multiModalLLMNode`): This node performs the first substantive transformation. It uses the referenced system prompt `@prompts/advertisement-poster-generation_multi-modal_system.md` together with the multimodal model configuration to inspect the input image and infer advertising-relevant insights. Its job is not merely to describe the image, but to expand it into useful creative direction that can drive poster generation. The key output surfaced later is `generatedResponse`, which becomes the final `insights` field in the API response.

3. `Generate Image` (`ImageGenNode`): This node takes the prior stage’s output and uses the referenced user prompt `@prompts/advertisement-poster-generation_generate-image_user.md` plus the configured image generation model to create a new advertisement poster image. Although the prompt file content is external, the node’s position in the graph and the overall flow intent show that it converts the multimodal analysis into a renderable creative prompt. Its main output is `imageUrl`, which becomes the `image` field in the API response.

4. `API Response` (`graphqlResponseNode`): This node shapes the final API payload. It maps `{{multiModalLLMNode_392.output.generatedResponse}}` to `insights` and `{{ImageGenNode_223.output.imageUrl}}` to `image`, returning a compact response object to the caller. The response edge from the trigger node indicates that this is the formal completion point for the API invocation.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request fails before model execution | The API trigger is misconfigured, the caller is using the wrong endpoint shape, or the deployment gateway is not passing the expected payload | Verify the deployed API endpoint, GraphQL request structure, and that the request includes an accessible `image` field |
| `insights` is empty or low quality | The input image is missing, unreadable, inaccessible to the multimodal model, or too vague to support strong analysis | Provide a clearer image, ensure the model can access it, and add concise `notes`, `brief`, `brandName`, or `productName` context |
| `image` is missing from the response | The image generation model failed, returned no `imageUrl`, or received an insufficiently grounded prompt from the previous node | Check image generation credentials, inspect model/provider logs, and improve the source image or supporting prompt context |
| Authentication or provider errors occur in `Multi Modal` | Missing or invalid credentials for the multimodal model provider in the referenced model config | Configure the required provider API key and model settings used by `@model-configs/advertisement-poster-generation_multi-modal.ts` |
| Authentication or provider errors occur in `Generate Image` | Missing or invalid credentials for the image generation provider in the referenced model config | Configure the required provider API key and model settings used by `@model-configs/advertisement-poster-generation_generate-image.ts` |
| Generated poster does not match brand intent | Optional branding or creative guidance was not supplied, so the model inferred generic messaging | Pass `brandName`, `productName`, `style`, and short campaign notes to better anchor the creative direction |
| Runtime succeeds but image URL is unusable later | The image provider returns a temporary, private, or expiring asset URL | Persist the generated asset in your own storage or proxy it immediately after receipt |
| Flow cannot be chained from an expected prior step | An orchestrator assumes an upstream preprocessing flow exists, but this kit is a single-flow template with direct API entry | Route requests directly into this flow and ensure all required inputs are supplied at invocation time |

## Notes
- The flow has no conditional branches, retries, or fallback nodes defined in the source. Failures in either model stage are therefore likely to surface directly unless the hosting runtime adds its own resilience behavior.
- The trigger configuration shows `responeType` set to `realtime`, so the flow is intended for synchronous request-response usage rather than long-running asynchronous orchestration.
- The flow relies heavily on external prompt and model configuration files. Changes to those references can materially alter output quality, structure, tone, and cost without changing the graph itself.
- Because `insights` is returned as freeform model output, developers should not assume a stable machine-parseable schema unless they inspect and constrain the referenced system prompt.
- This template is best suited for rapid concept generation and first-pass creative production, not final brand-governed design approval workflows.