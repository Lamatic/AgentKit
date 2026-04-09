# 1. Embedded AI Sheets
A single entry-point spreadsheet AI flow that routes API requests into generation, summarisation, or categorisation, then writes the resulting value back to the target sheet cell and returns the same payload to the caller.

## Purpose
This flow is responsible for turning a spreadsheet-side AI action request into a completed cell update. It accepts a user instruction, the source spreadsheet context, a target location, and an operation selector in `aiType`, then chooses the correct AI branch to either generate new content, summarise existing content, or categorise it. The flow also normalises the branch-specific result into a single response shape so the spreadsheet application can handle all supported AI actions consistently.

The outcome is a final `value` plus identifying metadata for the target cell. That matters because the wider Embedded Sheets system is designed to let a spreadsheet UI invoke AI as an in-place transformation layer rather than as a separate chat workflow. This flow therefore does not just produce model output; it also packages the result for persistence and triggers a callback to update the relevant sheet cell.

Within the broader kit, this is the primary operational flow rather than a downstream helper. The parent agent describes the overall system as a single API-invoked Lamatic flow sitting behind a Next.js spreadsheet interface. In practical pipeline terms, this flow occupies the core synthesize-and-apply stage: the UI or backend gathers user intent and spreadsheet context, this flow performs the AI transformation and response finalisation, and the result is then posted back into the spreadsheet data plane.

## When To Use
- Use when the spreadsheet UI or backend needs to perform an AI action against a specific cell or row context and immediately persist the result back into the sheet.
- Use when `aiType` is `generate` and the request should create new content from an `instruction` and `data` payload.
- Use when `aiType` is `summarize` and the request should condense provided spreadsheet context into a shorter or reformatted output.
- Use when `aiType` is `categorize` and the request should assign labels, classes, or categories based on the provided `data` and `instruction`.
- Use when generation requests must branch further by `outputFormat`, specifically `text` versus `image`.
- Use when the caller can provide sheet targeting fields `sheetId`, `columnId`, and `rowId`, plus a callback `webhookUrl` that should receive the final result.
- Use as the main entry point for Embedded Sheets AI actions invoked over the Lamatic API request trigger.

## When Not To Use
- Do not use when the request is missing a valid `aiType`; unsupported values fall into the invalid-request path.
- Do not use when there is no target sheet location to update, unless the caller is intentionally using only the synchronous API response and is prepared for the internal update callback to fail.
- Do not use when `webhookUrl` is unavailable or invalid and downstream sheet persistence is required as part of the operation.
- Do not use when the action needed is outside the three supported modes: `generate`, `summarize`, or `categorize`.
- Do not use for retrieval-heavy tasks that require external search, document indexing, or multi-step planning; this flow is a direct transformation flow, not a retrieval orchestrator.
- Do not use when another system already owns post-processing and cell writeback and only raw model completions are needed; this flow is opinionated about finalising and posting the result.
- Do not use when model providers for the configured LLM nodes have not been set up in Lamatic, because every successful branch depends on a configured text-generation model.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `sheetId` | `string` | Yes | Identifier of the sheet that should receive the final AI result. |
| `columnId` | `string` | Yes | Identifier of the destination column for the update. |
| `rowId` | `string` | Yes | Identifier of the destination row for the update. |
| `instruction` | `string` | Yes | Natural-language instruction describing the requested AI operation or style. |
| `aiType` | `string` | Yes | Operation selector used for top-level routing. Supported values are `generate`, `summarize`, and `categorize`. |
| `data` | `string` | Yes | Spreadsheet context or source content to operate on. This may include cell text, row context, constraints, or embedded formatting instructions. |
| `outputFormat` | `string` | Conditionally required | Secondary selector used only for `generate` requests. Supported values observed in the flow are `text` and `image`. |
| `webhookUrl` | `string` | Yes | Callback URL that receives the final normalised result and target cell metadata via HTTP `POST`. |

Below the table, notable constraints and assumptions are:
- `aiType` must match one of the explicit condition branches. Any other value is treated as invalid.
- `outputFormat` is meaningful only when `aiType` is `generate`. If it is neither `text` nor `image`, the flow bypasses generation LLM execution and still passes through response finalisation, which may yield an empty or invalid result depending on script behaviour.
- `data` is treated as a free-form string payload. The sample input shows that callers may embed both content and lightweight instructions such as word-count hints inside it.
- No explicit schema validation, length guard, or language restriction is defined in the flow source. Validation is therefore mostly implicit and deferred to branch scripts, prompt instructions, model behaviour, and the callback target.
- Each LLM branch also requires an operator-supplied `generativeModelName` input at deployment/runtime configuration level inside Lamatic. Those are private node inputs rather than trigger payload fields.

