const report = {{codeNode_978.output}};
const single = {{codeNode_575.output}};

if (report && typeof report === "object" && Object.keys(report).length > 0) {
  return report;
}

if (single && typeof single === "object" && Object.keys(single).length > 0) {
  return single;
}

return {
  error: "No output available from either branch."
};