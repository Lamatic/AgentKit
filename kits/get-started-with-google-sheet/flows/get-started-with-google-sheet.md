# Get Started with Google Sheet
A trigger-driven Lamatic flow that ingests data changes from Google Sheets, uses an LLM to convert sheet-derived content into a structured JSON-style summary, and serves as the entry point for spreadsheet-to-AI analysis in this kit.

## Purpose
This flow is responsible for turning Google Sheets data into a machine-usable representation without requiring a developer or operator to manually inspect rows, copy values, or hand-write transformations. It is built around a Google Sheets trigger, so execution begins when the configured spreadsheet is polled on schedule and new appended data is detected. That makes the sheet the operational source of truth and this flow the automation layer that interprets it.

The core outcome is a summarized, structured response generated from sheet-provided data. In practice, the `Generate Text` node is configured with a system prompt and model settings that instruct the model to summarize the incoming user data from Google Sheets in JSON form. This matters because downstream systems generally need predictable, normalized fields rather than raw spreadsheet rows. Even when the exact schema is prompt-defined rather than hard-coded, the flow’s intent is clearly to transform unstructured or semi-structured sheet payloads into a more consistent object suitable for further automation.

Within the broader agent architecture, this is a standalone entry-point flow rather than a mid-pipeline worker. It sits at the ingestion-and-synthesis boundary: Google Sheets provides the retrieval/input side, and the LLM performs the interpretation/synthesis side. There is no separate planning stage and no upstream flow dependency in this template. The resulting structured output can then be consumed by external automations, storage layers, dashboards, or additional agent steps outside this flow.

## When To Use
- Use when Google Sheets is the source system and new or appended sheet data should automatically trigger AI processing.
- Use when you want spreadsheet rows or sheet-derived payloads converted into a structured JSON-style summary for downstream systems.
- Use when an operator has connected a spreadsheet and needs a quick way to analyze or normalize its contents through an LLM.
- Use when you are prototyping a retrieval-and-analysis workflow where the sheet acts as the knowledge source and the model acts as the interpreter.
- Use when incremental ingestion is preferred and the flow should process newly appended records rather than reprocess the entire spreadsheet on every run.
- Use when the consumer of the result expects a machine-readable response rather than a free-form narrative summary.

## When Not To Use
- Do not use when the source data is not in Google Sheets or when another connector is the actual system of record.
- Do not use when no Google Sheets credentials have been configured and the trigger cannot authenticate.
- Do not use when the target spreadsheet link is invalid, inaccessible, deleted, or not shared appropriately with the configured integration.
- Do not use when you need deterministic schema validation or strict field-level guarantees that are not enforced by the current prompt-and-LLM approach.
- Do not use when you need batch historical backfill across all rows unless you intentionally reconfigure the trigger behavior; this flow is set to incremental append mode.
- Do not use when a user expects interactive question-answering over a sheet in real time through a chat interface; this implementation is trigger-based rather than request-response chat orchestration.
- Do not use when a sibling or custom flow is required to enrich, validate, or route the generated JSON before release and that logic has not been added here.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| Trigger payload from `Google Sheets` | `object` | Yes | The event payload emitted by the `googleSheetsNode` when the configured spreadsheet is polled and qualifying data is detected. The exact shape depends on the Google Sheets connector and may include sheet metadata, changed rows, appended records, or related sheet context. |
| Spreadsheet configuration | `string` | Yes | Internally configured via the trigger node as `spreadSheetLink`. This identifies the Google Sheet the flow reads from. It is not supplied by an API caller at runtime in this template; it is part of flow configuration. |
| Schedule configuration | `string` | Yes | Internally configured via `cronExpression` on the trigger node. It controls when Lamatic checks the sheet for updates. |
| Trigger credentials | `credential reference` | Yes | Authentication used by the Google Sheets integration. In the exported source this field is blank and must be configured in the Lamatic environment before the flow can run successfully. |

The flow does not define any user-supplied top-level `inputs` object, so there are no explicit runtime API parameters in the template source. Instead, all effective input arrives through the `Google Sheets` trigger configuration and the event payload it emits. The spreadsheet URL must be a valid Google Sheets link, and the integration must have permission to access it. Because the payload schema is connector-defined, downstream consumers should not assume fixed column names unless they control the sheet schema.

## Outputs
| Field | Type | Description |
|---|---|---|
| LLM summary result | `string` or `object-like text` | The primary generated output from `Generate Text`, intended by prompt design to be a JSON-form summary of the sheet-derived user data. |
| Final response payload | `object` | The post-processed output after `addNode_105`, typically used to attach or merge fields into the final response returned by the flow. The exact field structure is not explicitly declared in the source. |
| Trigger metadata passthrough | `object` | Depending on Lamatic runtime behavior and `addNode` configuration, portions of the original trigger context may remain available in the final payload. |

