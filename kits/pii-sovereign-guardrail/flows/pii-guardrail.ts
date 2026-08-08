/**
 * ⚠️ IMPORTANT — READ BEFORE USING THIS FILE
 *
 * This flow definition is a best-effort scaffold based on the *documented*
 * shape of exported Lamatic flows (meta + inputs + references + nodes +
 * edges, as described in CONTRIBUTING.md). I was not able to pull a real
 * exported flow file to mirror byte-for-byte, so treat the node `type`
 * strings and field names below as placeholders that MUST be checked
 * against an actual export once you build this flow visually in
 * Lamatic Studio (studio.lamatic.ai).
 *
 * The correct process:
 *   1. Build this exact node sequence in Studio's visual editor:
 *      input → codeNode(mask-deterministic) → LLMNode(mask-entities, JSON)
 *            → codeNode(apply-entity-mask) → LLMNode(generate)
 *            → codeNode(rehydrate) → output
 *   2. Wire the @scripts, @prompts, and @model-configs files below into
 *      the matching nodes via Studio's UI.
 *   3. Deploy, then use Studio's Export (⋮ menu) to regenerate this file
 *      for real — overwrite this scaffold with the actual export.
 *
 * The `scripts/`, `prompts/`, and `model-configs/` files in this kit are
 * real, working implementations — only this orchestration file is a
 * best-effort placeholder for the graph shape.
 */

export default {
  meta: {
    name: "pii-guardrail",
    description:
      "Masks PII before sending a prompt to an external LLM, then rehydrates it in the response."
  },
  inputs: {
    rawUserPrompt: { type: "string", required: true },
    targetModel: { type: "string", required: false, default: "gpt-4o-mini" }
  },
  outputs: {
    secureResponse: { type: "string" },
    tokensRedacted: { type: "object" },
    // Exposed so callers/demos can show exactly what left the
    // infrastructure in masked form — full transparency, not a black box.
    maskedPromptSent: {
      type: "string",
      value: "{{nodes.applyEntityMask.output.fullyMaskedText}}"
    }
  },
  nodes: [
    {
      nodeId: "maskDeterministic",
      type: "codeNode",
      values: {
        script: "@scripts/pii-guardrail_mask-deterministic.ts",
        entrypoint: "maskDeterministic",
        input: "{{inputs.rawUserPrompt}}"
      }
    },
    {
      nodeId: "maskEntities",
      type: "LLMNode",
      values: {
        prompts: [
          {
            role: "system",
            content: "@prompts/pii-guardrail_mask-entities_system.md"
          },
          {
            role: "user",
            content: "@prompts/pii-guardrail_mask-entities_user.md"
          }
        ],
        generativeModelName: "@model-configs/pii-guardrail_mask-entities.ts",
        input: "{{nodes.maskDeterministic.output.maskedText}}"
      }
    },
    {
      nodeId: "applyEntityMask",
      type: "codeNode",
      values: {
        script: "@scripts/pii-guardrail_apply-entity-mask.ts",
        entrypoint: "applyEntityMask",
        args: [
          "{{nodes.maskDeterministic.output.maskedText}}",
          "{{nodes.maskDeterministic.output.tokenMap}}",
          "{{nodes.maskDeterministic.output.deterministicCount}}",
          "{{nodes.maskEntities.output.text}}"
        ]
      }
    },
    {
      nodeId: "generate",
      type: "LLMNode",
      values: {
        prompts: [
          {
            role: "user",
            content: "{{nodes.applyEntityMask.output.fullyMaskedText}}"
          }
        ],
        generativeModelName: "@model-configs/pii-guardrail_generate.ts",
        model: "{{inputs.targetModel}}"
      }
    },
    {
      nodeId: "rehydrate",
      type: "codeNode",
      values: {
        script: "@scripts/pii-guardrail_rehydrate.ts",
        entrypoint: "rehydrateResponse",
        args: [
          "{{nodes.generate.output.text}}",
          "{{nodes.applyEntityMask.output.combinedTokenMap}}",
          "{{nodes.maskDeterministic.output.deterministicCount}}",
          "{{nodes.applyEntityMask.output.probabilisticCount}}"
        ]
      }
    }
  ],
  edges: [
    { from: "maskDeterministic", to: "maskEntities" },
    { from: "maskEntities", to: "applyEntityMask" },
    { from: "applyEntityMask", to: "generate" },
    { from: "generate", to: "rehydrate" }
  ]
};
