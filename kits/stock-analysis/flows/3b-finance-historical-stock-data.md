# 3B. Finance - Historical Stock Data
A flow that retrieves one year of end-of-day historical stock prices for a list of companies and returns the data in a collated structure for downstream financial analysis.

## Purpose
This flow is responsible for the historical market-data retrieval stage of the finance agent kit. Given a list of stock symbols, it computes a starting date roughly one year in the past, calls an external market data API for each symbol, and organizes the returned end-of-day price history into a single response payload. Its job is narrow and operational: fetch price history reliably enough that later analysis steps do not need to know anything about the external data provider or per-symbol request mechanics.

The outcome is a structured `historic_data` payload containing historical stock-price data grouped and collated across the requested companies. This matters because downstream analysis needs comparable time-series data to support charting, performance comparisons, volatility inspection, and broader stock research experiences. By isolating this retrieval step into its own flow, the wider system can request historical pricing only when needed rather than always paying the cost of this API fan-out.

Within the broader agent pipeline, this flow sits in the retrieval layer after candidate companies have already been selected or otherwise provided by the caller. In the kit-level architecture, it is one of the focused enrichment flows alongside company profiles, fundamentals, and sentiment. Its output is intended to feed higher-order orchestration, especially the `3D. Finance - Analysis` flow, which conditionally runs subflows like this one and synthesizes their outputs into a unified analysis object.

## When To Use
- Use when the caller already has a list of company tickers and needs one-year historical stock-price data for charting or analysis.
- Use when downstream logic needs end-of-day price history rather than only current quotes or static company metadata.
- Use when the orchestration layer is preparing inputs for a broader stock-analysis step such as `3D. Finance - Analysis`.
- Use when a UI or backend needs a single API call that fans out across multiple companies and returns their historical data in one payload.
- Use when comparing recent market performance across several public companies over an approximately one-year window.

## When Not To Use
- Do not use when the caller needs stock selection or ticker discovery; that belongs to `1. Finance - Select Stocks`.
- Do not use when the caller needs company profile, business description, or fundamentals rather than historical price series; sibling finance flows handle those concerns.
- Do not use when the request does not provide a `companies` list at the trigger, because this flow iterates over that list and has no internal symbol-discovery step.
- Do not use when the target securities are not public equities supported by the external Financial Modeling Prep endpoint.
- Do not use when only sentiment or recent public-news signals are needed; that should route to the sentiment-focused sibling flow instead.
- Do not use when the caller requires a fully synthesized investment analysis rather than raw retrieval output; use the orchestration flow that chains this one with other enrichments.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `companies` | `string[]` | Yes | List of stock ticker symbols to fetch historical end-of-day pricing for. Each item is consumed one at a time by the loop node and inserted into the external API request as `symbol`. |

The trigger is an API request via a `graphqlNode`, and the flow assumes the incoming payload exposes `triggerNode_1.output.companies`. No explicit schema is declared in the flow, so validation is mostly implicit. In practice, `companies` should be a non-empty list of valid public-market ticker symbols accepted by Financial Modeling Prep.

The flow is configured to iterate over a list and includes an `endValue` of `10`, but the actual loop source is `iterateOver: list` using the provided `companies` array. Callers should still keep the list reasonably bounded to avoid long runtimes or provider throttling.

## Outputs
| Field | Type | Description |
|---|---|---|
| `historic_data` | `object` | Collated historical stock data produced by the `Collate Results` code node after all per-company fetches have completed. |

The response is JSON with a single top-level field, `historic_data`. Internally, that field is built from grouped per-symbol API results, so callers should expect a structured object or collection rather than prose. The exact internal shape is defined by the referenced code scripts, but the flow clearly returns the combined result of all loop iterations rather than raw provider responses one by one.

Completeness depends on external API success for each symbol. If one or more symbols return empty or partial results, the final `historic_data` payload may contain uneven coverage across companies unless the collation script explicitly normalizes or filters those cases.

## Dependencies
### Upstream Flows
- This is not a strict entry-point flow, but it does not require another Lamatic flow to execute first if the caller can directly provide `companies` at the trigger.
- In the broader kit, it commonly follows `1. Finance - Select Stocks` or another selection/orchestration step that has already produced a list of ticker symbols.
- When chained from a parent orchestration flow such as `3D. Finance - Analysis`, the upstream component must provide a company-symbol list equivalent to this flow's required `companies` input.

### Downstream Flows
- `3D. Finance - Analysis` — consumes this flow's `historic_data` output as part of the multi-source dataset it aggregates before generating a unified analysis result.
- Any UI-layer or backend orchestration component can also consume `historic_data` directly for chart rendering, comparative tables, or additional quantitative processing.

