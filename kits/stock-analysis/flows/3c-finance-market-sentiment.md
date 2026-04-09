# 3C. Finance - Market Sentiment
This flow gathers recent public-market sentiment signals for a list of companies by combining news search results and social-data enrichment, then returns a collated sentiment dataset for downstream financial analysis.

## Purpose
This flow is responsible for the sentiment-gathering sub-task in the finance agent kit. Given a set of company identifiers supplied at invocation time, it iterates through each company, searches for recent news coverage, enriches that company-level result with additional social or public-discussion data via a script, and then consolidates the per-company outputs into a single response payload. Its job is not to perform valuation, ranking, or narrative analysis; it focuses on assembling raw sentiment-oriented evidence that can be consumed elsewhere.

The outcome is a structured `sentiment_data` payload spanning the requested companies. That output matters because the broader finance pipeline is designed to produce a multi-dimensional view of public companies: profile data, fundamentals, price history, and sentiment. Without this flow, the overall system would lack a current external-signals layer that reflects recent news and public discourse.

In the wider chain, this flow sits in the retrieval and enrichment stage. It is one of the focused data-collection flows used by the broader finance kit before synthesis occurs in `3D. Finance - Analysis`. Upstream components or callers decide which companies should be analysed; this flow then retrieves sentiment-oriented evidence for those companies so that downstream orchestration or analysis steps can incorporate market mood alongside fundamentals and historical performance.

## When To Use
- Use when the caller already has a list of companies and needs recent external sentiment signals for each one.
- Use when the user asks for market mood, news tone, public buzz, or sentiment context around one or more public companies.
- Use when the downstream analysis needs a sentiment input to complement company profiles, fundamentals, or pricing data.
- Use when current public information is required and web-search-based retrieval is acceptable.
- Use when an orchestration flow such as `3D. Finance - Analysis` needs a sentiment subflow to populate its aggregated company research payload.

## When Not To Use
- Do not use when the caller needs company profile metadata, fundamentals, or historical price series; those are handled by sibling finance flows.
- Do not use when no company list is available at trigger time; this flow expects `companies` to already be present in the request.
- Do not use when the target entities are not public companies or cannot be meaningfully searched as market subjects.
- Do not use when a user only wants stock selection or candidate discovery; that belongs to `1. Finance - Select Stocks`.
- Do not use when the required output is a synthesized investment view rather than raw or collated sentiment evidence; that belongs downstream in `3D. Finance - Analysis`.
- Do not use when Serper credentials are not configured, because the web-search stage is mandatory for this flow.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `companies` | `array` | Yes | The list of companies to process. Each item is iterated over by the loop node and used as the web search query basis for sentiment retrieval. |
| `credentials` | `select` | Yes | Serper authentication credentials supplied to the `Web Search` node for access to Google News search results. |

Below the table, the main runtime input is `triggerNode_1.output.companies`, which the flow assumes is a list-like value suitable for iteration. The flow does not expose an internal schema for each company entry in the TypeScript metadata, so in practice each item should be a searchable company identifier such as a company name or ticker-like string that can be passed directly into the news query. The loop is configured with an `endValue` of `10`, but it also iterates over the provided list; callers should still keep requests reasonably bounded for latency and search-cost reasons.

## Outputs
| Field | Type | Description |
|---|---|---|
| `sentiment_data` | `object` | The collated output produced by the `Collate Results` script after all company iterations complete. |

Below the table, the response is returned as JSON with `content-type` set to `application/json`. The `sentiment_data` field is whatever structured object the final collation script emits; based on the node sequence, it should represent an aggregate of per-company news and social-signal results rather than a free-form paragraph. The exact subfields are script-defined, so callers should treat this as structured sentiment output whose completeness depends on how many companies produced usable search and social data.

## Dependencies
### Upstream Flows
- This is not a standalone discovery flow in practice; it expects a caller or upstream flow to provide `companies` at invocation time.
- In the broader kit, likely upstream producers include flows that identify or normalize company targets, such as `1. Finance - Select Stocks` or `2. Finance - Company Profiles`, depending on how the orchestration layer is assembled.
- The specific upstream data this flow consumes is the trigger payload field exposed as `triggerNode_1.output.companies`.

### Downstream Flows
- `3D. Finance - Analysis` is the primary downstream consumer in the parent agent architecture.
- That downstream flow consumes this flow's `sentiment_data` output as one component of its aggregated company-research payload before LLM-based synthesis.
- Any UI or backend service can also consume `sentiment_data` directly if it wants sentiment-only results without full analysis.

