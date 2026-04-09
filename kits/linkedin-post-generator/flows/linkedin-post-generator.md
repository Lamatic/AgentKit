# Linkedin Post Generator
This flow converts newsletter email content into a batch of AI-generated LinkedIn post drafts and serves as the entry-point execution surface for this content automation pipeline.

## Purpose
This flow is responsible for turning source newsletter material into publish-ready LinkedIn copy without requiring a human operator to manually read, distill, and rewrite each email. It solves the sub-task of content retrieval, extraction, normalization, and post generation in one API-invoked workflow. The external email-fetching step supplies raw newsletter data, the language model extracts or reframes useful content, and the looped generation stage produces one post draft per processed item.

The outcome is a response payload containing a `posts` collection generated from newsletter content fetched during the run. That outcome matters because it gives downstream business users, automations, or operator tools a structured set of post drafts that can be reviewed, scheduled, published, or fed into other editorial systems. The flow centralizes the entire transformation from long-form inbound content to short-form social output behind a single callable endpoint.

Within the broader agent system, this is a standalone entry-point flow rather than a mid-pipeline helper. In plan-retrieve-synthesize terms, it combines retrieval and synthesis in one place: the `API` node retrieves newsletter material, the first `Generate Text` node performs an initial AI transformation over the fetched content, the `Code` node shapes that result into an iterable list, and the looped `Generate Text` node synthesizes final LinkedIn post drafts. Because the parent agent defines this as a single-flow system, this flow is the primary operational unit invoked by backend services, schedulers, or operator tools.

## When To Use
- Use when you want to generate LinkedIn post drafts from newsletter emails via a single API call.
- Use when a backend service, cron job, or operator tool needs on-demand post generation from recently fetched newsletter content.
- Use when the source material exists outside Lamatic and must first be retrieved from an external HTTP endpoint before generation can begin.
- Use when you need a batch response containing multiple generated post drafts rather than a single ad hoc completion.
- Use when the automation goal is fetch → extract → iterate → generate within one flow execution.

## When Not To Use
- Do not use when the source content is already available locally and does not need to be fetched from the configured external API.
- Do not use when you need direct publishing to LinkedIn; this flow generates drafts only and does not post to social platforms.
- Do not use when the desired output is a newsletter summary, blog article, or another format better handled by a different content-generation flow.
- Do not use when the external newsletter API endpoint is unavailable or no valid access configuration exists for that source system.
- Do not use when the caller requires a strictly defined trigger input contract; this template exposes no explicit trigger fields in `inputs`, so the request boundary must be handled by deployment-specific GraphQL mapping.
- Do not use when an upstream system is expected to have pre-fetched or pre-cleaned newsletter data and a narrower synthesis-only flow would be more appropriate.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| None explicitly defined | `N/A` | No | The flow declares no formal trigger inputs in `inputs`. It is invoked through `API Request`, and any usable request fields depend on deployment-specific GraphQL schema and trigger mapping. |

The flow source defines an empty `inputs` object, so there is no canonical typed input contract at template level. In practice, callers may still pass request fields through the GraphQL trigger boundary, but those fields are not documented in the flow definition itself. Based on the parent agent description, likely operational inputs include a newsletter source identifier and optional fetch or generation preferences, but these are assumptions rather than explicit guarantees. Developers should verify the deployed trigger schema before integrating.

## Outputs
| Field | Type | Description |
|---|---|---|
| `posts` | `array` | Aggregated loop output containing the generated LinkedIn post drafts produced during iteration. |

The API response is a structured object with a single top-level field, `posts`. That field is populated from `{{forLoopEndNode_724.output.loopOutput}}`, so the exact element shape depends on what the looped `Generate Text` node returns for each item. In most deployments this will be a list of generated text outputs, one per processed newsletter-derived item. Completeness depends on upstream fetch results, code transformation behavior, and whether the loop actually receives iterable items.

## Dependencies
### Upstream Flows
- None. This is the entry-point and only documented flow in the parent agent system.
- It is invoked directly through the `API Request` trigger by an external caller such as a backend service, automation job, or operator tool.

### Downstream Flows
- No downstream Lamatic flows are defined in the provided agent context.
- The most likely downstream consumers are external systems that read the returned `posts` field for review, scheduling, storage, or publication.

### External Services
- Lamatic GraphQL trigger surface — receives the inbound API request and returns the flow response — required credential or exposure is deployment-specific.
- External webhook API at `https://dhruvlamatic.app.n8n.cloud/webhook/8cfe684a-6b95-495f-b29d-afb7a2c012e2` — fetches newsletter email data for processing — credential not explicitly configured in the flow; any access control is handled by the endpoint itself or surrounding infrastructure.
- Configured LLM from `@model-configs/linkedin-post-generator_generate-text.ts` — used for initial content extraction/transformation and final LinkedIn post generation — required model credentials depend on the model provider referenced by the Lamatic model config.
- Prompt asset `@prompts/linkedin-post-generator_generate-text_system.md` — provides system instructions for both `Generate Text` nodes — no credential required.
- Script asset `@scripts/linkedin-post-generator_code.ts` — transforms LLM output into a loopable list — no credential required.

