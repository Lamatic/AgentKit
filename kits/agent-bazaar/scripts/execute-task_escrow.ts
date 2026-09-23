const llmResponse = {{LLMNode_344.output.generatedResponse}};
const bounty = {{triggerNode_1.output.bounty}};
const bids = {{triggerNode_1.output.bids.bids}};

let decision;
try {
  decision = JSON.parse(llmResponse);
} catch (e) {
  throw new Error('Failed to parse LLM response as JSON');
}

if (!decision.winnerBidId) {
  throw new Error(`CONSTITUTION_VIOLATION: ${decision.reason || 'No valid bid selected'}`);
}

const eligibleBids = bids.filter(b =>
  b.capability && typeof b.capability === 'string' && b.capability.startsWith('capabilities/')
);
if (eligibleBids.length === 0) {
  throw new Error('CONSTITUTION_VIOLATION: No bids with valid capabilities');
}

const winningBid = eligibleBids.find(b => b.id === decision.winnerBidId);
if (!winningBid) {
  throw new Error('Selected bid not found in eligible bids');
}

if (!winningBid.capability || typeof winningBid.capability !== 'string' || !winningBid.capability.startsWith('capabilities/')) {
  throw new Error('CONSTITUTION_VIOLATION: Winning bid has invalid or missing capability');
}

if (winningBid.agent_id === bounty.posted_by) {
  throw new Error('CONSTITUTION_VIOLATION: Winner is the bounty poster');
}

if (typeof winningBid.price !== 'number' || winningBid.price <= 0) {
  throw new Error('Invalid bid price');
}

// Escrow locks the bounty poster's funds, never the worker's: a worker
// balance gate would reject valid bids (and fail whenever bids carry no
// balance). Insufficient poster funds are rejected by the lock path.

if (typeof bounty.budget !== 'number' || !isFinite(bounty.budget) || bounty.budget <= 0) {
  throw new Error('Invalid bounty budget: must be a finite positive number');
}

if (winningBid.price > bounty.budget) {
  throw new Error('Bid price exceeds bounty budget');
}

const escrowId = `escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const lockRef = `lock-escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

output = {
  winnerBidId: winningBid.id,
  escrowId: escrowId,
  amount: winningBid.price,
  capability: winningBid.capability,
  lockRef: lockRef,
  scores: decision.scores || [],
  reason: decision.reason || `Bid ${winningBid.id} selected with score ${decision.scores?.[0]?.score || 'N/A'}`
};