### External Services
- Serper Google News API — used to fetch recent news results for each company via the `Web Search` node — required credential: `credentials` on `webSearchNode_818`
- Custom Lamatic code script `@scripts/3c-finance-market-sentiment_fetch-socials.ts` — used to enrich each company with social or public-discussion data in `Fetch Socials` — required credential or environment variable: none explicitly declared in this flow
- Custom Lamatic code script `@scripts/3c-finance-market-sentiment_collate-results.ts` — used to aggregate all loop outputs into a single response object in `Collate Results` — required credential or environment variable: none explicitly declared in this flow

### Environment Variables
- `FMP_API_KEY` — stored by the `Variables` node for runtime use by downstream logic or scripts; likely intended for financial-data-related enrichment even though it is not directly referenced by a native API node in this flow — used inside `Variables`

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the incoming API call and exposes the request payload to the flow. The critical input for this flow is the company list, which becomes available as `triggerNode_1.output.companies` for downstream iteration.
2. `Variables` (`variablesNode`) injects the runtime variable mapping for `FMP_API_KEY`. This prepares environment-style configuration for any downstream script logic that may rely on financial market data access during sentiment enrichment.
3. `Fetch Market Sentiment Data` (`forLoopNode`) starts iterating over the provided `companies` list. On each pass, it places the current company item into `forLoopNode_939.output.currentValue`, which becomes the company-specific input for retrieval.
4. `Web Search` (`webSearchNode`) queries Serper's Google News endpoint once per company using the current loop value as the search query. It is configured to fetch up to `30` news results from the past month via the `qdr:m` date range, producing a recent-news signal for that company.
5. `Fetch Socials` (`codeNode`) runs the `3c-finance-market-sentiment_fetch-socials.ts` script after the news search completes for the current company. This script is the custom enrichment stage that combines or supplements the news results with social or public-conversation sentiment data.
6. `Fetch Market Sentiment Data End` (`forLoopEndNode`) closes the current iteration and feeds control back to the loop until all companies have been processed. Its purpose is to accumulate the per-company outputs from the loop body before final collation.
7. `Collate Results` (`codeNode`) runs the `3c-finance-market-sentiment_collate-results.ts` script after the loop finishes. This step consolidates the collected per-company sentiment artifacts into one structured output object.
8. `API Response` (`graphqlResponseNode`) returns a JSON response to the caller with a single top-level field, `sentiment_data`, mapped directly from `codeNode_387.output`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request fails at or before web search | Serper `credentials` were not configured or are invalid | Provide valid Serper credentials for `webSearchNode_818` and verify the selected credential has access to the news endpoint |
| Response contains empty or sparse sentiment data | `companies` was empty, malformed, or contained non-searchable values | Ensure `companies` is a non-empty list of recognizable company names or ticker-like identifiers |
| Only some companies appear in the final result | One or more loop iterations returned no news or the enrichment script could not produce output for certain items | Validate the company list, inspect script handling for missing search results, and add fallback logic if partial results are acceptable |
| Flow returns little or no recent-news context | The news query for a company did not match current coverage within the past month | Retry with clearer company names, include disambiguating identifiers, or broaden the search approach in the flow configuration |
| Flow errors inside `Fetch Socials` | The custom social-enrichment script encountered unexpected input or an external dependency issue | Review the script's expected input shape from `Web Search`, harden null handling, and confirm any hidden external calls made by the script |
| Flow errors in `Collate Results` | Aggregation logic did not handle the loop output shape or empty iterations correctly | Update the collation script to tolerate partial and empty iteration outputs and verify the loop-collection structure |
| Invocation is impossible from a chained workflow | An upstream flow did not run, or it failed to supply `companies` into this flow's trigger payload | Ensure the orchestrating flow passes the company list explicitly and validate the field mapping before invocation |
| Unexpected authentication or data-access failures inside scripts | Runtime variables such as `FMP_API_KEY` are missing, invalid, or not consumed as expected by the script code | Verify the variable value, remove hard-coded secrets from source where possible, and align script environment access with the `Variables` node mapping |

## Notes
- The flow metadata does not define a trigger schema beyond runtime access to `companies`, so callers should standardize their own request contract and keep it stable across orchestrated invocations.
- The `Variables` node contains a concrete `FMP_API_KEY` value in source. From an operational and security standpoint, this should be migrated to secure secret management rather than remaining embedded in flow code.
- The search window is limited to roughly the last month via `qdr:m`, which makes the flow better suited to current sentiment snapshots than long-horizon reputation analysis.
- The `Web Search` node requests up to `30` results per company. Combined with looping over multiple companies, this can materially affect latency and external API usage.
- The exact schema of `sentiment_data` is determined by the referenced scripts, so any consumer that needs strict field contracts should version and document those script outputs alongside this flow.