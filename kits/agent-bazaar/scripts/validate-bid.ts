const bounty = {{triggerNode_1.output.bounty}};
const agentProfile = {{triggerNode_1.output.agentProfile}};
const openBids = {{triggerNode_1.output.openBids}};
const bidsList = openBids.bids || [];

if (!bounty || !agentProfile) {
  throw new Error('Missing required input: bounty and agentProfile');
}

if (bounty.posted_by === agentProfile.id) {
  throw new Error('CONSTITUTION_VIOLATION: Agent cannot bid on own bounty');
}

const capability = agentProfile.specialty || 'general';

output = {
  bounty: bounty,
  agentProfile: agentProfile,
  capability: capability,
  valid: true
};
