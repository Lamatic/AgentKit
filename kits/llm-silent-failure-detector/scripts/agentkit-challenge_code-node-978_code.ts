const results = {{forLoopEndNode_282.output.loopOutput}};
const clusters = {{codeNode_676.output.clusters}};

const failureModes = results
  .map((item, idx) => ({ item, cluster: clusters[idx] }))
  .filter(pair => pair.item.InstructorLLMNode_260?.output && pair.cluster)
  .map(pair => {
    const naming = pair.item.InstructorLLMNode_260.output;
    const cluster = pair.cluster;
    return {
      name: naming.name,
      count: cluster.members.length,
      examples: cluster.members.slice(0, 3).map(m => m.id),
      description: naming.description,
      suggested_direction: naming.suggested_direction
    };
  });

return {
  summary: {
    total_logs: {{triggerNode_1.output.logs}}.length,
      flagged: {{codeNode_789.output.flagged_count}},
clusters: failureModes.length
  },
failure_modes: failureModes
};