## Outputs
| Field | Type | Description |
|---|---|---|
| `value` | `string` or structured branch-finalised value | The final AI-generated, summarised, categorised, or error value after branch-specific finalisation and global response normalisation. |
| `metadata.sheetId` | `string` | Echo of the input `sheetId`, returned so the caller can associate the response with the target sheet. |
| `metadata.columnId` | `string` | Echo of the input `columnId`, returned so the caller can associate the response with the target column. |
| `metadata.rowId` | `string` | Echo of the input `rowId`, returned so the caller can associate the response with the target row. |

Below the table, the response is a small object containing the final `value` plus a `metadata` object with the target identifiers. The same payload shape is used both for the synchronous API response and for the outbound `Update Cell` webhook call. The exact internal shape of `value` depends on the branch finalisation scripts, but the sample invocation and node design suggest it is typically a plain text string for summarisation, categorisation, invalid-request messaging, and text generation, with image-generation output likely normalised into a string or URL-like value by the generation finaliser.

## Dependencies
### Upstream Flows
- This is a standalone entry-point flow for the Embedded Sheets kit.
- No Lamatic upstream flow is required to execute before it.
- Operationally, it depends on an external caller, typically the Next.js spreadsheet UI or backend described in the parent agent, to collect and supply `instruction`, `data`, `aiType`, `outputFormat`, `sheetId`, `columnId`, `rowId`, and `webhookUrl`.

### Downstream Flows
- No separate downstream Lamatic flow consumes this flow's output.
- Instead, two downstream integration targets consume the final payload:
  - The internal `Update Cell` webhook call consumes `value`, `metadata.sheetId`, `metadata.columnId`, and `metadata.rowId`.
  - The synchronous API caller consumes the same response fields from the `API Response` node.

