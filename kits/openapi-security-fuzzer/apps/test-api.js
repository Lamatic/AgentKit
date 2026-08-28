import { Lamatic } from "lamatic";

async function test() {
  const lamaticClient = new Lamatic({
    endpoint: process.env.LAMATIC_API_URL || "https://api.lamatic.ai/v1",
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  });

  console.log("Testing with:");
  console.log("Endpoint:", process.env.LAMATIC_API_URL);
  console.log("ProjectId:", process.env.LAMATIC_PROJECT_ID);
  console.log("FlowId:", process.env.OPENAPI_PAYLOAD_GENERATOR);

  try {
    // Instead of using the SDK which hides the HTML, let's fetch manually to see the HTML!
    const specContent = JSON.stringify({
      "openapi": "3.0.0",
      "info": {
        "title": "E-Commerce User API",
        "version": "1.0.0"
      },
      "paths": {
        "/users/{userId}": {
          "get": {
            "summary": "Get user profile",
            "parameters": [
              { "name": "userId", "in": "path", "required": true, "schema": { "type": "integer" } }
            ],
            "responses": { "200": { "description": "User profile data" } }
          }
        },
        "/orders/checkout": {
          "post": {
            "summary": "Submit an order",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "itemId": { "type": "string" },
                      "quantity": { "type": "integer" },
                      "discountCode": { "type": "string" }
                    }
                  }
                }
              }
            },
            "responses": { "200": { "description": "Order successful" } }
          }
        }
      }
    });
    
    const graphqlQuery = {
      query: `query ExecuteWorkflow($workflowId: String!, $payload: JSON!) { executeWorkflow(workflowId: $workflowId, payload: $payload) { status result } }`,
      variables: {
        workflowId: process.env.OPENAPI_PAYLOAD_GENERATOR,
        payload: { openapiSpec: specContent }
      }
    };
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.LAMATIC_API_KEY}`,
      "x-project-id": process.env.LAMATIC_PROJECT_ID
    };

    const response = await fetch(process.env.LAMATIC_API_URL || "https://api.lamatic.ai/v1", {
      method: "POST",
      headers,
      body: JSON.stringify(graphqlQuery)
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response starts with:", text.substring(0, 100));
    
  } catch(e) {
    console.error(e);
  }
}

test();
