# Agentic Reasoning
A final-answer synthesis flow that turns a user query plus accumulated research into a single response, serving as the synthesis stage of the wider Deep Research pipeline.

## Purpose
This flow is responsible for the last step of the reasoning workflow: converting previously gathered evidence into a usable answer for the caller. It does not search, crawl, retrieve, or plan. Instead, it takes the original user request and the collected `research` context from earlier stages, then asks a text-generation model to produce the final answer.

The outcome is a single `answer` string returned through the flow's API response. That output matters because it is the user-facing artifact of the overall pipeline: planning and retrieval are only useful if they culminate in a coherent, grounded response. In operational terms, this flow is where accumulated evidence becomes a concise recommendation, explanation, summary, or action-oriented reply.

Within the broader Deep Research architecture, this flow sits at the end of the plan-retrieve-synthesize chain. Upstream flows generate reasoning steps and gather evidence from the public web and/or internal indexed sources. This flow consumes those prepared artifacts and synthesizes them into the final answer delivered back to the invoking UI or service.

## When To Use
- Use after upstream planning and retrieval have already run and produced a `research` collection for the current user query.
- Use when the caller needs a single natural-language answer rather than intermediate steps, raw search results, or retrieved documents.
- Use when web-search or internal-data-source evidence has been assembled and must be combined into one grounded response.
- Use when the invoking application wants the final user-visible response in a Deep Research run.
- Use when the user asks an open-ended question that benefits from synthesis across multiple research items rather than direct lookup from one source.

## When Not To Use
- Do not use as the first step of a research run; use the step-generation flow first when no plan or retrieval has happened yet.
- Do not use when the system still needs to collect evidence from the web; use the web-search retrieval flow instead.
- Do not use when the system still needs to retrieve from internal indexed sources; use the data-source retrieval flow instead.
- Do not use when the caller wants raw search hits, citations-only output, or step-by-step execution artifacts rather than a final answer.
- Do not use if the required upstream `research` input has not been assembled yet.
- Do not use if the request payload is missing the user `query`, because the model needs the original question to frame the final synthesis.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | The original user question that the final answer must address. |
| `research` | `array` | Yes | The accumulated research artifacts from upstream retrieval steps, typically including web or data-source results such as titles, links, snippets, dates, sitelinks, and related metadata. |
| `generativeModelName` | `model` | Yes | The text-generation model selection used by the `Generate Text` node to produce the final answer. This is configured as a private runtime/model input rather than a user-facing content field. |

Below the table, note that the flow assumes `query` is a natural-language prompt and `research` is already curated into a machine-readable list of evidence objects. The exact schema of each research item is flexible, but the flow expects meaningful textual fields to be present so the model can synthesize them. No explicit length or language validation is defined in the flow source, so callers should avoid extremely large payloads and should pass clean, relevant research context.

## Outputs
| Field | Type | Description |
|---|---|---|
| `answer` | `string` | The final model-generated answer synthesized from the input `query` and provided `research`. |

The response format is a simple object containing one prose field, `answer`. The flow does not return intermediate reasoning steps, raw citations as a separate structured field, or diagnostic metadata. Completeness depends on the quality and sufficiency of the upstream `research` payload and the selected model's ability to synthesize that material.

## Dependencies
### Upstream Flows
- `agentic-reasoning-generate-steps` — typically runs earlier in the broader pipeline to expand the user `query` into a plan for downstream retrieval. This flow does not directly consume its output field in the TypeScript source, but it is part of the normal orchestration path that leads to evidence collection.
- `agentic-reasoning-search-web` — supplies public-web research results that may populate the `research` input consumed here.
- `agentic-reasoning-data-source` — supplies internal indexed retrieval results that may also populate the `research` input consumed here.
- Orchestrating application or service layer — is responsible for invoking those upstream flows, gathering their outputs, and passing the assembled `query` and `research` payload into this flow.

This is not a standalone discovery flow. It is a synthesis-stage flow that depends on prior evidence gathering, even though that dependency is enforced by orchestration rather than by explicit in-flow branching logic.

