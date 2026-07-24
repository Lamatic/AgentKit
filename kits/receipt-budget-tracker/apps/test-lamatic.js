/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
// Load environment variables if dotenv is available (optional)
try {
  require('dotenv').config();
} catch (e) {}

async function testUserAgent() {
  const apiKey = process.env.LAMATIC_API_KEY;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const flowId = process.env.RECEIPT_TRACKER_FLOW_ID;

  if (!apiKey || !projectId || !flowId) {
    console.error("Error: Missing required environment variables. Please set LAMATIC_API_KEY, LAMATIC_PROJECT_ID, and RECEIPT_TRACKER_FLOW_ID.");
    process.exit(1);
  }

  const urls = [
    process.env.LAMATIC_API_URL || "https://api.lamatic.ai",
    "https://inference-api.lamatic.tech/graphql"
  ];

  const graphqlQuery = {
    query: `query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
      executeWorkflow(workflowId: $workflowId, payload: $payload) {
        status
        result
      }
    }`,
    variables: {
      workflowId: flowId,
      payload: {
        output: "Hello testing User-Agent"
      }
    }
  };

  for (const url of urls) {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "x-project-id": projectId,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    console.log(`\nTesting: ${url} with User-Agent...`);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(graphqlQuery)
      });
      console.log(`STATUS: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`BODY (first 200 chars): ${text.substring(0, 200) || "(empty)"}`);
    } catch (err) {
      console.error(`ERROR:`, err.message);
    }
  }
}

testUserAgent();