The output is conceptually a structured object, but the exact schema is not hard-coded in the flow definition. The LLM is instructed to produce a JSON-form summary, so callers should expect structured content, while also recognizing that LLM-generated structure can vary if the prompt or source data changes. The final response may include merged fields from earlier nodes, but this template does not expose an explicit contract for those field names.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow triggered directly by `Google Sheets`.
- Execution begins at the `googleSheetsNode`, so no prior Lamatic flow is required to prepare inputs for this template.

### Downstream Flows
- No downstream Lamatic flows are defined in this template.
- In the broader system, the output is intended to be consumable by external automations, storage pipelines, dashboards, alerts, CRM updates, ETL jobs, or additional custom agent flows that expect a structured summary.
- Any downstream consumer would primarily depend on the final JSON-style summary produced by `Generate Text` and exposed through the terminal `addNode_105` response composition step.

### External Services
- Google Sheets — source system and trigger data provider — requires a configured Google Sheets credential in the `Google Sheets` trigger node.
- Lamatic-managed LLM provider/model — generates the structured summary from sheet-derived content — requires the model and provider settings referenced by `@model-configs/get-started-with-google-sheet_generate-text.ts`.

### Environment Variables
- No explicit environment variable names are declared in the flow source.
- Provider-specific secrets or connector credentials may still be required by the Lamatic workspace at deployment time for the `Google Sheets` trigger node and the `Generate Text` node.

## Node Walkthrough
1. `Google Sheets` (`triggerNode` using `googleSheetsNode`) starts the flow by monitoring the configured spreadsheet at `spreadSheetLink` on the schedule defined by `cronExpression`. It is configured with `syncMode` set to `incremental_append`, so it is intended to detect newly appended data rather than reload the entire dataset each run. The node emits a sheet-derived payload representing the relevant rows or changes.

2. `Generate Text` (`dynamicNode` using `LLMNode`) receives the payload emitted from the Google Sheets trigger. It uses the system prompt referenced at `@prompts/get-started-with-google-sheet_generate-text_system.md` along with the model settings in `@model-configs/get-started-with-google-sheet_generate-text.ts` to interpret the incoming sheet data. Based on the parent agent context, this node is intended to summarize the user data from the spreadsheet into JSON and return that content without extra framing.

3. `addNode_105` (`addNode`) runs after text generation as the final utility/composition step. The exported source does not specify custom field mappings on this node, so its role should be understood as final response assembly rather than domain logic. In Lamatic templates, this node is commonly used to merge prior outputs into the response object returned to the caller or runtime.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow never triggers | `Google Sheets` credentials are missing or the trigger is not deployed/enabled | Configure valid Google Sheets credentials in the trigger node, verify deployment status, and confirm the flow is active in the Lamatic workspace. |
| Flow triggers but returns no useful content | The sheet payload is empty, newly appended rows were not detected, or the source sheet has no qualifying changes | Check the spreadsheet for new appended data, verify `syncMode` behavior matches your ingestion pattern, and confirm the polling schedule is appropriate. |
| Authentication or access errors from Google Sheets | The spreadsheet link is wrong, the sheet is private, or the connected account lacks permission | Validate `spreadSheetLink`, ensure the target sheet still exists, and share it with the service account or authenticated user used by the integration. |
| LLM output is not valid JSON | The prompt asks for JSON-style output but the model response is still generative and not schema-enforced | Strengthen the system prompt, add structured output validation, or insert a downstream parser/validator before relying on the response programmatically. |
| Output structure changes between runs | Source sheet content varies or the prompt/model configuration does not enforce a fixed schema | Standardize the sheet columns, tighten the prompt instructions, and use a model configuration that supports structured generation if strict consistency is required. |
| Flow fails after the LLM step with unclear final payload | `addNode_105` has minimal visible configuration and may not expose fields as expected | Inspect the runtime output of both the LLM node and the add node, then explicitly configure response mappings if a stable output contract is needed. |
| Expected upstream data is missing | A caller assumes this flow depends on another flow, but it is actually an entry-point trigger flow | Invoke or deploy it as a standalone Google Sheets-triggered workflow rather than waiting for upstream Lamatic flow outputs. |
| No processing occurs for updated existing rows | The trigger is configured for `incremental_append`, which focuses on appended data rather than all edit patterns | Reconfigure the trigger mode if your use case depends on updates to existing rows or full-sheet synchronization. |

## Notes
- The README describes this as introducing Google Sheets and a RAG-style analysis pattern, but the exported node graph contains a `Google Sheets` trigger, an `LLMNode`, and an `addNode`; there is no separate dedicated RAG node in the current source. Treat the sheet itself as the retrieval context and the LLM as the analysis layer.
- The trigger node has `batchSize` set to `200`, which suggests the runtime may process records in chunks up to that size during synchronization. Large sheets or frequent appends may therefore require attention to throughput and prompt token limits.
- The `credentials` field in the exported flow source is empty, which is common in template exports. This must be configured after import before the flow can function.
- The `namesConversion` setting is `false`, so developers should not assume automatic normalization of sheet-derived field names.
- Because prompt, memory, messages, and model selection are referenced indirectly through external files, the exact generation behavior depends on those referenced artifacts being present and unchanged in the deployed kit.