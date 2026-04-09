# Resume Parser
A flow that accepts a resume file via API, extracts its text, and converts it into structured candidate JSON as the entry-point parsing step in the wider hiring automation system.

## Purpose
This flow is responsible for solving a narrow but foundational problem in the hiring pipeline: turning an unstructured resume document into machine-readable candidate data. Resumes arrive as files, not normalized records, which makes them difficult to search, rank, deduplicate, or ingest into applicant tracking and enrichment systems. This flow removes that friction by extracting the document text and asking an LLM to transform it into a structured JSON representation.

The outcome of the flow is a single API response containing generated structured output derived from the resume contents. That output is intended to capture the core facts needed for candidate profiling, such as identity details, work experience, education, and skills, subject to what is actually present in the source document and what the prompt instructs the model to produce. This matters because downstream hiring systems depend on predictable structure, not free-form resume prose.

In the broader agent context, this flow sits at the front of the pipeline as the primary entry point rather than as an intermediate enrichment step. The parent agent defines a single-flow system, so there is no prior retrieval or orchestration stage inside this kit. Conceptually, the flow follows a simple ingest-extract-synthesize pattern: receive a resume through the GraphQL surface, extract readable text from the file, then synthesize normalized JSON for use by external HR tools, ATS integrations, and automation workflows.

## When To Use
- Use this flow when a client system needs to convert an uploaded or hosted resume into structured JSON for candidate onboarding, search, or screening.
- Use this flow when the incoming payload provides a file URL that the file extraction node can read.
- Use this flow when the source document is a resume in PDF form, which is the explicitly configured extraction format in this flow.
- Use this flow when you want a single API-call entry point for resume normalization rather than a multi-step client-side extraction process.
- Use this flow when downstream systems need machine-readable fields rather than raw extracted text.
- Use this flow when an ATS, HR tool, or internal hiring workflow needs a normalized candidate profile generated from an unstructured document.

## When Not To Use
- Do not use this flow when the input is already structured candidate JSON; in that case, no document extraction or LLM-based normalization is needed.
- Do not use this flow when no file URL is available in the trigger payload, because the extraction node reads from `{{triggerNode_1.output.url}}`.
- Do not use this flow when the source file is not accessible to the flow runtime, such as a private URL without the necessary access path.
- Do not use this flow when you need deterministic schema validation or guaranteed field completeness beyond what the prompt and model can infer from the resume text.
- Do not use this flow for non-resume document analysis unless the prompt and expected output contract have been updated for that document type.
- Do not use this flow when another system is responsible for OCR, document preprocessing, or file-to-text conversion and you only need post-processed text handling.
- Do not use this flow if your broader workflow expects a different sibling flow to enrich, rank, or screen candidates after parsing; this flow only performs resume-to-JSON conversion.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | A file URL provided through the GraphQL trigger payload and consumed by the extraction node to read the resume document. |

The flow does not declare explicit typed inputs in `inputs`, but the trigger-to-node mapping makes a `url` field an operational requirement. The file must be reachable by the runtime and should point to a resume document in PDF format, because `Extract from File` is configured with `format: pdf`. The trigger schema is not expanded in the source, so callers must align their GraphQL request shape with the trigger configuration such that `triggerNode_1.output.url` is populated.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | The generated response from the LLM node, intended to be structured JSON derived from the resume text. |

The API response returns a single top-level field, `output`, mapped from `{{LLMNode_734.output.generatedResponse}}`. In practice this is expected to be JSON-shaped text produced by the model, not a strongly enforced native object contract at the flow layer. Consumers should therefore treat it as model-generated structured content and, if necessary, parse and validate it before persistence or downstream automation.

## Dependencies
### Upstream Flows
- This is a standalone entry-point flow within the parent agent. No upstream Lamatic flow must run before it.
- The only prerequisite is that the caller provide a GraphQL request containing a usable resume file reference that resolves to `triggerNode_1.output.url`.

### Downstream Flows
- No downstream Lamatic flows are defined in the provided agent context.
- This flow is intended to feed external systems such as ATS platforms, hiring automations, candidate databases, or custom orchestration layers that consume the `output` field.

### External Services
- GraphQL API trigger surface — receives the inbound API request and returns the flow response — required credential or environment variable depends on the Lamatic deployment environment
- File extraction service via `extractFromFileNode` — reads the remote resume file and extracts text from the PDF — required credential or environment variable depends on whether the provided file URL itself requires access control
- Configured LLM from `@model-configs/resume-parser_generate-text.ts` — transforms extracted resume text into structured JSON — required credential or environment variable depends on the model provider configured in the Lamatic model config

