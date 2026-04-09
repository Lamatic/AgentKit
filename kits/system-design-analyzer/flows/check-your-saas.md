# Check Your Saas
A multi-agent Lamatic flow that turns a raw system design description into structured architectural critique and serves as the primary analysis pipeline in the wider System Design Analyzer kit.

## Purpose
This flow is responsible for analyzing an unstructured `system_design` submission and converting it into actionable system design feedback. It does this by first cleaning and characterizing the input, then splitting the review task across several specialist agents focused on performance, reliability, consistency, security, and cost. That decomposition allows the flow to inspect the same architecture from multiple engineering angles instead of relying on a single undifferentiated model response.

The outcome is a concise API response containing `issues`, `recommendations`, and a `summary`. Those outputs matter because they are the consumable result exposed to the UI and any external caller: a developer can quickly see the most critical architectural risks, the highest-value next steps, and an overall narrative judgment without needing to inspect intermediate agent outputs.

Within the broader agent pipeline described by the parent agent, this flow is the entry-point and end-to-end orchestration layer rather than one stage in a longer chained sequence. It combines a classify-parse-review-synthesize pattern: the `System Classifier` establishes context, the `Component Parser` extracts structure, specialist review agents reason over that context, and the `Judge Agent` synthesizes the final report. In other words, this flow contains the full analysis chain internally and is typically invoked directly by the web app or another backend client.

## When To Use
- Use when a caller has a prose system design proposal and needs immediate architectural feedback.
- Use when the input is a single `system_design` string describing services, data stores, traffic patterns, constraints, or requirements.
- Use when you want category-aware critique across performance, reliability, consistency, security, and cost in one request.
- Use when preparing for a system design interview and you want fast feedback on likely weaknesses in a proposed architecture.
- Use when reviewing an early-stage architecture draft and a lightweight AI review is sufficient before human review.
- Use when the invoking application expects the canonical response fields `issues`, `recommendations`, and `summary`.

## When Not To Use
- Do not use when the input is not a system design description, such as source code, logs, tickets, or tabular metrics.
- Do not use when `system_design` is missing, empty, or effectively meaningless, because downstream agents depend on descriptive architectural context.
- Do not use when you require retrieval from live infrastructure, observability systems, or internal architecture repositories; this flow reasons only over the submitted text.
- Do not use when you need deterministic formal validation of architecture diagrams or schemas; this flow is LLM-driven and interpretive.
- Do not use when Lamatic project credentials or configured LLM models are unavailable, because every analysis stage depends on model execution.
- Do not use a different sibling flow instead for this kit, because the provided kit documentation and parent agent describe this as the primary and effectively sole analysis flow.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `system_design` | `string` | Yes | Free-form system design specification submitted through the GraphQL trigger. |

The trigger schema expects a JSON object with a single `system_design` field of type `string`. The flow assumes the text is substantial enough to infer architecture, constraints, and tradeoffs. There is no explicit length validation in the flow source, but very short, vague, or malformed submissions will reduce output quality and may lead to sparse findings. The flow appears designed for English prose, though nothing in the schema hard-enforces language.

## Outputs
| Field | Type | Description |
|---|---|---|
| `issues` | `string[]` | Consolidated list of critical issues identified by the `Judge Agent`. |
| `recommendations` | `string[]` | Consolidated list of top recommendations produced by the `Judge Agent`. |
| `summary` | `string` | Short synthesized narrative summarizing the architecture assessment. |

The API response is a compact JSON object assembled directly from the `Judge Agent` output. `issues` and `recommendations` are lists of text items, while `summary` is a prose string. The final response exposes only the synthesized result, not intermediate classifications, parsed components, or per-domain agent findings. Completeness depends on the quality of the submitted design and the model outputs; if the design lacks detail, the returned recommendations may be high-level rather than implementation-specific.

## Dependencies
### Upstream Flows
This is a standalone entry-point flow. No separate upstream Lamatic flow must run before it.

