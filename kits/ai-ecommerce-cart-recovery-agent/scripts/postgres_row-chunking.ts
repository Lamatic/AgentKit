function objectToString(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

function splitText(text, maxLength = 2000) {
  const chunks = [];

  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }

  return chunks;
}

const triggerOutput = {{ triggerNode_1.output }};

const rows = Array.isArray(triggerOutput)
  ? triggerOutput
  : [triggerOutput];

output = rows
  .filter((row) => row && typeof row === "object")
  .flatMap((row) => splitText(objectToString(row)));