### Downstream Flows
- No Lamatic sibling flow is shown as consuming this flow's output directly.
- The primary downstream consumer is the invoking UI or service, which reads `answer` and presents it to the end user or uses it as the terminal artifact of a research session.

### External Services
- Lamatic GraphQL/API trigger-response runtime — receives the request and returns the final payload — required project/API credentials in the host environment
- Configured text-generation model via Lamatic `LLMNode` — generates the final synthesized answer from prompts plus `query` and `research` — requires a valid model selection provided through `generativeModelName`
- Prompt assets in the Lamatic project — provide the shared system instruction and this flow's user synthesis instruction — no separate runtime credential, but they must exist in the deployed project

### Environment Variables
- `AGENTIC_REASONING_FINAL` — Flow ID used by the surrounding application to invoke this deployed flow — used outside the flow itself by the caller/orchestrator
- `LAMATIC_API_URL` — Base URL for Lamatic API access when invoking the flow — used by the caller/orchestrator, not an individual node inside the flow definition
- `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated invocation — used by the caller/orchestrator, not an individual node inside the flow definition
- `LAMATIC_API_KEY` — Credential for calling Lamatic-hosted flows — used by the caller/orchestrator, not an individual node inside the flow definition

The flow source itself does not reference environment variables directly inside node configs. Runtime access is mediated by Lamatic deployment and by the external application that calls this flow.

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the inbound flow invocation. In this flow, that request is expected to carry the original `query` and the assembled `research` array produced by earlier stages of the Deep Research process.
2. `Generate Text` (`LLMNode`) takes the incoming request data and runs the final synthesis prompt stack. It uses the shared system prompt in `generate_text_system` plus the flow-specific user prompt `agentic_reasoning_final_generate_text_user`, along with the configured `generativeModelName`, to convert the user question and research evidence into one final generated response.
3. `API Response` (`graphqlResponseNode`) returns the output to the caller. Its output mapping exposes `LLMNode_168.output.generatedResponse` as the single response field `answer`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow invocation fails before generation starts | Lamatic API credentials or project configuration are missing or invalid in the calling application | Verify `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY`, and confirm the deployed flow ID in `AGENTIC_REASONING_FINAL` is correct. |
| The flow returns a weak, generic, or incomplete `answer` | Upstream `research` was sparse, irrelevant, duplicated, or not aligned to the current `query` | Re-run upstream retrieval with a better plan or cleaner evidence set, then invoke this flow again with higher-quality research artifacts. |
| The model produces an answer unrelated to the user request | `query` was malformed, empty, or mismatched with the supplied `research` payload | Ensure the original user question is passed exactly and that the `research` array corresponds to that same query. |
| Invocation succeeds but the answer is empty or low quality | The selected `generativeModelName` is unavailable, misconfigured, or unsuitable for synthesis | Confirm the configured model is valid in Lamatic, available to the project, and appropriate for text generation. |
| The flow cannot produce a grounded answer | Upstream retrieval flows did not run, or their outputs were not assembled into `research` before invocation | Execute the retrieval stage first and pass the resulting evidence into this flow. |
| Response shape is missing expected content besides `answer` | Caller expects structured citations, steps, or metadata that this flow does not return | Update the caller to consume only `answer`, or extend the flow if richer structured output is required. |
| Generation errors occur intermittently | Runtime model/provider instability or oversized input context | Retry with the same payload, reduce the size of `research`, or choose a model with larger context capacity. |

## Notes
- This flow is intentionally narrow: it performs synthesis only and delegates planning and retrieval to sibling flows.
- The flow has no explicit conditional branches, tool calls, retries, or fallback logic. Execution is strictly linear from request to generation to response.
- Prompt behavior is split across a shared system prompt and a flow-specific user prompt, so changes to final-answer style or grounding behavior may come from either prompt asset rather than from the node wiring alone.
- The `research` payload can include heterogeneous result objects. Because the flow relies on prompt-driven synthesis rather than schema enforcement, consistency and relevance of upstream evidence strongly affect output quality.
- The `API Response` node maps only one field. If future consumers need citations, confidence, or structured sections, the response mapping and likely the prompt design will need to be expanded.