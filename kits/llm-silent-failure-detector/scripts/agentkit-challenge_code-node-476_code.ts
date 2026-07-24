const report = {{codeNode_978.output}};
const single = {{codeNode_575.output}};

const reportValid =
  report &&
  !report.executionMsg &&
  report.summary;

const singleValid =
  single &&
  !single.executionMsg;

if (reportValid) {
  return { result: report };
}

if (singleValid) {
  return { result: single };
}

return {
  result: {
    summary: { total_logs: 0, flagged: 0, clusters: 0 },
    failure_modes: []
  }
};