let raw = {{LLMNode_decompose.output.generatedResponse}};

if (typeof raw === 'object' && raw !== null) {
  var parsed = raw;
} else {
  var cleaned = String(raw).replace(/```json/gi, '').replace(/```/g, '').trim();
  var start = cleaned.indexOf('{');
  var end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }
  var parsed = {};
  try { parsed = JSON.parse(cleaned); } catch(e) { parsed = {}; }
}

let q = parsed.search_queries || [];

return {
  fullDecomp: JSON.stringify(parsed),
  category: parsed.category || '',
  targetCustomer: parsed.target_customer || '',
  assumptions: JSON.stringify(parsed.underlying_assumptions || []),
  adjacentMarkets: JSON.stringify(parsed.adjacent_markets || []),
  q0: q[0] || '',
  q1: q[1] || '',
  q2: q[2] || '',
  q3: q[3] || '',
  q4: q[4] || '',
  q5: q[5] || '',
  q6: q[6] || '',
  q7: q[7] || ''
};