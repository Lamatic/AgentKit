# Poster Generation
A linear Lamatic flow that turns a natural-language poster idea into a finished poster HTML artifact, serving as the core generation pipeline behind the wider poster creation app and API.

## Purpose
This flow is responsible for converting an unstructured creative prompt into a usable, renderable poster document. Rather than asking a single model call to both interpret intent and generate final code, the flow breaks the task into three staged transformations: intent parsing, design specification building, and HTML poster generation. That structure reduces ambiguity, improves consistency, and makes the final output more likely to be visually coherent and production-ready.

The outcome of the flow is a compact API response containing a completion status, a poster name, and complete HTML for the generated poster. That outcome matters because it is the artifact the rest of the system can immediately use: the Next.js UI can preview it, export it to other formats, and present it to end users without any additional rendering logic beyond standard browser handling.

Within the broader agent pipeline, this flow is the primary execution path rather than a secondary helper. It acts as the end-to-end synthesis chain for poster creation: first it resolves the user’s intent into a structured creative brief, then it formalizes that brief into a detailed design spec, and finally it synthesizes the deliverable HTML. In the parent system, the UI and HTTP endpoint invoke this flow directly, so it functions as the main generation engine rather than as an internal subflow.

## When To Use
- Use when a caller provides a natural-language prompt describing a poster concept and expects a generated poster as output.
- Use when the system needs a self-contained HTML poster that can be previewed immediately in a browser-based UI.
- Use when the user intent is primarily creative synthesis rather than information retrieval, search, or data extraction.
- Use when the application needs both a machine-friendly identifier in `poster_name` and a renderable artifact in `html_code`.
- Use when the downstream consumer is the poster app or API route that supports preview and export to HTML, PNG, JPG, or SVG.
- Use when the input can be expressed as a single prompt string such as a style direction, event poster concept, campaign poster brief, or artistic theme.

## When Not To Use
- Do not use when the caller is not providing a poster-generation request or when the input is not a natural-language poster idea.
- Do not use when the required deployment and Lamatic runtime configuration have not been set up, since the flow is invoked through the deployed Lamatic project.
- Do not use when the task is to edit an existing poster artifact incrementally; this flow generates a fresh poster from prompt rather than performing controlled patching of prior HTML.
- Do not use when the user expects factual retrieval, live web search, or grounding against external knowledge sources, because this flow performs generative design synthesis only.
- Do not use when the caller needs raw image generation output rather than HTML-based poster composition.
- Do not use when a sibling or external workflow already provides a fully structured design spec or finished HTML and only rendering/export is required.
- Do not use when the prompt is empty, malformed, or missing entirely.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | Natural-language description of the poster to generate, supplied by the caller through the API request that triggers the flow. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The trigger node does not declare an explicit public schema beyond accepting an API request, but the surrounding app and agent documentation make clear that the intended caller-facing input is a JSON body containing a single `prompt` string. The flow assumes that this prompt contains enough creative direction to infer purpose, audience, tone, visual style, and any poster copy. No explicit maximum length, language restriction, or format validation is encoded in the flow definition, so practical validation is assumed to happen at the caller or UI layer. Best results will come from prompts that mention subject matter, mood, style, and any required text.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `string` | Fixed completion indicator returned by the response node; set to `complete` on successful execution. |
| `html_code` | `string` | Complete generated poster HTML returned from `Poster Code Generation`. |
| `poster_name` | `string` | Generated poster identifier or title suitable for naming, display, or export workflows. |

Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.

The flow returns a single JSON object. Its most important payload is `html_code`, which is expected to be a full poster document or self-contained HTML fragment suitable for immediate preview and export in the surrounding application. `poster_name` is returned alongside it as a concise naming value. The response node only exposes these final fields plus a static `status`, so intermediate structures such as the parsed intent and design spec are internal to the flow and are not returned to the caller.

## Dependencies
### Upstream Flows
This is a standalone entry-point flow in the parent agent system. No other Lamatic flow is required to run before it.

The only upstream dependency is the external caller, typically the Next.js UI or companion API route, which must provide the poster request as a `prompt` string. No prior flow-produced fields are consumed.

### Downstream Flows
No downstream Lamatic flows are described as consuming this flow’s output. In the broader system, the primary downstream consumers are the Next.js preview and export surfaces rather than another flow.

Those consumers rely on:
- `html_code` to render the generated poster and convert it to exportable formats
- `poster_name` to label the artifact and support naming during export or download

### External Services
- Lamatic hosted flow runtime — executes the deployed flow in response to API invocation — requires `LAMATIC_PROJECT_ENDPOINT`, `LAMATIC_FLOW_ID`, `LAMATIC_PROJECT_ID`, and `LAMATIC_PROJECT_API_KEY`
- Configured text-generation model for `Intent Parser` — interprets the raw poster request into structured intent — requires a Lamatic model configuration selected through `generativeModelName`
- Configured text-generation model for `Design Spec Builder` — expands intent into a full design specification — requires a Lamatic model configuration selected through `generativeModelName`
- Configured text-generation model for `Poster Code Generation` — converts the design specification into final HTML — requires a Lamatic model configuration selected through `generativeModelName`

### Environment Variables
- `LAMATIC_PROJECT_ENDPOINT` — Lamatic project endpoint used by the calling app to invoke the deployed flow — used by the external app entrypoint that triggers this flow
- `LAMATIC_FLOW_ID` — deployed flow identifier for this specific flow — used by the external app entrypoint that triggers this flow
- `LAMATIC_PROJECT_ID` — Lamatic project identifier for API access — used by the external app entrypoint that triggers this flow
- `LAMATIC_PROJECT_API_KEY` — API key for authenticating flow invocation — used by the external app entrypoint that triggers this flow

