// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

// Get raw output from Extract Node
const extractOutput = {{extractFromFileNode_996.output}};

// Extract raw string from metadata.url
let rawText = "";

const data = extractOutput?.files?.[0]?.data?.[0];
if (typeof data === "string") {
  rawText = data;
}

// Strip out the 'data:text/markdown;base64,' prefix if present
if (rawText.startsWith("data:")) {
  rawText = rawText.substring(rawText.indexOf(",") + 1);
}

output = rawText