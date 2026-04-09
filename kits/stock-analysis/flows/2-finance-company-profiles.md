# 2. Finance - Company Profiles
A flow that fetches baseline company profile data for a list of stock tickers and returns a collated profile set used by downstream finance analysis flows.

## Purpose
This flow is responsible for retrieving standardized company profile information for one or more public companies identified elsewhere in the finance agent system. Its core job is to take a caller-provided list of ticker symbols, call the Financial Modeling Prep profile endpoint for each symbol, validate each per-company response, and assemble the results into a single API payload. This solves the sub-task of turning lightweight identifiers such as stock symbols into richer reference data that downstream components can reason over.

The outcome of a successful run is a `profiles` response field containing the aggregated results of all profile fetches performed in the loop. That output matters because profile data provides the baseline identity and business context for each company before deeper retrieval steps are attempted. In the wider pipeline, this gives operators and downstream orchestration logic a clean, structured set of company-level records to display directly or combine with fundamentals, pricing history, and sentiment data.

Within the broader kit, this flow sits in the retrieval layer of the pipeline. It is typically invoked after candidate companies have already been selected or supplied by a caller, and before a higher-level synthesis step such as `3D. Finance - Analysis` combines multiple datasets into a unified analysis response. It is therefore best understood as a focused enrichment flow: it does not choose stocks and it does not generate final investment analysis, but it provides a necessary intermediate dataset for both UI rendering and subsequent chained execution.

## When To Use
- Use when you already have one or more valid public stock ticker symbols and need company identity or descriptive profile data for them.
- Use when a UI or backend wants to display company overview cards, profile summaries, or issuer metadata before deeper financial analysis.
- Use when an orchestration layer needs baseline company records to accompany outputs from fundamentals, price history, or sentiment flows.
- Use when the broader finance pipeline has selected candidate stocks and the next step is to enrich those symbols with company profile information.
- Use when a caller wants a single batched response for multiple tickers rather than issuing one external API request per ticker itself.

## When Not To Use
- Do not use when the caller does not yet know which companies to inspect; use the stock-selection flow first to identify candidate tickers.
- Do not use when the requested task is deep financial statement retrieval, historical pricing, or market sentiment collection; sibling flows in the kit handle those domains.
- Do not use when the trigger payload does not contain a `companies` list or contains values that are not valid ticker symbols.
- Do not use when you need synthesized analysis or cross-dataset reasoning; that belongs in the higher-level orchestration and analysis flow.
- Do not use for private companies or non-public entities that are not covered by the Financial Modeling Prep profile endpoint.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `companies` | `string[]` | Yes | The list of company ticker symbols to process. Each element is iterated over by the loop and used as the `symbol` query parameter for the profile API call. |

The trigger node does not declare a static input schema, but the flow logic assumes the request exposes `triggerNode_1.output.companies`. In practice, this means callers must supply a list-like `companies` field at invocation time. Each item should be a valid market ticker symbol string. The loop is configured with an `endValue` of `10`, which suggests the flow is intended for relatively small batches; callers should avoid oversized lists unless they have verified runtime behavior in their environment.

## Outputs
| Field | Type | Description |
|---|---|---|
| `profiles` | `array` | The collated output produced by the `Collate Results` code node after all per-company profile fetches and validation steps complete. |

The response is returned as JSON with a top-level `profiles` field. That field contains the aggregated result set assembled after the loop finishes. The exact object shape of each profile record is determined by the external API response and the internal `Check Data` and `Collate Results` scripts, so callers should treat it as structured profile data rather than free text. Completeness depends on the availability of profile data for each requested ticker; invalid symbols or empty upstream API responses may lead to missing or filtered entries.

## Dependencies
### Upstream Flows
- This flow is not a mandatory entry-point flow in the broader kit, but it commonly depends on a prior stock-selection step having already identified candidate ticker symbols.
- Most commonly, `1. Finance - Select Stocks` may run before this flow and produce a usable company or ticker list that a caller maps into this flow's `companies` input.
- The required upstream artifact is a list of ticker symbols. This flow consumes that data through the trigger-exposed field `companies`.

### Downstream Flows
- `3D. Finance - Analysis` can consume this flow's output as part of its multi-flow aggregation stage.
- The downstream field of interest is `profiles`, which provides company-level baseline records to combine with fundamentals, price history, and sentiment outputs.
- UI layers or backend orchestration services may also consume `profiles` directly to render company overview information without invoking later analysis steps.

