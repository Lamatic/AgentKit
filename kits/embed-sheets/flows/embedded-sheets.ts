/*
 * # 1. Embedded AI Sheets
 * A single entry-point spreadsheet AI flow that routes API requests into generation, summarisation, or categorisation, then writes the resulting value back to the target sheet cell and returns the same payload to the caller.
 *
 * ## Purpose
 * This flow is responsible for turning a spreadsheet-side AI action request into a completed cell update. It accepts a user instruction, the source spreadsheet context, a target location, and an operation selector in `aiType`, then chooses the correct AI branch to either generate new content, summarise existing content, or categorise it. The flow also normalises the branch-specific result into a single response shape so the spreadsheet application can handle all supported AI actions consistently.
 *
 * The outcome is a final `value` plus identifying metadata for the target cell. That matters because the wider Embedded Sheets system is designed to let a spreadsheet UI invoke AI as an in-place transformation layer rather than as a separate chat workflow. This flow therefore does not just produce model output; it also packages the result for persistence and triggers a callback to update the relevant sheet cell.
 *
 * Within the broader kit, this is the primary operational flow rather than a downstream helper. The parent agent describes the overall system as a single API-invoked Lamatic flow sitting behind a Next.js spreadsheet interface. In practical pipeline terms, this flow occupies the core synthesize-and-apply stage: the UI or backend gathers user intent and spreadsheet context, this flow performs the AI transformation and response finalisation, and the result is then posted back into the spreadsheet data plane.
 *
 * ## When To Use
 * - Use when the spreadsheet UI or backend needs to perform an AI action against a specific cell or row context and immediately persist the result back into the sheet.
 * - Use when `aiType` is `generate` and the request should create new content from an `instruction` and `data` payload.
 * - Use when `aiType` is `summarize` and the request should condense provided spreadsheet context into a shorter or reformatted output.
 * - Use when `aiType` is `categorize` and the request should assign labels, classes, or categories based on the provided `data` and `instruction`.
 * - Use when generation requests must branch further by `outputFormat`, specifically `text` versus `image`.
 * - Use when the caller can provide sheet targeting fields `sheetId`, `columnId`, and `rowId`, plus a callback `webhookUrl` that should receive the final result.
 * - Use as the main entry point for Embedded Sheets AI actions invoked over the Lamatic API request trigger.
 *
 * ## When Not To Use
 * - Do not use when the request is missing a valid `aiType`; unsupported values fall into the invalid-request path.
 * - Do not use when there is no target sheet location to update, unless the caller is intentionally using only the synchronous API response and is prepared for the internal update callback to fail.
 * - Do not use when `webhookUrl` is unavailable or invalid and downstream sheet persistence is required as part of the operation.
 * - Do not use when the action needed is outside the three supported modes: `generate`, `summarize`, or `categorize`.
 * - Do not use for retrieval-heavy tasks that require external search, document indexing, or multi-step planning; this flow is a direct transformation flow, not a retrieval orchestrator.
 * - Do not use when another system already owns post-processing and cell writeback and only raw model completions are needed; this flow is opinionated about finalising and posting the result.
 * - Do not use when model providers for the configured LLM nodes have not been set up in Lamatic, because every successful branch depends on a configured text-generation model.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `sheetId` | `string` | Yes | Identifier of the sheet that should receive the final AI result. |
 * | `columnId` | `string` | Yes | Identifier of the destination column for the update. |
 * | `rowId` | `string` | Yes | Identifier of the destination row for the update. |
 * | `instruction` | `string` | Yes | Natural-language instruction describing the requested AI operation or style. |
 * | `aiType` | `string` | Yes | Operation selector used for top-level routing. Supported values are `generate`, `summarize`, and `categorize`. |
 * | `data` | `string` | Yes | Spreadsheet context or source content to operate on. This may include cell text, row context, constraints, or embedded formatting instructions. |
 * | `outputFormat` | `string` | Conditionally required | Secondary selector used only for `generate` requests. Supported values observed in the flow are `text` and `image`. |
 * | `webhookUrl` | `string` | Yes | Callback URL that receives the final normalised result and target cell metadata via HTTP `POST`. |
 *
 * Below the table, notable constraints and assumptions are:
 * - `aiType` must match one of the explicit condition branches. Any other value is treated as invalid.
 * - `outputFormat` is meaningful only when `aiType` is `generate`. If it is neither `text` nor `image`, the flow bypasses generation LLM execution and still passes through response finalisation, which may yield an empty or invalid result depending on script behaviour.
 * - `data` is treated as a free-form string payload. The sample input shows that callers may embed both content and lightweight instructions such as word-count hints inside it.
 * - No explicit schema validation, length guard, or language restriction is defined in the flow source. Validation is therefore mostly implicit and deferred to branch scripts, prompt instructions, model behaviour, and the callback target.
 * - Each LLM branch also requires an operator-supplied `generativeModelName` input at deployment/runtime configuration level inside Lamatic. Those are private node inputs rather than trigger payload fields.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `value` | `string` or structured branch-finalised value | The final AI-generated, summarised, categorised, or error value after branch-specific finalisation and global response normalisation. |
 * | `metadata.sheetId` | `string` | Echo of the input `sheetId`, returned so the caller can associate the response with the target sheet. |
 * | `metadata.columnId` | `string` | Echo of the input `columnId`, returned so the caller can associate the response with the target column. |
 * | `metadata.rowId` | `string` | Echo of the input `rowId`, returned so the caller can associate the response with the target row. |
 *
 * Below the table, the response is a small object containing the final `value` plus a `metadata` object with the target identifiers. The same payload shape is used both for the synchronous API response and for the outbound `Update Cell` webhook call. The exact internal shape of `value` depends on the branch finalisation scripts, but the sample invocation and node design suggest it is typically a plain text string for summarisation, categorisation, invalid-request messaging, and text generation, with image-generation output likely normalised into a string or URL-like value by the generation finaliser.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is a standalone entry-point flow for the Embedded Sheets kit.
 * - No Lamatic upstream flow is required to execute before it.
 * - Operationally, it depends on an external caller, typically the Next.js spreadsheet UI or backend described in the parent agent, to collect and supply `instruction`, `data`, `aiType`, `outputFormat`, `sheetId`, `columnId`, `rowId`, and `webhookUrl`.
 *
 * ### Downstream Flows
 * - No separate downstream Lamatic flow consumes this flow's output.
 * - Instead, two downstream integration targets consume the final payload:
 *   - The internal `Update Cell` webhook call consumes `value`, `metadata.sheetId`, `metadata.columnId`, and `metadata.rowId`.
 *   - The synchronous API caller consumes the same response fields from the `API Response` node.
 *
 * ### External Services
 * - Lamatic API request runtime — receives the inbound flow invocation — requires Lamatic deployment and project credentials such as `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the surrounding application.
 * - Configured LLM provider for `LLMNode_432` (`Generate Text Prompt`) — drafts a text-generation prompt from the request — requires the model credentials referenced through the Lamatic model config.
 * - Configured LLM provider for `LLMNode_658` (`Generate Text`) — produces generated text output — requires the model credentials referenced through the Lamatic model config.
 * - Configured LLM provider for `LLMNode_608` (`Generate Image Prompt`) — drafts an image-generation prompt from the request — requires the model credentials referenced through the Lamatic model config.
 * - Configured LLM provider for `LLMNode_533` (`Generate Image`) — produces image-oriented output — requires the model credentials referenced through the Lamatic model config.
 * - Configured LLM provider for `LLMNode_588` (`Summarisation`) — produces summaries from provided content and instructions — requires the model credentials referenced through the Lamatic model config.
 * - Configured LLM provider for `LLMNode_447` (`Categorise`) — produces categorisation output — requires the model credentials referenced through the Lamatic model config.
 * - External sheet update endpoint at `webhookUrl` — persists the final result back into the spreadsheet application — requires a reachable caller-supplied `webhookUrl`.
 *
 * ### Environment Variables
 * - `EMBEDDED_SHEETS` — flow identifier used by the surrounding application to invoke this deployed flow — used outside the flow by the client or backend that calls `API Request`.
 * - `LAMATIC_API_URL` — Lamatic runtime base URL for invoking the deployed flow — used outside the flow by the caller that triggers `API Request`.
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated invocation — used outside the flow by the caller that triggers `API Request`.
 * - `LAMATIC_API_KEY` — Lamatic API authentication secret — used outside the flow by the caller that triggers `API Request`.
 * - Model-provider credentials — provider-specific secrets referenced indirectly through each LLM node’s model config — used by `Generate Text Prompt`, `Generate Text`, `Generate Image Prompt`, `Generate Image`, `Summarisation`, and `Categorise`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives a realtime API invocation containing the operation selector, user instruction, spreadsheet context, target sheet identifiers, desired output mode, and callback URL.
 *
 * 2. `Condition` (`conditionNode_312`, condition node) performs the top-level route on `{{triggerNode_1.output.aiType}}`.
 *    - If `aiType` is `generate`, execution moves into the generation sub-router.
 *    - If `aiType` is `summarize`, execution moves directly to `Summarisation`.
 *    - If `aiType` is `categorize`, execution moves directly to `Categorise`.
 *    - Any other value takes the `Else` branch to `Invalid Request`.
 *
 * 3. `Condition` (`conditionNode_799`, condition node) runs only for the `generate` branch and checks `{{triggerNode_1.output.outputFormat}}`.
 *    - If `outputFormat` is `text`, it selects the text-generation path.
 *    - If `outputFormat` is `image`, it selects the image-generation path.
 *    - Any other format takes the `Else` branch through an empty pass-through node and then into generation response finalisation without an LLM result, which is effectively a soft-invalid generation case.
 *
 * 4. `Generate Text Prompt` (`LLMNode_432`, LLM node) runs for `generate` plus `outputFormat = text`. It uses the shared text-prompt system prompt and the embedded-sheets text user prompt to transform the raw spreadsheet request into a refined prompt suitable for text generation.
 *
 * 5. `Generate Text` (`LLMNode_658`, LLM node) consumes the prepared text prompt context and produces the actual generated text output for the spreadsheet cell.
 *
 * 6. `Generate Image Prompt` (`LLMNode_608`, LLM node) runs for `generate` plus `outputFormat = image`. It uses image-prompt-specific system and user prompts to derive an image-generation-ready prompt from the instruction and spreadsheet data.
 *
 * 7. `Generate Image` (`LLMNode_533`, LLM node) consumes that prepared image prompt context and produces the branch’s image output representation.
 *
 * 8. `+` (`plus-node-addNode_782449`, add node) is reached only when `aiType = generate` but `outputFormat` matched neither explicit branch. It does no business transformation of its own and simply forwards execution to generation finalisation, leaving that script to handle the absence of a valid branch result.
 *
 * 9. `Finalise Generation Response` (`codeNode_750`, code node) receives whichever generation branch ran and normalises the result into the generation branch’s canonical output shape.
 *
 * 10. `Summarisation` (`LLMNode_588`, LLM node) runs when `aiType = summarize`. It uses the summarisation system prompt and embedded-sheets summarisation user prompt to condense or restyle the provided `data` according to `instruction`.
 *
 * 11. `Finalise Summary Response` (`codeNode_302`, code node) converts the summarisation output into the flow’s standard branch result format.
 *
 * 12. `Categorise` (`LLMNode_447`, LLM node) runs when `aiType = categorize`. It applies the categorisation prompts to assign a category or label-oriented output based on the input data and instruction.
 *
 * 13. `Finalise Categorisation Response` (`codeNode_319`, code node) standardises the categorisation branch output for later global packaging.
 *
 * 14. `Invalid Request` (`codeNode_494`, code node) runs when `aiType` does not match any supported branch. It generates a controlled error or fallback result instead of calling an LLM.
 *
 * 15. `Finalise Response` (`codeNode_473`, code node) is the shared convergence point for all branches. It takes the branch-finalised payload from generation, summarisation, categorisation, or invalid-request handling and produces the single final `value` used by the rest of the flow.
 *
 * 16. `Update Cell` (`apiNode_280`, API node) posts the final payload to the caller-supplied `webhookUrl`. The body includes `value` plus `metadata` carrying `sheetId`, `columnId`, and `rowId`, allowing the external spreadsheet service to update the correct cell.
 *
 * 17. `API Response` (`responseNode`) returns the same `value` and `metadata` object synchronously to the original caller. This means the caller receives the final normalised result even though the flow also issues an outbound update callback.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Response contains an invalid-request style value instead of AI output | `aiType` was missing, misspelled, or not one of `generate`, `summarize`, `categorize` | Validate `aiType` at the caller before invocation and use only supported values. |
 * | Generation request returns empty, fallback, or malformed output | `aiType` was `generate` but `outputFormat` was missing or not one of `text` or `image` | Require `outputFormat` for generation requests and constrain it to the supported enum values. |
 * | LLM branch fails to run | No `generativeModelName` or provider credentials were configured for the relevant LLM node in Lamatic | Configure each LLM node with a valid model and working provider credentials before deployment. |
 * | API call succeeds but spreadsheet cell is not updated | `webhookUrl` is invalid, unreachable, or rejected the `POST` request | Verify the callback endpoint, ensure it accepts JSON, and confirm network reachability from the Lamatic runtime. |
 * | API response is present but metadata points to the wrong cell | Caller supplied incorrect `sheetId`, `columnId`, or `rowId` | Treat target identifiers as required validated inputs and source them directly from the spreadsheet state. |
 * | Summary or categorisation quality is poor | `instruction` is vague, `data` is incomplete, or prompt/model selection is misaligned | Improve the instruction wording, send richer row or cell context, and tune the configured model in the relevant node. |
 * | Empty or low-value model result | Source `data` was blank, excessively short, or incompatible with the requested task | Check that `data` contains the intended spreadsheet content before invoking the flow. |
 * | Invocation cannot be made from the application | Lamatic flow deployment identifiers or API credentials are missing in the host application | Set `EMBEDDED_SHEETS`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` correctly in the application environment. |
 * | Expected prior context is unavailable | The external caller did not gather the spreadsheet context before triggering the flow | Ensure the UI or backend assembles `instruction`, `data`, and target metadata before invocation; there is no upstream Lamatic flow to fill these in. |
 *
 * ## Notes
 * - Although the kit README describes this as a single AI-powered spreadsheet flow, the internal design contains multiple task-specific LLM branches with separate prompts and model configs. Operationally, this means each branch can be tuned independently even though callers see one unified endpoint.
 * - The flow performs both a synchronous API response and an asynchronous-looking outbound webhook call containing the same payload. This is useful for UI consistency, but it also means duplicate handling should be considered in downstream application logic.
 * - The generation path is two-stage for both text and image modes: first prompt construction, then content generation. That improves controllability but adds latency compared with the single-stage summarisation and categorisation branches.
 * - The top-level description is empty in `meta.description`, so node names, prompt references, and the parent agent context are the authoritative source for intent.
 * - The flow source exposes no explicit hard validation on payload size, token budget, or response length. Large `data` inputs may therefore push the practical limits of the configured models and affect latency or completeness.
 */

