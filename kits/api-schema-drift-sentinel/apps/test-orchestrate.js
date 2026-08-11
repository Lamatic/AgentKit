const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const axios = require('axios');
const jiti = require('jiti')(__dirname);
const { runOpenApiDiff, normalizeDiff } = jiti('./lib/sentinel');

// Spec V1: Baseline
const v1 = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "User Service API", version: "1.0.0" },
  paths: {
    "/users/{id}": {
      get: {
        summary: "Get user details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": {
            description: "User found",
            content: { "application/json": { schema: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, email: { type: "string" } } } } }
          }
        }
      }
    }
  }
});

// Spec V2 Additive: Non-breaking additive changes
const v2Additive = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "User Service API", version: "2.0.0" },
  paths: {
    "/users/{id}": {
      get: {
        summary: "Get user details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": {
            description: "User found",
            content: { "application/json": { schema: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, email: { type: "string" }, full_name: { type: "string" } } } } }
          }
        }
      }
    }
  }
});

// Spec V2 Breaking: Property removed and parameter type changed
const v2Breaking = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "User Service API", version: "2.0.0" },
  paths: {
    "/users/{id}": {
      get: {
        summary: "Get user details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "User found",
            content: { "application/json": { schema: { type: "object", properties: { id: { type: "integer" } } } } }
          }
        }
      }
    }
  }
});


const axiosClient = axios.create({ timeout: 15000 });

async function triggerWorkflowAndPoll(compactPayload) {
  const executeQuery = `
    query ExecuteWorkflow($workflowId: String!, $sampleInput: String) {
      executeWorkflow(
        workflowId: $workflowId
        payload: {
          sampleInput: $sampleInput
        }
      ) {
        status
        result
      }
    }
  `;

  const statusQuery = `
      query CheckStatus($requestId: String!) {
        checkStatus(requestId: $requestId)
      }
    `;

  const response = await axiosClient({
    method: 'POST',
    url: process.env.LAMATIC_API_URL,
    headers: {
      'Authorization': `Bearer ${process.env.LAMATIC_API_KEY}`,
      'Content-Type': 'application/json',
      'x-project-id': process.env.LAMATIC_PROJECT_ID
    },
    data: {
      query: executeQuery,
      variables: {
        workflowId: process.env.LAMATIC_DRIFT_FLOW_ID,
        sampleInput: JSON.stringify(compactPayload)
      }
    }
  });

  const requestId = response.data?.data?.executeWorkflow?.result?.requestId;
  if (!requestId) {
    console.error("Execute Workflow Failed. Response:", JSON.stringify(response.data, null, 2));
    return null;
  }

  console.log(`Request ID: ${requestId}. Polling for completion...`);

  let completed = false;
  let attempts = 0;

  while (!completed && attempts < 20) {
    attempts++;
    await new Promise(res => setTimeout(res, 3000));

    const statusResponse = await axiosClient({
      method: 'POST',
      url: process.env.LAMATIC_API_URL,
      headers: {
        'Authorization': `Bearer ${process.env.LAMATIC_API_KEY}`,
        'Content-Type': 'application/json',
        'x-project-id': process.env.LAMATIC_PROJECT_ID
      },
      data: {
        query: statusQuery,
        variables: { requestId }
      }
    });

    const rawResult = statusResponse.data?.data?.checkStatus;
    let parsedData;

    if (typeof rawResult === 'string') {
      try {
        parsedData = JSON.parse(rawResult);
      } catch (err) {
        parsedData = {
          executiveSummary: rawResult,
          impactAssessment: 'Narrative delivered in plain text format.',
          migrationGuide: 'Refer to deterministic table changes.',
        };
      }
    } else {
      parsedData = rawResult;
    }
    const analysisOutput = parsedData?.data?.output?.result?.analysis;

    if (parsedData?.status === 'success' && analysisOutput) {
      return analysisOutput;
    } else if (parsedData?.status === 'in-progress') {
      console.log(`Job in progress... (Attempt ${attempts}/20)`);
    } else if (parsedData) {
      return parsedData;
    }
  }
  return null;
}

