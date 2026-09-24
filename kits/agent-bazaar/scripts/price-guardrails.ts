const response = {{LLMNode_505.output.generatedResponse}};
const bounty = {{triggerNode_1.output.bounty}};
const agentProfile = {{triggerNode_1.output.agentProfile}};

// The LLM response may arrive as an object (template substitution) or as a JSON string, sometimes wrapped in code fences or prose.
let bid;
if (typeof response === 'object' && response !== null) {
  bid = response;
} else if (typeof response === 'string') {
  const text = response.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  try {
    bid = JSON.parse(candidate);
  } catch (e) {
    // Fall back to the first JSON object found anywhere in the response.
    const match = candidate.match(/\{[^]*?\}/);
    if (!match) {
      throw new Error('Failed to parse LLM response as JSON');
    }
    try {
      bid = JSON.parse(match[0]);
    } catch (e2) {
      throw new Error('Failed to parse LLM response as JSON');
    }
  }
  // Ensure we ended up with an object (LLM may have returned an array or a bare value).
  if (typeof bid !== 'object' || bid === null) {
    throw new Error('Failed to parse LLM response as JSON');
  }
} else {
  throw new Error('Failed to parse LLM response as JSON');
}

const budget = Number(bounty && bounty.budget);
if (!Number.isFinite(budget) || budget <= 0) {
  throw new Error('Missing or invalid bounty budget');
}

const price = Number(bid.price);
if (!Number.isSafeInteger(price) || price <= 0) {
  throw new Error('Bid price must be a positive integer');
}

if (price <= budget * 0.1) {
  throw new Error('Bid price too low: must be > 10% of budget');
}

if (price > budget) {
  throw new Error('Bid price exceeds budget');
}

const etaHours = Number(bid.eta_hours);
if (!Number.isInteger(etaHours) || etaHours <= 0) {
  throw new Error('Bid eta_hours must be a positive integer');
}

const pitch = typeof bid.pitch === 'string' ? bid.pitch.trim() : '';
if (!pitch) {
  throw new Error('Bid pitch must be a non-empty string');
}

// Authoritative capability path, validated exactly like validate-bid.ts
// (codeNode_832) from the same trigger input — never trust the LLM-provided
// path, which may reference a nonexistent file, and never fall back to one.
const SUPPORTED_SPECIALTIES = ['summarizer', 'researcher', 'datagen'];
if (!agentProfile || !SUPPORTED_SPECIALTIES.includes(agentProfile.specialty)) {
  throw new Error(`Unsupported specialty: ${agentProfile?.specialty}`);
}
const capability = `capabilities/${agentProfile.specialty}.md`;

output = {
  price: price,
  eta_hours: etaHours,
  pitch: pitch,
  capability: capability
};
