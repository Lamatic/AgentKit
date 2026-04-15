/*
 * # Caption Image
 * A synchronous multimodal captioning flow that accepts an image plus optional metadata, generates a short caption, and serves as the entry-point API for the wider caption-generation system.
 *
 * ## Purpose
 * This flow is responsible for turning a single image request into a usable caption by combining visual understanding with lightweight contextual metadata. It solves the narrow but important sub-task of image caption generation at request time, so callers do not need to build their own prompt logic, model orchestration, or response formatting around a multimodal model.
 *
 * The outcome is a single caption string returned immediately to the caller. That caption can then be stored, reviewed, indexed, attached to an asset record, or displayed in a UI. In the broader agent pipeline, the value of this flow is standardization: every image is processed through the same trigger, prompt structure, and model path, which improves consistency across large sets of photos, screenshots, or visual assets.
 *
 * Within the parent agent, this flow sits as the primary execution path rather than as a downstream enrichment step. The agent is intentionally a single-flow system exposed through a GraphQL API, so external applications, automation platforms, or backend services invoke this flow directly and receive a synchronous response. Functionally, it occupies the full request-to-synthesis path for this kit: intake at the API boundary, multimodal interpretation and caption synthesis in the model node, then response packaging back to the caller.
 *
 * ## When To Use
 * - Use when an external client needs an immediate caption for a single image.
 * - Use when the input includes an image plus optional context such as `timestamp`, `location`, or `people` that should influence caption wording.
 * - Use when you want a short, human-readable caption rather than a long-form description, classification, OCR result, or moderation decision.
 * - Use when you need consistent caption generation across many photographs, screenshots, or similar visual assets.
 * - Use when this kit is being consumed as an API-first service through its GraphQL trigger.
 * - Use when downstream systems need one normalized caption field for storage, search, accessibility support, or content workflows.
 *
 * ## When Not To Use
 * - Do not use when no image is available; this flow depends on visual input.
 * - Do not use when you need detailed structured extraction from the image rather than a single caption string.
 * - Do not use when the task is OCR, image classification, safety review, or retrieval; those are outside this flow's purpose.
 * - Do not use when you need batch orchestration, deduplication across a full image set, or ranking across many images, because this flow processes one request synchronously and does not maintain collection state.
 * - Do not use when the caller cannot satisfy the GraphQL trigger contract expected by the flow.
 * - Do not use when another system already generated an approved caption and only storage or routing is required.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `photo` | image reference or image payload | Yes | The image to caption. The prompt treats this as the attached photo and the multimodal node uses it as the primary visual input. |
 * | `timestamp` | string | No | Date and time associated with when the photo was taken, used as supporting context for the caption. |
 * | `location` | string | No | Location associated with the image, used to improve contextual relevance. |
 * | `people` | string | No | Names or description of people shown in the image, used to steer the generated caption. |
 *
 * The flow source does not publish an explicit GraphQL schema, so the exact transport representation of `photo` depends on the deployment's trigger configuration. Operationally, `photo` should be supplied in a model-consumable form such as a URL, file reference, upload handle, or other supported image attachment format. Metadata fields are assumed to be plain text. No explicit hard validation rules are encoded in the flow, but the prompt is optimized for concise captioning and asks the model to keep the result under 50 characters.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `Caption` | string | The generated caption returned from the multimodal model response. |
 *
 * The API response is a simple object containing a single prose field, `Caption`. The value is free-form natural language rather than a structured record. Although the prompt instructs the model to produce a concise caption and not exceed 50 characters, that limit is prompt-guided rather than schema-enforced, so callers should treat it as a target rather than a hard guarantee.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow. No other Lamatic flow must run before it.
 *
 * The only prerequisite is that the external caller supplies the trigger payload fields this flow expects, specifically `photo` and any optional metadata fields such as `timestamp`, `location`, and `people`.
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are defined in the provided materials.
 *
 * External systems may consume the returned `Caption` field for storage, indexing, publishing, accessibility, analytics, or review workflows, but no additional in-kit flow dependency is declared.
 *
 * ### External Services
 * - GraphQL API trigger — receives synchronous requests and exposes the flow as an API endpoint — required credentials or gateway configuration depend on the Lamatic deployment
 * - Multimodal LLM defined by `@model-configs/caption-image_multi-modal.ts` — interprets the image and generates the caption — required model credential depends on the provider configured in the referenced model config
 * - Constitution file `@constitutions/default.md` — provides default behavioral guidance available to the project context — no separate credential indicated in the flow source
 *
 * ### Environment Variables
 * - Provider-specific model credentials defined indirectly by `@model-configs/caption-image_multi-modal.ts` — authenticate the multimodal model call — used by `Multi Modal`
 * - Any Lamatic deployment or API gateway variables needed to expose the GraphQL endpoint — enable invocation of the trigger node — used by `Caption SS Trigger`
 *
 * ## Node Walkthrough
 * 1. `Caption SS Trigger` (`graphqlNode`) receives the incoming API request and starts the flow. This node is the synchronous GraphQL entry point. It accepts the image input in `triggerNode_1.output.photo` and makes metadata fields such as `triggerNode_1.output.timestamp`, `triggerNode_1.output.location`, and `triggerNode_1.output.people` available to downstream nodes.
 *
 * 2. `Multi Modal` (`multiModalLLMNode`) sends the image and contextual metadata to the configured multimodal model. The node uses a system instruction positioning the model as a photographer who captions photographs, then applies a prompt template that asks for a concise, descriptive, compelling caption for the attached image. The prompt explicitly injects the `photo`, `timestamp`, `location`, and `people` fields from the trigger output, and asks the model to reflect the mood, avoid repeating prior captions, mark highly similar alternatives as `duplicate`, and aim for a caption no longer than 50 characters. The generated text is exposed as `multiModalLLMNode_435.output.generatedResponse`.
 *
 * 3. `graphqlResponseNode_185` (`graphqlResponseNode`) formats the API response. It maps the model output into a single response field, `Caption`, and returns that object to the original caller over the response edge connected back to the trigger.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before model execution | The GraphQL trigger payload does not match what the deployment expects, or the image field is missing | Verify the trigger contract in the deployed endpoint, ensure `photo` is present, and confirm the image is passed in a supported format |
 * | The response contains an empty or low-quality caption | The image reference is inaccessible, corrupted, unsupported, or too ambiguous for the model to interpret | Confirm the image can be resolved by the runtime, use a clearer image, and provide richer metadata such as `location` or `people` |
 * | The flow errors at the multimodal step | Model provider credentials are missing or invalid in the referenced model configuration | Check the provider-specific environment variables or secrets used by `@model-configs/caption-image_multi-modal.ts` and redeploy if needed |
 * | The caption exceeds the desired length | The 50-character limit is only enforced through prompting, not strict validation | Add downstream validation or post-processing if a hard length cap is required |
 * | Captions are repetitive across similar requests | The prompt asks for variation, but the flow has no memory or corpus-wide deduplication state | Add external storage, comparison logic, or a separate deduplication flow if uniqueness across a large set is mandatory |
 * | Duplicate labeling is inconsistent | The prompt mentions marking highly similar images as `duplicate`, but the flow processes one request at a time without comparison context | Do not rely on this behavior for true duplicate detection; implement a separate similarity or batch comparison pipeline |
 * | Caller expects fields beyond `Caption` | The response node exposes only a single output field | Extend the response mapping if confidence scores, reasoning, tags, or other structured fields are needed |
 * | An upstream flow is said to be missing | The broader kit is single-flow and has no required upstream Lamatic flow | Invoke this flow directly and provide the expected trigger payload from the external caller |
 *
 * ## Notes
 * - The flow's `inputs` object is empty in source, which indicates no separately managed private runtime inputs are declared at the flow level; operational inputs are taken directly from the GraphQL trigger payload.
 * - The prompt includes `{{triggerNode_1.output.people}}` twice in sequence. This appears to be an authoring duplication rather than intentional logic, but it will cause the `people` value to be repeated in the assembled prompt.
 * - The instruction about selecting the best photo and appending `duplicate` to others implies multi-image comparison, yet the implemented flow handles a single image per request. Treat that instruction as non-operational unless the caller or surrounding system supplies its own comparison context.
 * - Because the response type is configured as `realtime`, this flow is best suited for synchronous API usage where the caller expects an immediate answer rather than queued or long-running processing.
 * - The quality of the caption will depend heavily on the accessibility and fidelity of the supplied image plus the exact provider/model configured in `@model-configs/caption-image_multi-modal.ts`. 
 */

