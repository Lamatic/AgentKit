const bounty = {{triggerNode_1.output.bounty}};
const agentProfile = {{triggerNode_1.output.agentProfile}};
const openBids = {{triggerNode_1.output.openBids}};
const bidsList = openBids?.bids || [];

if (!bounty || !agentProfile) {
  throw new Error('Missing required input: bounty and agentProfile');
}

if (bounty.posted_by === agentProfile.id) {
  throw new Error('CONSTITUTION_VIOLATION: Agent cannot bid on own bounty');
}

const SUPPORTED_SPECIALTIES = ['summarizer', 'researcher', 'datagen', 'general'];

// Authoritative capability path: only supported specialties map to a real
// file. Unknown specialties fall back to general so downstream nodes never
// receive a fabricated path. price-guardrails.ts derives the same path from
// the same trigger input; the two must agree.
const specialty = SUPPORTED_SPECIALTIES.includes(agentProfile.specialty)
  ? agentProfile.specialty
  : 'general';
const capability = `capabilities/${specialty}.md`;

output = {
  bounty: bounty,
  agentProfile: agentProfile,
  capability: capability,
  valid: true
};