In the broader kit, it is typically invoked directly by the Next.js UI or any backend service that can call the Lamatic GraphQL endpoint. The caller must provide the raw `system_design` text; there are no consumed outputs from another flow.

### Downstream Flows
No downstream Lamatic flow is described as consuming this flow's output. This flow is the terminal analysis pipeline for the kit.

Its response fields `issues`, `recommendations`, and `summary` are consumed by client applications such as the included web UI, which presents them to end users.

### External Services
- Lamatic GraphQL flow endpoint — receives the inbound request and returns the final response — requires Lamatic project endpoint configuration and API access in the invoking client
- Configured LLM provider via Lamatic model configs — powers the `System Classifier`, `Component Parser`, all specialist agents, and the `Judge Agent` — requires a model configured in the Lamatic project for each node's `generativeModelName`
- Lamatic orchestration runtime — executes the code node, prompt routing, node dependencies, and response mapping — requires Lamatic project and runtime availability

### Environment Variables
- `LAMATIC_API_KEY` — authenticates client calls into the Lamatic project endpoint — used by the external caller that invokes the flow, not by an individual in-flow node
- `LAMATIC_PROJECT_ID` — identifies the target Lamatic project hosting this flow — used by the external caller that invokes the flow, not by an individual in-flow node
- `LAMATIC_API_ENDPOINT` — points the client to the correct Lamatic GraphQL/API base URL — used by the external caller that invokes the flow, not by an individual in-flow node

## Node Walkthrough
1. `API Request` (`graphqlNode`)
   - This trigger starts the flow when a caller submits a GraphQL request containing `system_design`.
   - Its declared input schema expects a realtime request body with `system_design` as a string.
   - It does not transform the payload itself; it serves as the entry point that makes the design text available to downstream nodes.

2. `Clean & Extract Metadata` (`codeNode`)
   - This code step runs the referenced script `@scripts/check-your-saas_clean-extract-metadata.ts`.
   - It cleans or normalizes the incoming design text and emits structured metadata including `design`, `line_count`, `word_count`, `mentions_geo`, `has_scale_numbers`, `mentions_realtime`, and `mentions_financial`.
   - These derived fields help downstream model prompts reason from a cleaner representation and infer whether the design implies scale, geographic distribution, realtime behavior, or financial sensitivity.

3. `System Classifier` (`LLMNode`)
   - This node reads the preprocessed design and classifies the architecture at a high level.
   - It produces structured fields including `primary_domain`, `scale_tier`, `consistency_requirement`, `latency_sensitivity`, `availability_requirement`, `key_constraints`, and `architectural_style`.
   - Its role is to establish operating context for the rest of the pipeline so later agents can judge the design relative to the right constraints rather than in the abstract.

4. `Component Parser` (`LLMNode`)
   - This node also consumes the preprocessed design and extracts a structural view of the system.
   - It returns `components`, `data_flow`, `critical_paths`, `failure_domains`, and `explicit_gaps`.
   - This parsed inventory gives downstream specialists a more explicit representation of what exists in the architecture, how data moves, and where failures may concentrate.

5. `Performance Agent` (`LLMNode`)
   - This specialist agent receives context from both the `System Classifier` and `Component Parser`.
   - It evaluates likely throughput and latency weaknesses and returns a `bottlenecks` array.
   - The focus is not on generic tuning advice but on identifying where the described architecture is likely to slow down under expected load or traffic patterns.

6. `Reliability Agent` (`LLMNode`)
   - This agent also depends on the classifier and parsed component view.
   - It examines resilience and fault tolerance characteristics and returns `failure_scenarios`.
   - The result is a list of plausible ways the system could degrade or fail based on the submitted design, such as single points of failure or insufficient recovery paths.

7. `Consistency Agent` (`LLMNode`)
   - This agent reviews the same classified and parsed context through a data consistency lens.
   - It returns `consistency_issues`.
   - It is intended to surface mismatches between business requirements and the implied consistency model, replication behavior, write/read patterns, or coordination approach.

