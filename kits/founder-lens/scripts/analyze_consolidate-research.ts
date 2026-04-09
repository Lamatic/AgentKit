function exaText(apiResult, limit) {
  let data = apiResult || {};
  let results = data.results || [];
  return results.slice(0, limit || 5).map(function(r) {
    let title = r.title || '';
    let url = r.url || '';
    let text = r.text || '';
    return '--- SOURCE: ' + url + '\nTITLE: ' + title + '\nCONTENT:\n' + text + '\n';
  }).join('\n');
}

let marketData   = exaText({{apiNode_market.output}});
let vcData       = exaText({{apiNode_vctrends.output}});
let compData     = exaText({{apiNode_competitors.output}});
let deadData     = exaText({{apiNode_dead.output}});
let customerData = exaText({{apiNode_customer.output}}, 8);
let reviewData   = exaText({{apiNode_reviews.output}}, 8);
let twitterData  = exaText({{apiNode_twitter.output}}, 10);
let successData  = exaText({{apiNode_success.output}});
let bizData      = exaText({{apiNode_bizmodel.output}});
let unfairData   = exaText({{apiNode_unfair.output}});

return {
  phase1_market:      'MARKET SIZE & RESEARCH:\n' + marketData + '\n\nVC INVESTMENT SIGNALS:\n' + vcData,
  phase2_competitive: 'DIRECT COMPETITORS:\n' + compData + '\n\nDEAD COMPETITORS & POSTMORTEMS:\n' + deadData,
  phase3_customer:    'CUSTOMER COMPLAINTS (Reddit, G2, HN):\n' + customerData + '\n\nREVIEW SITE DEEP READ:\n' + reviewData + '\n\nTWITTER/X REAL-TIME COMPLAINTS:\n' + twitterData,
  phase4_success:     'SUCCESS STORIES (Indie Hackers, HN, TechCrunch):\n' + successData,
  phase5_unfair:      'UNFAIR ADVANTAGE SIGNALS:\n' + unfairData,
  phase6_bizmodel:    'BUSINESS MODEL & UNIT ECONOMICS:\n' + bizData
};