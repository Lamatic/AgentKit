# 1. Blog Drafting
Generates a professional blog post draft from a topic, target keywords, and optional writing instructions, serving as the first content-creation stage in the broader blog automation pipeline.

## Purpose
This flow is responsible for turning a lightweight content brief into a usable first draft. It solves the drafting step of the overall blog automation process by accepting a topic, a keyword set, and optional stylistic guidance, then using a configured language model to produce a coherent blog post. Its job is not to optimize for publication systems or finalize SEO strategy, but to create the initial article body that downstream steps can refine.

The outcome of this flow is a single generated draft returned as `generatedResponse`. That output matters because it gives operators and downstream automations a concrete content artifact to review, optimize, and eventually publish. Without this stage, the rest of the pipeline has no substantive article to improve or send to a CMS.

Within the broader agent architecture, this is an entry-point flow in a multi-flow chain. It sits at the front of the drafting → SEO optimization → publishing sequence described in the parent agent. In plan-synthesize terms, this flow performs the first major synthesis step: it transforms structured request data into long-form prose that later flows can optimize and distribute.

## When To Use
- Use when an external system or operator needs a first-pass blog article generated from a new content brief.
- Use when you have a valid `topic` and `keywords` payload and want AI to draft the body content.
- Use when optional tone, format, or structural guidance should influence generation through `instructions`.
- Use at the start of the blog-writing pipeline before SEO refinement or CMS publishing.
- Use when a human review step may happen after drafting and before later automation stages.

## When Not To Use
- Do not use when the goal is to optimize an existing draft for SEO; the dedicated SEO flow is the correct next step.
- Do not use when the goal is to publish content to a CMS or return a publication URL; the publish flow handles that.
- Do not use when `topic` or `keywords` are missing, empty, or not meaningful enough to support article generation.
- Do not use when the input is already a complete draft that only needs editing, formatting, or keyword tuning.
- Do not use when upstream orchestration expects a different output contract such as `content` or `draft` unless the field mapping has been normalized, because this flow returns `generatedResponse`.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `topic` | `string` | Yes | The topic or title for the blog post. |
| `keywords` | `string` | Yes | Comma-separated keywords to include in the blog post. |
| `instructions` | `string` | No | Additional instructions for the AI, such as tone, length, style, or structure. |

The trigger expects a structured API payload delivered to the `graphqlNode` request node. `topic` and `keywords` are both required for meaningful operation. `keywords` is expected as a comma-separated string rather than a structured list in this flow definition. No explicit length limits or language restrictions are encoded in the flow, but extremely short, vague, or malformed inputs will reduce output quality.

## Outputs
| Field | Type | Description |
|---|---|---|
| `generatedResponse` | `string` | The generated blog post draft. |

The response is a single prose string returned in a JSON API response. It is not a structured article object with separate fields for title, sections, or metadata. Completeness and length depend on the underlying prompt and model behavior, so callers should treat it as generated free text that may require review, editing, or downstream optimization before publication.

## Dependencies
### Upstream Flows
This flow is a standalone entry-point for the content pipeline and does not require another Lamatic flow to run before it. Its prerequisites are external: a caller must provide a valid request payload containing at least `topic` and `keywords`, with optional `instructions`.

### Downstream Flows
- `SEO Flow` — consumes this flow's drafted article as the content input for optimization. In practical orchestration, `generatedResponse` should be mapped into the downstream draft/content field expected by the SEO stage.
- `Publish Flow` — does not typically consume this flow directly in the intended pipeline; it is expected to receive the SEO-refined version of the draft after the optimization stage.

### External Services
- Lamatic GraphQL trigger/response runtime — receives the inbound API request and returns the flow result — required Lamatic project/API access configured by the deployment environment
- Configured LLM via `@model-configs/blog-drafting_generate-blog-draft.ts` — generates the draft content from the supplied brief — required model access as defined in Lamatic model configuration
- Prompt resource `@prompts/blog-drafting_generate-blog-draft_user.md` — supplies the drafting instructions used by the LLM node — no separate credential, but must exist in the deployed flow resources

