// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const files = {{extractFromFileNode_202.output.files}};
output = { rows: (files && files[0] && files[0].data) ? files[0].data : [] };