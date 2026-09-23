// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
const forceFail = {{triggerNode_1.output.forceFail}};
const query = {{triggerNode_1.output.query}};

if (forceFail === true) {
  throw new Error("FLOWCELL_TEST_HOOK: forced primary failure");
}

return { query };
