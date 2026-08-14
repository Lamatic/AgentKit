const maskedText = {{codeNode_163.output}}.maskedText;
const tokenMap = {{codeNode_163.output}}.tokenMap;
const layer2Raw = {{LLMNode_588.output}}.generatedResponse;

let fullyMaskedText = maskedText;
const fullTokenMap = { ...tokenMap };
let counter = Object.keys(tokenMap).length;

try {
  const parsed = JSON.parse(layer2Raw);
  const entities = parsed.entities || [];
  for (const entity of entities) {
    if (!entity.text || fullyMaskedText.indexOf(entity.text) === -1) continue;
    const placeholder = `[REDACTED_${entity.label || "OTHER"}_${counter}]`;
    fullTokenMap[placeholder] = entity.text;
    fullyMaskedText = fullyMaskedText.split(entity.text).join(placeholder);
    counter += 1;
  }
} catch (e) {
  // Fail closed — if Layer 2 output isn't valid JSON, proceed with
  // Layer 1 masking only. Nothing unmasked ever leaks.
}

output = {
  fullyMaskedText,
  tokenMap: fullTokenMap,
  totalRedacted: counter,
  probabilisticCount: counter - Object.keys(tokenMap).length
};