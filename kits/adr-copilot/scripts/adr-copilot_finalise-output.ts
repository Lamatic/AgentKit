// Code: Finalise Output
// Flow: adr-copilot

let result = {{codeNode_1.output}};
if (result && result.error) {
  output = {
    status: "error",
    message: result.error,
    timestamp: new Date().toISOString(),
    data: result
  };
} else {
  output = {
    status: "success",
    timestamp: new Date().toISOString(),
    data: result
  };
}
