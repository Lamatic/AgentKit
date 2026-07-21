const url = 'https://toufiqsorganization806-toufiqsproject110.lamatic.dev/graphql';
const headers = {
  'Authorization': 'Bearer lt-bf47031c809712b6ded78b9efa7b3d41',
  'Content-Type': 'application/json',
  'x-project-id': '4fe2d93e-31f4-4b81-b705-41b7887c860d'
};
const q1 = {
  query: 'query ExecuteWorkflow($workflowId: String!, $reviewText: String, $starRating: String) { executeWorkflow(workflowId: $workflowId, payload: { reviewText: $reviewText, starRating: $starRating }) { status result } }',
  variables: { workflowId: 'b2a918fb-7253-497e-8b3f-31feaece751c', reviewText: 'hello', starRating: '5' }
};
const q2 = {
  query: 'query ExecuteWorkflow($workflowId: String!, $reviewText: String, $starRating: String) { executeWorkflow(workflowId: $workflowId, payload: { reviewText: $reviewText, starRating: $starRating }) { status result } }',
  variables: { workflowId: 'my-first-flow', reviewText: 'hello', starRating: '5' }
};
async function test() {
  console.log('Testing Q1 (497c):');
  const r1 = await fetch(url, { method: 'POST', headers, body: JSON.stringify(q1) });
  console.log(r1.status, await r1.text());
  
  console.log('Testing Q2 (497c):');
  const r2 = await fetch(url, { method: 'POST', headers, body: JSON.stringify(q2) });
  console.log(r2.status, await r2.text());
}
test();
