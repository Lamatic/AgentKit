const agentId = {{triggerNode_1.output.agentId}};
const outcome = {{triggerNode_1.output.outcome}};

const currentReputation = {{triggerNode_1.output.currentReputation}} || 0.5;

let delta = 0;
if (outcome === "pass") {
  delta = 0.05;
} else if (outcome === "fail") {
  delta = -0.1;
}

let newScore = currentReputation + delta;
newScore = Math.max(0.0, Math.min(1.0, newScore));

output = {
  agentId: agentId,
  delta: delta,
  newScore: newScore,
  outcome: outcome
};
