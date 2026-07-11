const results = {{forLoopEndNode_282.output.loopOutput}};

const failures = results.map(item => {
  const out = item.InstructorLLMNode_260.output;

  return {
    name: out.name,
    description: out.description,
    suggested_direction: out.suggested_direction
  };
});

return {
  total_clusters: failures.length,
  failures
};