### Environment Variables
- No flow-specific environment variables are declared in the provided source.
- Any required model-provider or platform credentials are indirect and come from the Lamatic workspace or the referenced model configuration used by `Generate Text`.
- Any file-access credentials, if needed, are external to this flow definition and would affect `Extract from File`.

## Node Walkthrough
1. `API Request` (`graphqlNode`): This trigger node receives the inbound API call for resume parsing. Although the explicit GraphQL schema is not included here, the rest of the flow makes clear that the request must resolve to a file URL exposed as `triggerNode_1.output.url`. The trigger is configured for a realtime response pattern, so the caller gets the result from the same request lifecycle.

2. `Extract from File` (`extractFromFileNode`): This node fetches the resume from `{{triggerNode_1.output.url}}` and extracts textual content from it. It is configured for `pdf` input, joins pages into a single extracted text stream, preserves whitespace trimming defaults as disabled, and does not return raw binary or base64 content. Its role in this flow is to turn the uploaded resume document into readable text that the model can interpret.

3. `Generate Text` (`LLMNode`): This node sends the extracted resume content to the configured language model using the system prompt referenced at `@prompts/resume-parser_generate-text_system.md` and the model settings referenced at `@model-configs/resume-parser_generate-text.ts`. In this flow, its specific job is not open-ended generation but structured transformation: convert resume text into JSON-like candidate data. The quality and consistency of the output depend on the resume content, the prompt instructions, and the underlying model configuration.

4. `API Response` (`graphqlResponseNode`): This node returns the final response to the caller. It maps the field `output` to `{{LLMNode_734.output.generatedResponse}}`, so the client receives the model’s generated structured result as the API payload.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request succeeds at the trigger but no useful output is returned | The GraphQL payload did not populate `triggerNode_1.output.url`, so the extractor had no valid file source | Confirm the trigger request shape and ensure the resume file URL is mapped into the trigger output exactly where the flow expects it |
| File extraction fails immediately | The provided `url` is invalid, expired, inaccessible, or does not point to a supported PDF file | Verify that the URL is publicly reachable or accessible from the runtime, points to the correct file, and remains valid for the full request duration |
| Extracted content is empty or incomplete | The PDF contains little readable text, is image-based, is corrupted, or extraction quality is poor | Use text-based PDFs when possible, add an OCR preprocessing step outside this flow for scanned resumes, and validate the source file before invoking the flow |
| The model returns malformed JSON-like output | The LLM generated structured text that does not strictly conform to the consumer’s expected schema | Add downstream JSON validation, tighten the prompt, or adjust the referenced model configuration to improve structured output reliability |
| Output is missing expected candidate fields | The resume itself lacks those details, the extraction missed them, or the prompt/model could not infer them confidently | Treat absent fields as source-data limitations first, inspect extracted text quality, and only then refine prompt instructions or post-processing |
| The flow fails at the generation step | The referenced model configuration requires provider credentials that are missing or misconfigured in the Lamatic environment | Check the workspace model setup and ensure all provider credentials required by `@model-configs/resume-parser_generate-text.ts` are present and valid |
| Caller expects a native JSON object but receives a string | The response mapping returns the LLM’s `generatedResponse` as text in `output` | Parse and validate `output` in the client or add a post-processing layer if a strict object response is required |
| A dependent external workflow cannot continue after parsing | The external orchestrator assumed upstream enrichment or screening had already happened | Treat this flow as the parsing entry point only and run any ranking, enrichment, or screening steps separately after consuming `output` |

## Notes
- The flow declares no private `inputs`, so most operational assumptions live in node wiring rather than in a formal public input schema.
- The extraction node is explicitly configured for `pdf`, even though the broader project description mentions resumes may come in other formats. If non-PDF support is required, the node configuration should be reviewed before relying on this flow for DOC or DOCX inputs.
- The response is realtime, which is convenient for synchronous integrations but may be a constraint for large files or slower model runtimes.
- A default constitution is referenced by the flow resources, but the execution behavior visible here is primarily governed by the specific system prompt and model configuration attached to `Generate Text`.
- Because the final contract is model-generated structured text, production integrations should add schema validation, error handling, and possibly normalization before writing parsed data into systems of record.