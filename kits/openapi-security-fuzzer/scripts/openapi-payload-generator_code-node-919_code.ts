// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

// Passing the OpenAPI spec from the trigger node to the output
return { 
  parsedSpec: `{{triggerNode_1.output.openapiSpec}}`
};