### Environment Variables
- No environment variables are explicitly referenced in the provided flow source.
- Any required secrets for the configured LLM provider may be indirectly required by the model configuration used by both `Generate Text` nodes, but those variables are not visible in this flow definition.

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the inbound invocation and acts as the trigger boundary for the flow. The trigger is configured for realtime response handling, but no explicit advanced schema is defined here, so request field handling is deployment-specific.

2. `API` (`apiNode`) makes a `GET` request to the configured external webhook URL. This is the retrieval step of the flow: it fetches newsletter email data from an external system and passes the response downstream for AI processing. No request body, headers, or retry policy are configured in the exported source.

3. The first `Generate Text` (`LLMNode`) consumes the fetched API data and runs the shared system prompt from `@prompts/linkedin-post-generator_generate-text_system.md` using the configured model settings in `@model-configs/linkedin-post-generator_generate-text.ts`. In this flow, that first LLM pass is the extraction or transformation stage that turns raw newsletter payloads into a more generation-ready representation.

4. `Code` (`codeNode`) runs the script referenced by `@scripts/linkedin-post-generator_code.ts`. Its role is to reshape the prior LLM output into a list structure that the loop can iterate over. The loop is configured to use `{{codeNode_706.output}}` as `iteratorValue`, so this script is the bridge between one-shot upstream processing and per-item downstream generation.

5. `Loop` (`forLoopNode`) begins iterating over the list produced by `Code`. It is configured with `iterateOver` set to `list`, an `initialValue` of `0`, an `increment` of `1`, and an `endValue` of `10`. Practically, this means the loop is designed for bounded iteration and hands one item at a time into the next generation step while coordinating with `Loop End` to collect outputs.

6. The second `Generate Text` (`LLMNode`) runs once per loop item. It uses the same system prompt and model configuration as the first LLM node, but here the purpose is final synthesis: generating an individual LinkedIn post draft from each newsletter-derived list item prepared by the code step.

7. `Loop End` (`forLoopEndNode`) receives each generated post result, appends it into the loop’s aggregate output, and coordinates the continuation or completion of iteration back through `Loop`. Once iteration finishes, it exposes the collected `loopOutput` array for the response mapping.

8. `API Response` (`graphqlResponseNode`) returns the final payload to the caller. Its output mapping sets `posts` to `{{forLoopEndNode_724.output.loopOutput}}`, so the caller receives the full batch of generated LinkedIn post drafts as the flow result.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow returns no `posts` or an empty `posts` array | The external API returned no newsletter items, the first LLM stage produced nothing usable, or the code step emitted an empty list | Check the external webhook response, inspect the first `Generate Text` output, and verify that `@scripts/linkedin-post-generator_code.ts` returns a non-empty iterable structure |
| HTTP fetch fails at `API` | The webhook URL is unavailable, misconfigured, rate-limited, or requires authentication not present in the flow | Validate the endpoint manually, add required headers or credentials in deployment, and confirm network access from the Lamatic runtime |
| LLM nodes fail to run | Model provider credentials are missing or invalid in the referenced model config | Review `@model-configs/linkedin-post-generator_generate-text.ts`, ensure the underlying provider credentials are configured, and confirm the selected model is available in the target environment |
| Trigger invocation succeeds but flow ignores caller-provided fields | The trigger schema is not explicitly defined in the flow, so request fields may not be mapped into runtime variables | Verify the deployed GraphQL trigger contract and add or align schema mapping so incoming fields are actually consumed by downstream nodes |
| Loop runs unexpectedly few times or truncates results | The loop has an `endValue` of `10`, which may cap iteration, or the code output shape does not match loop expectations | Confirm the code node returns the intended list, review loop behavior in Lamatic, and adjust loop configuration if more than 10 items must be processed |
| Generated posts are low quality or repetitive | The same system prompt and model config are reused for both extraction and final generation, which may not optimally separate stages | Refine the shared prompt or split the two LLM stages into distinct prompts and model settings better tuned to extraction versus post writing |
| Response format is hard to integrate | The `posts` element shape depends on the looped LLM output and is not strongly typed in the flow definition | Inspect actual runtime output and document or normalize the element schema in the code step or response mapping before wider integration |
| Expected upstream flow data is missing | An integrator assumed another Lamatic flow would pre-fetch or prepare newsletter content, but this flow is designed as the entry point | Invoke this flow directly from the external system, or redesign the pipeline so pre-fetched data is explicitly passed into a different synthesis-oriented flow |

## Notes
- The flow metadata and README describe newsletter fetching, key content extraction, and LinkedIn post generation, but the exact transformation logic inside `@scripts/linkedin-post-generator_code.ts` and the prompt text are abstracted behind references. For production documentation, inspect those assets if you need field-level behavioral certainty.
- Both `Generate Text` nodes share the same prompt and model configuration. That keeps the template simple, but it may blur the distinction between extraction and final copy generation.
- The loop is explicitly configured with `endValue` `10`. If the fetched source returns more than ten items, developers should confirm whether the runtime processes the entire list or stops at the configured bound.
- No retries are configured on the `API` node, so transient upstream failures will surface immediately unless resilience is added externally or in a future revision.