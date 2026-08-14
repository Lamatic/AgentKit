const modelDraft = {{LLMNode_925.output}}.generatedResponse;
const tokenMap = {{codeNode_591.output}}.tokenMap;

let rehydrated = modelDraft;
for (const [placeholder, realValue] of Object.entries(tokenMap)) {
  rehydrated = rehydrated.split(placeholder).join(realValue);
}

output = {
  secureResponse: rehydrated,
  maskedPromptSent: modelDraft
};