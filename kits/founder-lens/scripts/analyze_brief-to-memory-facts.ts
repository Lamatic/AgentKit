let raw = {{LLMNode_finalBrief.output.generatedResponse}};

if (typeof raw === 'object' && raw !== null) {
  var b = raw;
} else {
  var cleaned = String(raw).replace(/```json/gi, '').replace(/```/g, '').trim();
  var start = cleaned.indexOf('{');
  var end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) cleaned = cleaned.substring(start, end + 1);
  var b = {};
  try { b = JSON.parse(cleaned); } catch(e) { b = {}; }
}

let facts = [];

facts.push('VERDICT: ' + (b.verdict || '') + ' | Confidence: ' + (b.confidence_level || ''));
facts.push('ONE SENTENCE PITCH: ' + (b.the_one_sentence_pitch || ''));
facts.push('MARKET SIZE: ' + ((b.market || {}).size || '') + ' | TIMING: ' + ((b.market || {}).timing || ''));

let tailwinds = ((b.market || {}).tailwinds || []).join(' | ');
facts.push('MARKET TAILWINDS: ' + tailwinds);

let headwinds = ((b.market || {}).headwinds || []).join(' | ');
facts.push('MARKET HEADWINDS: ' + headwinds);

let competitors = ((b.competitive_landscape || {}).direct_competitors || []).map(function(c) {
  return c.name + ' (strength: ' + c.strength + ', weakness: ' + c.weakness + ')';
}).join(' | ');
facts.push('DIRECT COMPETITORS: ' + competitors);

facts.push('THE GAP NOBODY OWNS: ' + ((b.competitive_landscape || {}).the_gap_nobody_owns || ''));

let dead = ((b.competitive_landscape || {}).dead_competitors_and_why || []).map(function(c) {
  return c.name + ' — ' + c.reason;
}).join(' | ');
facts.push('DEAD COMPETITORS: ' + dead);

let complaints = ((b.customer_voice || {}).top_5_complaints_verbatim || []).join(' ||| ');
facts.push('CUSTOMER COMPLAINTS VERBATIM: ' + complaints);

let twitterRage = ((b.customer_voice || {}).twitter_rage_signals || []).join(' ||| ');
facts.push('TWITTER RAGE SIGNALS: ' + twitterRage);

facts.push('IGNORED SEGMENT: ' + ((b.customer_voice || {}).ignored_customer_segment || ''));
facts.push('EXACT PAIN TO SOLVE: ' + ((b.customer_voice || {}).the_exact_pain_worth_solving || ''));

let landing = ((b.customer_voice || {}).words_to_use_on_landing_page || []).join(', ');
facts.push('LANDING PAGE WORDS: ' + landing);

facts.push('UNFAIR ADVANTAGE: ' + (b.unfair_advantage_available_now || ''));
facts.push('WHY NOW: ' + (b.why_now_answer || ''));
facts.push('RECOMMENDED BUSINESS MODEL: ' + ((b.business_model || {}).recommended_model || ''));
facts.push('PATH TO 1M ARR: ' + ((b.business_model || {}).path_to_1M_ARR || ''));
facts.push('DANGEROUS ASSUMPTION: ' + ((b.business_model || {}).dangerous_assumption || ''));
facts.push('UNIT ECONOMICS WARNING: ' + ((b.business_model || {}).unit_economics_warning || ''));
facts.push('MOST LIKELY CAUSE OF DEATH: ' + ((b.contrarian_take || {}).most_likely_cause_of_death || ''));
facts.push('THE FATAL FLAW: ' + ((b.contrarian_take || {}).the_fatal_flaw || ''));
facts.push('COMPETITOR TO FEAR: ' + ((b.contrarian_take || {}).the_competitor_to_fear || ''));

let validate = (b.first_5_things_to_validate || []).join(' | ');
facts.push('FIRST 5 THINGS TO VALIDATE: ' + validate);

facts.push('RECOMMENDED HEADLINE: ' + (b.recommended_landing_page_headline || ''));
facts.push('HONEST VERDICT: ' + (b.honest_verdict_no_sugar_coating || ''));

let whatWinners = ((b.success_blueprint || {}).what_winners_had_in_common || []).join(' | ');
facts.push('WHAT WINNERS HAD IN COMMON: ' + whatWinners);

facts.push('INITIAL WEDGE: ' + ((b.success_blueprint || {}).the_initial_wedge_that_worked || ''));
facts.push('HOW FIRST 100 CUSTOMERS ACQUIRED: ' + ((b.success_blueprint || {}).how_first_100_customers_were_acquired || ''));
facts.push('DISTRIBUTION SECRET: ' + ((b.success_blueprint || {}).the_distribution_secret || ''));

let metadataArray = facts.map(function(f) {
  return {
    content: f,
    userId: {{triggerNode_1.output.userId}},
    sessionId: {{triggerNode_1.output.sessionId}}
  };
});

return {
  factsString: facts.join('\n\n'),
  factsArray: facts,
  metadataArray: metadataArray
};