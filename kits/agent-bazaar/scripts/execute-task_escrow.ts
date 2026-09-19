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

const winningBid = bids.find(b => b.id === decision.winnerBidId);
if (!winningBid) {
  throw new Error('Selected bid not found in provided bids');
}

if (winningBid.agent_id === bounty.posted_by) {
  throw new Error('CONSTITUTION_VIOLATION: Winner is the bounty poster');
}

if (typeof winningBid.balance !== 'number' || winningBid.balance < winningBid.price) {
  throw new Error('CONSTITUTION_VIOLATION: Insufficient balance');
}

if (typeof winningBid.price !== 'number' || winningBid.price <= 0) {
  throw new Error('Invalid bid price');
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
  lockRef: lockRef,
  scores: decision.scores || [],
  reason: decision.reason || `Bid ${winningBid.id} selected with score ${decision.scores?.[0]?.score || 'N/A'}`
};