## Node Walkthrough
1. `API Request` (`triggerNode`)
   - This is the entry point to the flow. It receives the incoming API request from the deployed Lamatic endpoint, which in normal usage contains a JSON body with a `prompt` describing the desired poster.
   - The trigger is configured for realtime response behavior, so the flow is expected to execute synchronously and return the generated result directly to the caller.

2. `Intent Parser` (`InstructorLLMNode`)
   - This node is the first LLM stage. It applies a system prompt and a user prompt template dedicated to intent parsing, using a configured text-generation model.
   - Its job is to transform the raw poster idea into a structured creative brief captured under `generatedResponse`.
   - The structured output includes high-level semantic fields such as `poster_purpose`, `subject`, `target_audience`, `emotional_tone`, `visual_world`, `display_context`, `primary_message`, and `style_references`.
   - It also extracts or infers explicit copy requirements under `explicit_content`, including `headline`, `subtext`, `brand_or_name`, `date_or_event`, and `call_to_action`.
   - This node establishes the semantic contract for the rest of the flow: downstream nodes no longer reason over an ambiguous prompt, but over a normalized creative brief.

3. `Design Spec Builder` (`InstructorLLMNode`)
   - This node takes the parsed intent and converts it into a much more concrete design specification.
   - It uses its own dedicated prompt pair and configured text model to produce a detailed `generatedResponse` object that describes how the poster should be constructed visually.
   - The output includes `poster_name` and `overall_composition_note`, then expands into structured design domains including `layout`, `color_palette`, and `typography`.
   - It also defines executable-like design guidance for `decorative_elements`, `content_blocks`, and `animations`, giving the next stage enough specificity to generate actual HTML and visual styling rather than generic prose.
   - In practical terms, this is the bridge between creative interpretation and implementation planning.

4. `Poster Code Generation` (`InstructorLLMNode`)
   - This is the final synthesis stage. It receives the internal design specification and uses a poster code generation prompt pair to produce the deliverable artifact.
   - Its output schema is intentionally narrow: `html_code` and `poster_name`.
   - `html_code` is expected to contain the completed poster markup implementing the layout, typography, colors, content blocks, decorative instructions, and any motion behavior described upstream.
   - By constraining this node to the final artifact and name, the flow ensures the API response remains clean and directly usable by the application.

5. `API Response` (`responseNode`)
   - This node formats the final realtime response.
   - It returns a JSON body with `status` set to `complete`, plus `html_code` and `poster_name` mapped directly from `Poster Code Generation`.
   - The response content type is explicitly set to `application/json`, making the flow suitable for browser clients, server routes, and other programmatic consumers.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow invocation fails before generation starts | Lamatic project credentials or endpoint values are missing or incorrect | Verify `LAMATIC_PROJECT_ENDPOINT`, `LAMATIC_FLOW_ID`, `LAMATIC_PROJECT_ID`, and `LAMATIC_PROJECT_API_KEY` in the calling application, and confirm the flow has been imported and deployed successfully. |
| Request returns an error or unusable output for an empty submission | The caller sent a missing or empty `prompt` | Validate input before invocation and require a non-empty natural-language prompt. |
| Output is low quality, generic, or stylistically inconsistent | The input prompt lacks enough detail for the intent parser to resolve clear design direction | Provide a richer prompt with subject, audience, tone, style references, and any required poster text. |
| The flow fails at one of the LLM nodes | The configured `generativeModelName` for one or more Instructor nodes is unavailable, unconfigured, or lacks provider credentials | Check the Lamatic model configuration for `Intent Parser`, `Design Spec Builder`, and `Poster Code Generation`, and ensure the underlying provider credentials are valid. |
| `html_code` is present but does not render as expected in the app | The generated HTML is syntactically imperfect or relies on assumptions not supported by the preview/export layer | Inspect the returned HTML, tighten the poster-code-generation prompt or model settings, and test against the target renderer in the Next.js app. |
| Caller expects fields such as `is_valid` or `validation_issues` but they are absent | The actual flow response schema only returns `status`, `html_code`, and `poster_name`; validation fields shown elsewhere may reflect app-level behavior or an earlier contract | Align the consumer with the deployed flow’s actual response mapping, or add a validation step and response fields if those are required. |
| Poster generation cannot be chained from an upstream flow | No upstream Lamatic flow has produced the expected prompt input because this flow is designed as a direct entry point | Pass a single prompt string directly from the caller or build an adapter flow that converts upstream outputs into this flow’s expected request format. |
| Response never completes or takes too long | Multiple sequential LLM stages increase total latency, especially with slower provider models | Use faster configured text models where acceptable, monitor each node’s runtime, and set caller expectations for a multi-stage synchronous generation path. |

## Notes
- The flow is strictly linear: there are no branches, retries, or conditional recovery paths inside the workflow.
- All three generation stages use `InstructorLLMNode` with structured schemas, which helps constrain outputs but does not guarantee perfect adherence under every model/provider combination.
- Intermediate artifacts are rich and structured, but they are internal only. If operators need observability into the creative brief or design spec, the flow would need to be extended to expose or persist them.
- The flow definition itself does not encode explicit input validation, sanitization, or safety review for user-provided text or generated HTML. Those concerns should be handled in the caller, deployment policy, or an added validation node.
- The deploy metadata includes a public app URL at `https://agent-kit-pg.vercel.app/`, which is useful for operator reference but is not itself part of the flow runtime.
- The surrounding application supports export to PNG, JPG, and SVG, but those conversions happen outside this flow. This flow’s direct deliverable is HTML plus a poster name.