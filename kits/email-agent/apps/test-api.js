// API test script for debugging Lamatic flow execution
// Copy .env.example to .env.local and fill in your credentials before running
// Run: node test-api.js

import { config } from "./orchestrate.js";

const API_URL = process.env.LAMATIC_API_URL;
const PROJECT_ID = process.env.LAMATIC_PROJECT_ID;
const API_KEY = process.env.LAMATIC_API_KEY;
const FLOW_ID = process.env.EMAIL_VERIFIER_FLOW_ID;

if (!API_URL || !PROJECT_ID || !API_KEY || !FLOW_ID) {
  console.error("❌ Missing env vars. Copy .env.example → .env.local and fill in values.");
  process.exit(1);
}

const query = {
  query: `query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
    executeWorkflow(workflowId: $workflowId, payload: $payload) {
      status result
    }
  }`,
  variables: {
    workflowId: FLOW_ID,
    payload: { sender: "test@example.com", subject: "Test Subject", body: "Hello, this is a test." }
  }
};

console.log("\n=== Lamatic API Test ===");
console.log("URL:", API_URL);
console.log("Flow ID:", FLOW_ID);

fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "x-project-id": PROJECT_ID
  },
  body: JSON.stringify(query)
})
  .then(res => res.json())
  .then(data => {
    if (data?.data?.executeWorkflow?.status === "success") {
      console.log("\n✅ SUCCESS");
      console.log("Result:", JSON.stringify(data.data.executeWorkflow.result, null, 2));
    } else {
      console.log("\n❌ FAILED");
      console.log(JSON.stringify(data, null, 2));
    }
  })
  .catch(err => console.error("Error:", err.message));