### Environment Variables
- `LAMATIC_API_URL` — Lamatic API or GraphQL endpoint used by the broader kit to invoke this flow — not consumed by an internal node, but required by external callers/orchestrators targeting the flow
- `LAMATIC_PROJECT_ID` — identifies the Lamatic project hosting this flow — not consumed by an internal node, but required by external callers/orchestrators
- `LAMATIC_API_KEY` — authenticates calls into Lamatic-hosted flows — not consumed by an internal node, but required by external callers/orchestrators
- `AUTOMATION_BLOG_DRAFTING` — stores this flow's deployed Lamatic flow ID for orchestration — not consumed by an internal node, but used by the parent kit to invoke this flow specifically

## Node Walkthrough
1. `API Request` (`triggerNode`)
   - This is the flow entry point, implemented as a `graphqlNode` trigger.
   - It receives the incoming API payload and exposes the request fields to downstream nodes as structured values.
   - For this flow, that means the request should contain `topic`, `keywords`, and optionally `instructions` so the drafting node can build the article correctly.

2. `Generate Blog Draft` (`dynamicNode`)
   - This is the `LLMNode` that performs the actual content generation.
   - It uses the user prompt resource `@prompts/blog-drafting_generate-blog-draft_user.md` together with the configured model in `@model-configs/blog-drafting_generate-blog-draft.ts`.
   - The node takes the trigger-supplied brief and synthesizes a professional blog post draft that reflects the requested topic, includes the supplied keywords naturally, and follows any optional instructions for tone or structure.
   - No tools are attached to this LLM node, so generation is based on prompt-plus-model behavior only.

3. `API Response` (`responseNode`)
   - This `graphqlResponseNode` packages the LLM output into the flow's public response contract.
   - It returns JSON with a single field, `generatedResponse`, mapped directly from `{{LLMNode_drafting.output}}`.
   - The response content type is JSON and the node is configured for immediate return without retry behavior.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow invocation fails before generation | Lamatic endpoint, project, or API authentication is missing or incorrect | Verify `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the invoking environment and confirm the flow is deployed |
| Orchestrator cannot find or call the drafting flow | The `AUTOMATION_BLOG_DRAFTING` flow ID is missing or points to the wrong deployment | Update the configured flow ID to the correct deployed Lamatic flow |
| Response returns empty, weak, or off-topic content | `topic` or `keywords` were empty, too vague, malformed, or not passed correctly from the trigger payload | Validate the incoming payload, require non-empty strings, and send clearer topic and keyword inputs |
| Draft ignores style or structure preferences | `instructions` was omitted, blank, or not mapped as expected in the prompt context | Provide explicit `instructions` and verify the prompt resource references the trigger fields correctly |
| Downstream SEO step fails to consume the draft | This flow returns `generatedResponse`, while downstream orchestration may expect `draft` or `content` | Add field mapping in the orchestrator so `generatedResponse` is renamed to the expected downstream input field |
| Flow runs but generation errors internally | The referenced model configuration or prompt resource is missing, invalid, or not deployed with the flow | Confirm `@model-configs/blog-drafting_generate-blog-draft.ts` and `@prompts/blog-drafting_generate-blog-draft_user.md` exist and are bundled correctly |
| Caller sends the wrong payload shape | The trigger expects structured fields like `topic`, `keywords`, and `instructions`, but the request body uses different names or nesting | Normalize the request schema at the caller and ensure the expected top-level field names are used |
| Publishing is attempted directly after this flow and quality is insufficient | Upstream drafting succeeded, but the intended SEO or review step did not run | Route the result through the SEO flow and optional review process before publishing |

## Notes
- The flow is configured for `realtime` response behavior, so it is intended for synchronous draft generation rather than long-running batch execution.
- The public output contract uses `generatedResponse`, which differs from the README's more generic references to `content` or `draft`; orchestration layers should normalize this explicitly.
- The flow references the default constitution, but the specific behavioral impact depends on the broader Lamatic project configuration rather than additional logic inside this flow file.
- Because this flow uses a single LLM generation step with no retrieval or tool augmentation, factual depth and specificity depend entirely on the prompt quality and model capability. Human review is advisable for technical or brand-sensitive topics.