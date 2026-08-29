## Setup

1. Sign up for a [Lamatic](https://lamatic.ai) account and create a new project.
2. Add a Gemini API key as a credential in your Lamatic project, using a key from [Google AI Studio](https://aistudio.google.com/).
3. Import this flow into Lamatic Studio (or recreate it using the provided flow config).
4. Deploy the flow — this exposes a GraphQL API endpoint.

### Example request (Node.js)

```js
const axios = require('axios');

const query = `
  query ExecuteWorkflow($workflowId: String!, $defectDescription: String) {
    executeWorkflow(
      workflowId: $workflowId
      payload: { defectDescription: $defectDescription }
    ) {
      status
      result
    }
  }
`;

const response = await axios.post(
  'https://sharveshsorganization130-sharveshsproject666.lamatic.dev',
  {
    query,
    variables: {
      workflowId: 'd5571cb3-aa4b-4db6-a341-d75d4f239827',
      defectDescription: 'crack on panel, 3cm long, left corner, near mounting bracket'
    }
  },
  { headers: { Authorization: `Bearer ${process.env.LAMATIC_API_KEY}` } }
);

console.log(response.data);
```

### Example response

```json
{
  "severity": "high",
  "root_cause_hypothesis": "Excessive stress applied during mounting bracket installation or material weakness near the corner.",
  "recommended_action": "rework",
  "reasoning": "The defect is a 3cm crack on the panel near a mounting bracket, which structurally compromises the component and requires intervention. A rework or rejection is necessary, making 'high' severity and 'rework' appropriate given standard manufacturing triage guidelines for structural panel cracks."
}
```