// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

// Get raw output from Extract Node
const extractOutput = {{extractFromFileNode_996.output}};

// extractFromFileNode_996 decodes the base64 string in our imageBinary and holds it in output.files.data[0] as a rawstring containing our file data as it was.

// Access the rawstring from extractFromFileNode_996's output JSON 
const data = extractOutput?.files?.[0]?.data?.[0] || "";

output = data