// Flow: embedded-sheets

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Embedded AI Sheets",
  "description": "",
  "tags": [],
  "testInput": {
    "sheetId": "d0062c86b2494d83",
    "columnId": "8c5e89f9b7c74f27",
    "rowId": "2e94ccdfa59540c2",
    "instruction": "summarise in funny tone based on context",
    "aiType": "summarize",
    "data": "words: 50; blog: ### Lamatic AI vs. Vellum: Choosing the Right Tool for Your Words  In the evolving landscape of digital writing and publishing, two platforms stand out for their innovative approaches: Lamatic AI and Vellum. Both offer powerful solutions for writers, but they cater to distinctly different stages of the creative process. Lamatic AI excels in content generation and writing assistance, while Vellum is the gold standard for professional book formatting. Understanding their unique strengths is key to choosing the right tool for your specific project.  Lamatic AI is a creator's powerhouse, designed to streamline the writing process from idea to first draft. Its core strength lies in its advanced AI, which can generate articles, brainstorm ideas, and help overcome writer's block. For bloggers, marketers, and content creators, Lamatic AI is an invaluable partner. The user-friendly interface makes it simple to produce dynamic, SEO-friendly content quickly. It acts as an intelligent assistant, focusing on the \"what\" and \"how\" of your writing, ensuring your message is crafted effectively.  On the other hand, Vellum is the artisan's tool for the final presentation. It specializes in one thing and does it flawlessly: creating beautifully formatted books. Primarily for authors preparing to publish, Vellum offers a suite of elegant templates that produce professional-grade ebooks and print-ready PDFs with minimal effort. Its focus is purely on aesthetics and formatting, transforming a finished manuscript into a polished product ready for platforms like Amazon KDP or Apple Books. It handles everything from chapter headings to drop caps with grace.  So, which should you choose? The decision comes down to your primary need. If you're focused on content creation, generating drafts, and need AI-powered writing assistance, Lamatic AI is your ideal companion. If you have a completed manuscript and your goal is to produce a visually stunning, professionally formatted book for publication, Vellum is the undisputed choice.  Have you used either of these platforms? Share your experiences and which tool best fits your workflow in the comments below",
    "outputFormat": "text",
    "webhookUrl": "https://v0-agent-kit-sheets.vercel.app/api/webhook/ai-result"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_608": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "LLMNode_533": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "LLMNode_432": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "LLMNode_658": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "LLMNode_588": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "LLMNode_447": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "generate_image_prompt_system": "@prompts/generate-image-prompt-system.md",
    "generate_image_system": "@prompts/generate-image-system.md",
    "generate_text_prompt_system": "@prompts/generate-text-prompt-system.md",
    "generate_text_system": "@prompts/generate-text-system.md",
    "summarisation_system": "@prompts/summarisation-system.md",
    "categorise_system": "@prompts/categorise-system.md",
    "embedded_sheets_generate_image_prompt_user": "@prompts/embedded-sheets_generate-image-prompt_user.md",
    "embedded_sheets_generate_image_user": "@prompts/embedded-sheets_generate-image_user.md",
    "embedded_sheets_generate_text_prompt_user": "@prompts/embedded-sheets_generate-text-prompt_user.md",
    "embedded_sheets_generate_text_user": "@prompts/embedded-sheets_generate-text_user.md",
    "embedded_sheets_summarisation_user": "@prompts/embedded-sheets_summarisation_user.md",
    "embedded_sheets_categorise_user": "@prompts/embedded-sheets_categorise_user.md"
  },
  "modelConfigs": {
    "embedded_sheets_generate_image_prompt": "@model-configs/embedded-sheets_generate-image-prompt.ts",
    "embedded_sheets_generate_image": "@model-configs/embedded-sheets_generate-image.ts",
    "embedded_sheets_generate_text_prompt": "@model-configs/embedded-sheets_generate-text-prompt.ts",
    "embedded_sheets_generate_text": "@model-configs/embedded-sheets_generate-text.ts",
    "embedded_sheets_summarisation": "@model-configs/embedded-sheets_summarisation.ts",
    "embedded_sheets_categorise": "@model-configs/embedded-sheets_categorise.ts"
  },
  "scripts": {
    "embedded_sheets_finalise_generation_response": "@scripts/embedded-sheets_finalise-generation-response.ts",
    "embedded_sheets_invalid_request": "@scripts/embedded-sheets_invalid-request.ts",
    "embedded_sheets_finalise_summary_response": "@scripts/embedded-sheets_finalise-summary-response.ts",
    "embedded_sheets_finalise_categorisation_response": "@scripts/embedded-sheets_finalise-categorisation-response.ts",
    "embedded_sheets_finalise_response": "@scripts/embedded-sheets_finalise-response.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "conditionNode_312",
    "data": {
      "label": "Condition",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_312-addNode_954",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.aiType}}\",\n      \"operator\": \"==\",\n      \"value\": \"generate\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_312-addNode_946",
            "condition": {}
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_312-plus-node-addNode_608892-521",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.aiType}}\",\n      \"operator\": \"==\",\n      \"value\": \"summarize\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 3",
            "value": "conditionNode_312-plus-node-addNode_163347-394",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.aiType}}\",\n      \"operator\": \"==\",\n      \"value\": \"categorize\"\n    }\n  ]\n}"
          }
        ]
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "conditionNode_799",
    "data": {
      "label": "Condition",
      "modes": {},
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_799-addNode_587",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.outputFormat}}\",\n      \"operator\": \"==\",\n      \"value\": \"text\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_799-addNode_161",
            "condition": {}
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_799-plus-node-addNode_834736-660",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.outputFormat}}\",\n      \"operator\": \"==\",\n      \"value\": \"image\"\n    }\n  ]\n}"
          }
        ]
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "plus-node-addNode_782449",
    "data": {
      "label": "+",
      "nodeId": "addNode",
      "values": {}
    },
    "type": "addNode",
    "measured": {
      "width": 218,
      "height": 100
    },
    "position": {
      "x": 900,
      "y": 600
    }
  },
  {
    "id": "LLMNode_608",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-image-prompt-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/embedded-sheets_generate-image-prompt_user.md"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "messages": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "nodeName": "Generate Image Prompt",
        "attachments": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "credentials": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-image-prompt.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "LLMNode_533",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-image-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/embedded-sheets_generate-image_user.md"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-image.ts",
        "messages": "@model-configs/embedded-sheets_generate-image.ts",
        "nodeName": "Generate Image",
        "attachments": "@model-configs/embedded-sheets_generate-image.ts",
        "credentials": "@model-configs/embedded-sheets_generate-image.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-image.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "LLMNode_432",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-text-prompt-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/embedded-sheets_generate-text-prompt_user.md"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "messages": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "nodeName": "Generate Text Prompt",
        "attachments": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "credentials": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-text-prompt.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "LLMNode_658",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-text-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/embedded-sheets_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-text.ts",
        "messages": "@model-configs/embedded-sheets_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/embedded-sheets_generate-text.ts",
        "credentials": "@model-configs/embedded-sheets_generate-text.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-text.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_750",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-sheets_finalise-generation-response.ts",
        "nodeName": "Finalise Generation Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "codeNode_494",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-sheets_invalid-request.ts",
        "nodeName": "Invalid Request"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 2250,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "LLMNode_588",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/summarisation-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/embedded-sheets_summarisation_user.md"
          }
        ],
        "memories": "@model-configs/embedded-sheets_summarisation.ts",
        "messages": "@model-configs/embedded-sheets_summarisation.ts",
        "nodeName": "Summarisation",
        "attachments": "@model-configs/embedded-sheets_summarisation.ts",
        "credentials": "@model-configs/embedded-sheets_summarisation.ts",
        "generativeModelName": "@model-configs/embedded-sheets_summarisation.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_302",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-sheets_finalise-summary-response.ts",
        "nodeName": "Finalise Summary Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "LLMNode_447",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/categorise-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/embedded-sheets_categorise_user.md"
          }
        ],
        "memories": "@model-configs/embedded-sheets_categorise.ts",
        "messages": "@model-configs/embedded-sheets_categorise.ts",
        "nodeName": "Categorise",
        "attachments": "@model-configs/embedded-sheets_categorise.ts",
        "credentials": "@model-configs/embedded-sheets_categorise.ts",
        "generativeModelName": "@model-configs/embedded-sheets_categorise.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1800,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_319",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-sheets_finalise-categorisation-response.ts",
        "nodeName": "Finalise Categorisation Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1800,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "codeNode_473",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-sheets_finalise-response.ts",
        "nodeName": "Finalise Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "apiNode_280",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "{{triggerNode_1.output.webhookUrl}}",
        "body": "{\n  \"value\": \"{{codeNode_473.output}}\",\n  \"metadata\": {\n    \"sheetId\": \"{{triggerNode_1.output.sheetId}}\",\n    \"columnId\": \"{{triggerNode_1.output.columnId}}\",\n    \"rowId\": \"{{triggerNode_1.output.rowId}}\"\n  }\n}",
        "method": "POST",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Update Cell",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 1050
    },
    "selected": true
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"value\": \"{{codeNode_473.output}}\",\n  \"metadata\": {\n    \"sheetId\": \"{{triggerNode_1.output.sheetId}}\",\n    \"columnId\": \"{{triggerNode_1.output.columnId}}\",\n    \"rowId\": \"{{triggerNode_1.output.rowId}}\"\n  }\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-conditionNode_312",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "conditionNode_312",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-conditionNode_799-590",
    "data": {
      "condition": "Condition 1",
      "branchName": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "conditionNode_799",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_799-LLMNode_432-363",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_799",
    "target": "LLMNode_432",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_432-LLMNode_658",
    "type": "defaultEdge",
    "source": "LLMNode_432",
    "target": "LLMNode_658",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_799-LLMNode_608-318",
    "data": {
      "condition": "Condition 2"
    },
    "type": "conditionEdge",
    "source": "conditionNode_799",
    "target": "LLMNode_608",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_658-codeNode_750-308",
    "type": "defaultEdge",
    "source": "LLMNode_658",
    "target": "codeNode_750",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_608-LLMNode_533",
    "type": "defaultEdge",
    "source": "LLMNode_608",
    "target": "LLMNode_533",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_533-codeNode_750",
    "type": "defaultEdge",
    "source": "LLMNode_533",
    "target": "codeNode_750",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-LLMNode_447-248",
    "data": {
      "condition": "Condition 3"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "LLMNode_447",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_750-codeNode_473-689",
    "data": {},
    "type": "defaultEdge",
    "source": "codeNode_750",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_588-codeNode_302",
    "type": "defaultEdge",
    "source": "LLMNode_588",
    "target": "codeNode_302",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_302-codeNode_473",
    "type": "defaultEdge",
    "source": "codeNode_302",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_447-codeNode_319",
    "type": "defaultEdge",
    "source": "LLMNode_447",
    "target": "codeNode_319",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_319-codeNode_473",
    "type": "defaultEdge",
    "source": "codeNode_319",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-codeNode_494-475",
    "data": {
      "condition": "Else",
      "branchName": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "codeNode_494",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_494-codeNode_473-482",
    "type": "defaultEdge",
    "source": "codeNode_494",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_799-plus-node-addNode_782449-161",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_799",
    "target": "plus-node-addNode_782449",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "plus-node-addNode_782449-codeNode_750-286",
    "type": "defaultEdge",
    "source": "plus-node-addNode_782449",
    "target": "codeNode_750",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-LLMNode_588-227",
    "data": {
      "condition": "Condition 2"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "LLMNode_588",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_473-apiNode_280",
    "type": "defaultEdge",
    "source": "codeNode_473",
    "target": "apiNode_280",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_280-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "apiNode_280",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
