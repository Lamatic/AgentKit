// Code: Finalise Output
// Flow: adr-copilot

let result = {{codeNode_1.output}};
output = {
  status: "success",
  timestamp: new Date().toISOString(),
  data: result
};