// Flow: caption-image

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Caption Image",
  "description": "This API accepts an image and metadata, then uses the image content to generate a caption. It enables systematic, consistent, and efficient captioning of large numbers of photographs, screenshots, or other images.",
  "tags": [
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/caption-image",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "modelConfigs": {
    "caption_image_multi_modal": "@model-configs/caption-image_multi-modal.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "Caption SS Trigger",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "multiModalLLMNode_435",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "multiModalLLMNode",
      "values": {
        "nodeName": "Multi Modal",
        "messages": "@model-configs/caption-image_multi-modal.ts",
        "attachments": "@model-configs/caption-image_multi-modal.ts",
        "systemPrompt": "You are a Photographer who captions photographs.",
        "promptTemplate": "\r\nYou are a photo editor. Your job is to produce a concise, descriptive and compelling\r\ncaption that helps someone understand what is in this attached photo without viewing it: {{triggerNode_1.output.photo}}\r\nPlease use the following contextual elements to produce the best possible caption:\r\n1) Timestamp which contains the date and time the photo was taken: {{triggerNode_1.output.timestamp}}\r\n2) The location where the photo was taken: {{triggerNode_1.output.location}}\r\n3) The people shown in the photograph: {{triggerNode_1.output.people}}{{triggerNode_1.output.people}}\r\nThe caption you produce should:\r\n1) Reflect the mood depicted in the photograph.\r\n2) It should be different than other photographs that you've captioned.\r\n3) For photographs that are extremely similar, attempt to select the best photo and \r\nadd \"duplicate\" at the end of the name of the others.\r\n4) It should not exceed 50 characters.",
        "generativeModelName": "@model-configs/caption-image_multi-modal.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_185",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "outputMapping": "{\n  \"Caption\": \"{{multiModalLLMNode_435.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-multiModalLLMNode_435",
    "source": "triggerNode_1",
    "target": "multiModalLLMNode_435",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "multiModalLLMNode_435-graphqlResponseNode_185",
    "source": "multiModalLLMNode_435",
    "target": "graphqlResponseNode_185",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_185",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_185",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