### External Services
- Financial Modeling Prep historical price API — retrieves full end-of-day historical prices for each ticker over the requested date range — credential used: `FMP_API_KEY`

### Environment Variables
- `FMP_API_KEY` — API key for Financial Modeling Prep historical-price requests — used by the `Variables` node and injected into `Fetch Stock Price`

## Node Walkthrough
1. `API Request` (`graphqlNode` trigger) receives the incoming API call and exposes the request payload to the rest of the flow. The critical runtime input is `companies`, which this flow expects to be a list of ticker symbols.

2. `Variables` (`variablesNode`) defines flow-scoped variables, most importantly `FMP_API_KEY`. In this flow, the key is mapped into the runtime context so later nodes can authenticate against the Financial Modeling Prep endpoint.

3. `One Year Ago Date` (`codeNode`) runs a helper script that computes the start date for the historical retrieval window. Its output is later inserted into the `from` query parameter of the stock-price API request.

4. `Fetch Stock Data` (`forLoopNode`) begins iterating over `{{triggerNode_1.output.companies}}`. On each pass, it exposes the current ticker as `currentValue`, allowing downstream nodes inside the loop to issue one request per company.

5. `Fetch Stock Price` (`apiNode`) calls Financial Modeling Prep with a `GET` request to the historical end-of-day price endpoint. The request includes the current loop symbol, the computed one-year-ago start date, a fixed `to` date of `2024-11-1`, and the API key from `Variables`.

6. `Group Data` (`codeNode`) processes the response for the current company. Based on its position in the loop, this script likely reshapes the raw API payload into a normalized per-symbol structure that is easier to accumulate across iterations.

7. `Fetch Stock Data End` (`forLoopEndNode`) closes the iteration cycle, passes loop-state data forward, and routes control back to the loop until all companies have been processed.

8. `Collate Results` (`codeNode`) runs after the loop completes. It takes the grouped outputs produced across all iterations and combines them into the final `historic_data` structure returned by the flow.

9. `API Response` (`graphqlResponseNode`) returns a JSON response whose output mapping exposes `{{codeNode_387.output}}` as `historic_data`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Response contains an error from the external API or no data is returned for all symbols | `FMP_API_KEY` is missing, invalid, expired, or rate-limited | Verify the Financial Modeling Prep credential, rotate it if needed, and ensure the runtime environment provides a valid `FMP_API_KEY` value to the flow |
| Flow returns empty or near-empty `historic_data` | The `companies` input is missing, empty, or contains unsupported ticker symbols | Pass a non-empty `companies` array of valid public-market ticker symbols and confirm the upstream selector produced clean symbols |
| Only some companies appear in the final result | One or more per-symbol API calls failed or returned no historical records | Inspect the problematic symbols individually, retry with valid supported tickers, and add upstream filtering or retry logic if partial results are unacceptable |
| Historical window looks wrong or incomplete | The computed `from` date or the fixed `to` date does not match the intended analysis range | Review the `One Year Ago Date` script and confirm whether the hard-coded `to=2024-11-1` date is still appropriate for the deployment |
| Downstream orchestration fails to use the result | The caller expected a different output field name or structure | Consume the top-level response field `historic_data` and align downstream parsers with the collation script's actual object shape |
| Flow is invoked but produces no meaningful output in a chained run | An upstream flow that should have produced company symbols did not run or did not map its output into `companies` | Ensure the chaining layer passes the upstream ticker list into this flow's trigger payload under `companies` |
| Requests fail intermittently under larger batches | Multiple symbols are being fetched sequentially and the external provider may throttle or return transient failures | Keep the ticker list reasonably small, introduce batching or retries in a future revision, and monitor provider rate limits |

## Notes
- The flow hard-codes the API `to` date as `2024-11-1` rather than computing it dynamically at runtime. That means the effective retrieval window is not truly “last one year from today” unless the deployment date happens to align with that endpoint parameter.
- Although the flow computes a start date dynamically, the fixed end date may become stale over time and should be reviewed if this flow is meant for ongoing production use.
- The `Variables` node contains a concrete API-key value in the source provided. In production documentation and operations, treat this as a credential that should be externalized and rotated rather than embedded in flow code.
- No explicit retries are configured on the historical-price API node, so transient upstream failures will pass through unless handled by the provider, scripts, or caller.
- The trigger schema is not formally declared in the flow metadata. If this flow is exposed to multiple clients, it is worth documenting or enforcing the expected GraphQL request shape at the platform boundary.