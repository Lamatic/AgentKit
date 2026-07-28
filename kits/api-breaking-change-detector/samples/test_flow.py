import json
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# 1. Configuration from Environment Variables
API_URL = "https://sabeersorganization905-sabeersproject750.lamatic.dev/graphql"
BEARER_TOKEN = os.getenv("LAMATIC_API_KEY")
PROJECT_ID = os.getenv("LAMATIC_PROJECT_ID")
WORKFLOW_ID = os.getenv("LAMATIC_WORKFLOW_ID")

if not BEARER_TOKEN or not PROJECT_ID or not WORKFLOW_ID:
    raise ValueError("Missing required environment variables in .env file.")

# 2. Test Schemas
v1_schema = json.dumps({
    "endpoint": "/v1/users",
    "method": "POST",
    "request_body": {
        "user_id": "string",
        "email": "string",
        "age": "integer"
    }
})

v2_schema = json.dumps({
    "endpoint": "/v2/users",
    "method": "POST",
    "request_body": {
        "user_id": "string",
        "email": "string",
        "phone": "string"
    }
})

# 3. GraphQL Payload Construction
query = """
query ExecuteWorkflow($workflowId: String!, $v1_schema: String, $v2_schema: String) {
  executeWorkflow(workflowId: $workflowId, payload: { v1_schema: $v1_schema, v2_schema: $v2_schema }) {
    status
    result
  }
}
"""

payload = {
    "query": query,
    "variables": {
        "workflowId": WORKFLOW_ID,
        "v1_schema": v1_schema,
        "v2_schema": v2_schema
    }
}

headers = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "Content-Type": "application/json",
    "x-project-id": PROJECT_ID
}

# 4. Send Request
print("Triggering Lamatic Workflow...")
response = requests.post(API_URL, json=payload, headers=headers)

if response.status_code == 200:
    res_data = response.json()
    workflow_result = res_data.get("data", {}).get("executeWorkflow", {}).get("result", {})
    report = workflow_result.get("report", "No report field returned.")

    print("\n--- GENERATED REPORT ---")
    print(report)
else:
    print(f"❌ Error {response.status_code}: {response.text}")