8. `Security Agent` (`LLMNode`)
   - This agent inspects the design for architecture-level security concerns.
   - It returns `security_risks` based on the system context and component breakdown.
   - Findings are likely to reflect missing trust boundaries, sensitive data handling concerns, insecure interfaces, or weak isolation assumptions inferred from the design text.

9. `Cost Agent` (`LLMNode`)
   - This agent focuses on operational and architectural cost implications.
   - It returns `cost_issues`.
   - The analysis looks for expensive architectural choices, overprovisioning risk, wasteful data movement, or scaling patterns that may drive cost disproportionately.

10. `Judge Agent` (`InstructorLLMNode`)
   - This synthesis node aggregates outputs from the `System Classifier`, `Performance Agent`, `Reliability Agent`, `Consistency Agent`, `Security Agent`, and `Cost Agent`.
   - It produces the final structured judgment: `critical_issues`, `top_recommendations`, and `summary`.
   - Unlike the specialist agents, its job is to prioritize and consolidate, deciding which findings matter most and converting many partial analyses into a single report suitable for direct API consumption.

11. `API Response` (`graphqlResponseNode`)
   - This final node maps the `Judge Agent` output into the external response contract.
   - `issues` is populated from `judge_agent.output.critical_issues`.
   - `recommendations` is populated from `judge_agent.output.top_recommendations`.
   - `summary` is populated from `judge_agent.output.summary`.
   - The response is returned as JSON with `content-type` set to `application/json`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request fails before analysis starts | The Lamatic endpoint, project, or API credentials used by the caller are missing or invalid | Verify `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_ENDPOINT` in the invoking application and confirm the target project contains the `check-your-saas` flow |
| Flow runs but returns low-quality or empty-looking findings | The submitted `system_design` text is too short, too vague, or missing core architecture details | Provide a fuller description including components, traffic assumptions, data stores, failure handling, and major constraints |
| A node errors during execution | One or more model configs referenced by `generativeModelName` are not configured with a valid provider/model in Lamatic | Open the Lamatic project and verify all referenced model configs for `classifier`, `component_parser`, specialist agents, and `judge_agent` are bound to working models |
| Final response is missing some expected detail | Intermediate specialist agents produced sparse outputs because the input lacked domain, scale, or component clarity | Enrich the prompt input with workload profile, consistency expectations, availability requirements, geographic scope, and sensitive data context |
| Malformed input error at trigger | The caller did not send a JSON payload matching the trigger schema, especially `system_design` as a string | Send a properly structured GraphQL/API request with `system_design` present and typed as a string |
| Output is present but seems generic | The architecture description contains little differentiation, so classifier and parser stages cannot establish strong context | Include explicit technologies, user scale, bottlenecks of concern, critical paths, and business constraints |
| Invocation from another system assumes an upstream flow output | This flow is standalone, so no prior flow produced inputs for it | Route raw design text directly into this flow rather than attempting to pass references to nonexistent upstream outputs |
| Judge stage fails or returns incomplete synthesis | One or more upstream specialist nodes failed, timed out, or produced invalid structured output | Inspect node-level execution in Lamatic, confirm model compatibility with structured output, and retry with a clearer input or more reliable model configuration |

## Notes
- The flow's `meta.description` is empty, so operational understanding depends on node structure, prompt references, and kit documentation rather than embedded flow metadata.
- The `Judge Agent` uses `InstructorLLMNode`, indicating the final synthesis step is designed for stronger schema adherence than the earlier specialist nodes.
- Although the README mentions severity categorization and scoring at a product level, this specific flow response exposes only `issues`, `recommendations`, and `summary`; no score field is returned by the configured response node.
- The intermediate `Component Parser` output is not passed directly into the `Judge Agent` by edge, so its influence on the final result is indirect through the specialist agents that consume it.
- Because the flow is entirely text-reasoning based, it should be treated as an expert review aid rather than a substitute for architecture testing, load validation, threat modeling, or formal design review.