async function runMatrixTests() {
  console.log("==========================================");
  console.log("STEP 1: Verify Production Normalization via sentinel.ts");
  console.log("==========================================");

  const mockBreakingDiff = {
    breakingDifferences: [
      {
        code: "response.body.scope.add",
        entity: "response.body.scope",
        sourceSpecEntityDetails: [{ location: "paths./users/{id}.get" }],
        details: {
          differenceSchema: {
            anyOf: [
              { required: ["name"] },
              { required: ["email"] }
            ]
          }
        }
      }
    ]
  };

  const normalizedMock = normalizeDiff(mockBreakingDiff);
  console.log("Verified Mock Breaking Changes Normalization Output:");
  console.log(JSON.stringify(normalizedMock, null, 2));

  console.log("\n==========================================");
  console.log("STEP 2: Matrix Execution");
  console.log("==========================================");

  // Test Case A: Additive (Non-breaking Baseline)
  console.log("\n--- TEST CASE A: Additive (Non-Breaking) ---");
  const diffAdditive = await runOpenApiDiff(v1, v2Additive);
  const factsAdditive = normalizeDiff(diffAdditive, v1, v2Additive);
  const payloadAdditive = {
    apiName: "User Service API",
    oldVersion: "1.0.0",
    newVersion: "2.0.0",
    changesCount: factsAdditive.totalBreaking,
    changes: factsAdditive.allChanges
  };
  console.log("Additive Normalized Payload:", JSON.stringify(payloadAdditive, null, 2));

  if (factsAdditive.totalBreaking !== 0) {
    throw new Error(`Test Case A assertion failed: expected 0 breaking changes, got ${factsAdditive.totalBreaking}`);
  }
  if (factsAdditive.totalNonBreaking < 1) {
    throw new Error(`Test Case A assertion failed: expected at least 1 non-breaking change, got ${factsAdditive.totalNonBreaking}`);
  }

  console.log("Triggering Lamatic Workflow for Additive Test Case...");
  const resultAdditive = await triggerWorkflowAndPoll(payloadAdditive);
  console.log("Additive Test Result Output:", JSON.stringify(resultAdditive, null, 2));

  // Test Case B: Breaking Removal & Type Change
  console.log("\n--- TEST CASE B: Breaking Removal & Type Change ---");
  const diffBreaking = await runOpenApiDiff(v1, v2Breaking);
  const factsBreaking = normalizeDiff(diffBreaking, v1, v2Breaking);

  console.log(
    "FULL OPENAPI DIFF:",
    JSON.stringify(diffBreaking, null, 2)
  );

  const payloadBreaking = {
    apiName: "User Service API",
    oldVersion: "1.0.0",
    newVersion: "2.0.0",
    changesCount: factsBreaking.totalBreaking,
    changes: factsBreaking.allChanges
  };
  console.log("Breaking Normalized Payload:", JSON.stringify(payloadBreaking, null, 2));

  if (factsBreaking.totalBreaking !== 3) {
    throw new Error(`Test Case B assertion failed: expected 3 breaking changes, got ${factsBreaking.totalBreaking}`);
  }
  if (factsBreaking.calculatedRisk !== 'HIGH') {
    throw new Error(`Test Case B assertion failed: expected HIGH risk, got ${factsBreaking.calculatedRisk}`);
  }

  console.log("Triggering Lamatic Workflow for Breaking Test Case...");
  const resultBreaking = await triggerWorkflowAndPoll(payloadBreaking);
  console.log("Breaking Test Result Output:", JSON.stringify(resultBreaking, null, 2));

  console.log("\n✅ ALL MATRIX TEST ASSERTIONS PASSED CLEANLY!");
}

runMatrixTests();
