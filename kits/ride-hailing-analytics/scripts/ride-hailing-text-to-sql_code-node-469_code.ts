function buildRejectedResponse(reason) {
  return {
    answer: reason || "This question could not be answered because the generated query didn't pass validation.",
    chartType: "none",
    sql: "",
    results: []
  };
}

return buildRejectedResponse({{codeNode_320.output.reason}});