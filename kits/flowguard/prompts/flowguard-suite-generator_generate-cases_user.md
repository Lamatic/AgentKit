Design a test suite for the following target flow.

## Target flow description
{{triggerNode_1.output.flowDescription}}

## Target input schema (JSON)
{{triggerNode_1.output.inputSchema}}

## Sample input
{{triggerNode_1.output.sampleInput}}

## Sample output
{{triggerNode_1.output.sampleOutput}}

## How many cases
Generate approximately {{triggerNode_1.output.numCases}} cases in total.

## Category quotas
Distribute the cases across these categories (roughly even unless a category is clearly not applicable to this flow): {{triggerNode_1.output.categories}}

Return a single JSON object of the form:
{ "cases": [ { "category": "...", "input": { ... }, "expectedBehavior": "...", "rationale": "..." } ] }

Each `input` must be a valid object for the target's input schema. `expectedBehavior` must be a behavioral oracle, never an exact-match string.
