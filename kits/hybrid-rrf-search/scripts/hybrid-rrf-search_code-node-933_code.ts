// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
// Grab the full output object from Hybrid Search
const data = {{hybridSearchNode_957.output}};

// Extract the actual array from inside the object
const results = data.searchResults || data;

if (results && Array.isArray(results)) {
    // Convert the array to readable text for the LLM
    output = JSON.stringify(results, null, 2);
} else {
    // Dump whatever data we got so we can see why it failed
    output = JSON.stringify(data, null, 2);
}

