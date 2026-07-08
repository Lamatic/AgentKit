// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
// Safely extract the query string from the trigger
const rawInput = {{triggerNode_1.output}};

// Handle both possible structures
output = rawInput.query || rawInput || "";