### External Services
- Financial Modeling Prep Profile API — used to fetch company profile data for each ticker symbol — required credential: `FMP_API_KEY`

### Environment Variables
- `FMP_API_KEY` — API key used to authenticate requests to Financial Modeling Prep — used by the `Variables` node and injected into the `Fetch Profile` node URL

## Node Walkthrough
1. `API Request` (`graphqlNode` trigger) receives the incoming API invocation and exposes request data to the rest of the flow. This flow specifically expects the trigger payload to provide `companies`, which is the ticker list that drives the loop.

2. `Variables` (`variablesNode`) defines runtime variables used downstream. In this flow it supplies `FMP_API_KEY`, which is then referenced when constructing the outbound Financial Modeling Prep request URL.

3. `Company Profiles Fetch` (`forLoopNode`) begins iterating over `{{triggerNode_1.output.companies}}`. On each pass, the current ticker is exposed as `currentValue`, allowing the flow to perform one profile lookup per company.

4. `Fetch Profile` (`apiNode`) issues a `GET` request to the Financial Modeling Prep stable profile endpoint using the current loop item as the `symbol` query parameter and `{{variablesNode_903.output.FMP_API_KEY}}` as the `apikey`. This is the core external retrieval step of the flow.

5. `Check Data` (`codeNode`) runs the script `@scripts/2-finance-company-profiles_check-data.ts` against each API response. Its role is to validate, normalize, or otherwise inspect the returned profile payload before the loop advances. This helps ensure that bad, empty, or malformed per-company responses are handled consistently.

6. `Company Profiles Fetch End` (`forLoopEndNode`) closes the current iteration and manages loop progression. Once all companies have been processed, execution exits the loop and moves to the aggregation stage.

7. `Collate Results` (`codeNode`) runs the script `@scripts/2-finance-company-profiles_collate-results.ts` after the loop finishes. It gathers the iteration-level outputs into one consolidated result suitable for a single API response.

8. `API Response` (`graphqlResponseNode`) returns the final JSON payload. Its output mapping places the result of `Collate Results` into the top-level response field `profiles`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Response contains no `profiles` entries or an empty list | The `companies` input was empty, missing, or contained only invalid ticker symbols | Ensure the trigger payload includes a non-empty `companies` array with valid public ticker strings |
| External API calls fail or return authorization errors | `FMP_API_KEY` is missing, invalid, expired, or misconfigured | Configure a valid `FMP_API_KEY` and verify that the `Variables` node is supplying the correct value to `Fetch Profile` |
| Some companies are missing from the final response | The profile endpoint returned empty data for specific tickers, or the `Check Data` script filtered invalid results | Verify ticker correctness, inspect per-symbol API responses, and review the validation logic in `2-finance-company-profiles_check-data.ts` |
| Flow fails before any retrieval occurs | The caller sent malformed input and `triggerNode_1.output.companies` is not iterable as a list | Pass `companies` as an array of strings rather than a single string or nested object |
| The flow runs but downstream analysis lacks company context | An upstream selector flow did not run, or its output was not mapped into this flow correctly | Run the stock-selection step first when needed and explicitly map its ticker output into this flow's `companies` input |
| Requests succeed but throughput is slower than expected for larger batches | The flow performs one external request per ticker in a loop | Keep batches modest, split large company sets across multiple invocations, or optimize orchestration at a higher level |

## Notes
- The flow metadata does not provide a description, static test input, or formal trigger schema, so the operational contract is inferred from node wiring rather than explicit declarations.
- Although `FMP_API_KEY` behaves like a credential, in the current flow source it is embedded in the `Variables` node rather than referenced from a secure secret store. **This should be treated as a security concern** and moved to proper environment or secret management for production use.
- The behavior and final record shape are partly determined by the scripts `2-finance-company-profiles_check-data.ts` and `2-finance-company-profiles_collate-results.ts`. If those scripts change, the effective validation and output contract of this flow may change as well.
- The loop configuration indicates list iteration with an `endValue` of `10`. Even if runtime iteration is governed primarily by the list length, this flow is clearly designed around small bounded batches rather than bulk ingestion.
- This flow performs retrieval and aggregation only. It does not apply LLM reasoning, ranking, or narrative synthesis.