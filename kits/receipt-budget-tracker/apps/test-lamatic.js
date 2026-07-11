async function testUserAgent() {
  const apiKey = "lt-08e1450dc4ed752d6986425e95d8884a";
  const projectId = "22b9b38d-86ff-4f84-ba18-f2661cef2852";
  const flowId = "ce17fa46-f851-40eb-b082-a4e7d6cd8f41";

  const urls = [
    "https://api.lamatic.ai",
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