### External Services
- Lamatic API request runtime — receives the inbound flow invocation — requires Lamatic deployment and project credentials such as `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the surrounding application.
- Configured LLM provider for `LLMNode_432` (`Generate Text Prompt`) — drafts a text-generation prompt from the request — requires the model credentials referenced through the Lamatic model config.
- Configured LLM provider for `LLMNode_658` (`Generate Text`) — produces generated text output — requires the model credentials referenced through the Lamatic model config.
- Configured LLM provider for `LLMNode_608` (`Generate Image Prompt`) — drafts an image-generation prompt from the request — requires the model credentials referenced through the Lamatic model config.
- Configured LLM provider for `LLMNode_533` (`Generate Image`) — produces image-oriented output — requires the model credentials referenced through the Lamatic model config.
- Configured LLM provider for `LLMNode_588` (`Summarisation`) — produces summaries from provided content and instructions — requires the model credentials referenced through the Lamatic model config.
- Configured LLM provider for `LLMNode_447` (`Categorise`) — produces categorisation output — requires the model credentials referenced through the Lamatic model config.
- External sheet update endpoint at `webhookUrl` — persists the final result back into the spreadsheet application — requires a reachable caller-supplied `webhookUrl`.

### Environment Variables
- `EMBEDDED_SHEETS` — flow identifier used by the surrounding application to invoke this deployed flow — used outside the flow by the client or backend that calls `API Request`.
- `LAMATIC_API_URL` — Lamatic runtime base URL for invoking the deployed flow — used outside the flow by the caller that triggers `API Request`.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated invocation — used outside the flow by the caller that triggers `API Request`.
- `LAMATIC_API_KEY` — Lamatic API authentication secret — used outside the flow by the caller that triggers `API Request`.
- Model-provider credentials — provider-specific secrets referenced indirectly through each LLM node’s model config — used by `Generate Text Prompt`, `Generate Text`, `Generate Image Prompt`, `Generate Image`, `Summarisation`, and `Categorise`.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives a realtime API invocation containing the operation selector, user instruction, spreadsheet context, target sheet identifiers, desired output mode, and callback URL.

2. `Condition` (`conditionNode_312`, condition node) performs the top-level route on `{{triggerNode_1.output.aiType}}`.
   - If `aiType` is `generate`, execution moves into the generation sub-router.
   - If `aiType` is `summarize`, execution moves directly to `Summarisation`.
   - If `aiType` is `categorize`, execution moves directly to `Categorise`.
   - Any other value takes the `Else` branch to `Invalid Request`.

3. `Condition` (`conditionNode_799`, condition node) runs only for the `generate` branch and checks `{{triggerNode_1.output.outputFormat}}`.
   - If `outputFormat` is `text`, it selects the text-generation path.
   - If `outputFormat` is `image`, it selects the image-generation path.
   - Any other format takes the `Else` branch through an empty pass-through node and then into generation response finalisation without an LLM result, which is effectively a soft-invalid generation case.

4. `Generate Text Prompt` (`LLMNode_432`, LLM node) runs for `generate` plus `outputFormat = text`. It uses the shared text-prompt system prompt and the embedded-sheets text user prompt to transform the raw spreadsheet request into a refined prompt suitable for text generation.

5. `Generate Text` (`LLMNode_658`, LLM node) consumes the prepared text prompt context and produces the actual generated text output for the spreadsheet cell.

6. `Generate Image Prompt` (`LLMNode_608`, LLM node) runs for `generate` plus `outputFormat = image`. It uses image-prompt-specific system and user prompts to derive an image-generation-ready prompt from the instruction and spreadsheet data.

7. `Generate Image` (`LLMNode_533`, LLM node) consumes that prepared image prompt context and produces the branch’s image output representation.

8. `+` (`plus-node-addNode_782449`, add node) is reached only when `aiType = generate` but `outputFormat` matched neither explicit branch. It does no business transformation of its own and simply forwards execution to generation finalisation, leaving that script to handle the absence of a valid branch result.

9. `Finalise Generation Response` (`codeNode_750`, code node) receives whichever generation branch ran and normalises the result into the generation branch’s canonical output shape.

10. `Summarisation` (`LLMNode_588`, LLM node) runs when `aiType = summarize`. It uses the summarisation system prompt and embedded-sheets summarisation user prompt to condense or restyle the provided `data` according to `instruction`.

11. `Finalise Summary Response` (`codeNode_302`, code node) converts the summarisation output into the flow’s standard branch result format.

12. `Categorise` (`LLMNode_447`, LLM node) runs when `aiType = categorize`. It applies the categorisation prompts to assign a category or label-oriented output based on the input data and instruction.

13. `Finalise Categorisation Response` (`codeNode_319`, code node) standardises the categorisation branch output for later global packaging.

14. `Invalid Request` (`codeNode_494`, code node) runs when `aiType` does not match any supported branch. It generates a controlled error or fallback result instead of calling an LLM.

15. `Finalise Response` (`codeNode_473`, code node) is the shared convergence point for all branches. It takes the branch-finalised payload from generation, summarisation, categorisation, or invalid-request handling and produces the single final `value` used by the rest of the flow.

16. `Update Cell` (`apiNode_280`, API node) posts the final payload to the caller-supplied `webhookUrl`. The body includes `value` plus `metadata` carrying `sheetId`, `columnId`, and `rowId`, allowing the external spreadsheet service to update the correct cell.

17. `API Response` (`responseNode`) returns the same `value` and `metadata` object synchronously to the original caller. This means the caller receives the final normalised result even though the flow also issues an outbound update callback.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Response contains an invalid-request style value instead of AI output | `aiType` was missing, misspelled, or not one of `generate`, `summarize`, `categorize` | Validate `aiType` at the caller before invocation and use only supported values. |
| Generation request returns empty, fallback, or malformed output | `aiType` was `generate` but `outputFormat` was missing or not one of `text` or `image` | Require `outputFormat` for generation requests and constrain it to the supported enum values. |
| LLM branch fails to run | No `generativeModelName` or provider credentials were configured for the relevant LLM node in Lamatic | Configure each LLM node with a valid model and working provider credentials before deployment. |
| API call succeeds but spreadsheet cell is not updated | `webhookUrl` is invalid, unreachable, or rejected the `POST` request | Verify the callback endpoint, ensure it accepts JSON, and confirm network reachability from the Lamatic runtime. |
| API response is present but metadata points to the wrong cell | Caller supplied incorrect `sheetId`, `columnId`, or `rowId` | Treat target identifiers as required validated inputs and source them directly from the spreadsheet state. |
| Summary or categorisation quality is poor | `instruction` is vague, `data` is incomplete, or prompt/model selection is misaligned | Improve the instruction wording, send richer row or cell context, and tune the configured model in the relevant node. |
| Empty or low-value model result | Source `data` was blank, excessively short, or incompatible with the requested task | Check that `data` contains the intended spreadsheet content before invoking the flow. |
| Invocation cannot be made from the application | Lamatic flow deployment identifiers or API credentials are missing in the host application | Set `EMBEDDED_SHEETS`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` correctly in the application environment. |
| Expected prior context is unavailable | The external caller did not gather the spreadsheet context before triggering the flow | Ensure the UI or backend assembles `instruction`, `data`, and target metadata before invocation; there is no upstream Lamatic flow to fill these in. |

## Notes
- Although the kit README describes this as a single AI-powered spreadsheet flow, the internal design contains multiple task-specific LLM branches with separate prompts and model configs. Operationally, this means each branch can be tuned independently even though callers see one unified endpoint.
- The flow performs both a synchronous API response and an asynchronous-looking outbound webhook call containing the same payload. This is useful for UI consistency, but it also means duplicate handling should be considered in downstream application logic.
- The generation path is two-stage for both text and image modes: first prompt construction, then content generation. That improves controllability but adds latency compared with the single-stage summarisation and categorisation branches.
- The top-level description is empty in `meta.description`, so node names, prompt references, and the parent agent context are the authoritative source for intent.
- The flow source exposes no explicit hard validation on payload size, token budget, or response length. Large `data` inputs may therefore push the practical limits of the configured models and affect latency or completeness.