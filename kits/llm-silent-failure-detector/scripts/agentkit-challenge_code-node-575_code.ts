const flaggedLogs = {{codeNode_789.output.flagged_logs}};

const failureModes =
  flaggedLogs.length === 1
    ? [
        {
          name: "Ungrouped Failure",
          count: 1,
          examples: [flaggedLogs[0].id],
          description:
            flaggedLogs[0].reason || "Single flagged log. Not enough data to identify a recurring pattern.",
          suggested_direction:
            "Review this response manually. More failed examples are needed before clustering."
        }
      ]
    : [];

return {
  summary: {
    total_logs: {{triggerNode_1.output.logs}}.length,
    flagged: flaggedLogs.length,
    clusters: failureModes.length
  },
  failure_modes: failureModes
};