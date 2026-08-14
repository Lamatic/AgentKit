# AccessLens — Permission Drift Auditor

AccessLens is a Lamatic AgentKit that detects authorization drift by comparing an organization's **intended access policy** against its **current access state**.

Instead of asking whether a permission is inherently dangerous, AccessLens asks a more practical security question:

> **Does the access that exists today still match the access that was intended?**

## The Problem

Access-control systems change constantly.

People change roles, permissions are added or removed, resources move between scopes, and access relationships can gradually diverge from the authorization model an organization intended to maintain.

Manually comparing policy definitions with IAM/RBAC exports is tedious and error-prone.

AccessLens turns that comparison into a repeatable audit.

## What AccessLens Detects

### Excess Access

Permissions that currently exist but are explicitly prohibited by the intended policy.

```text
INTENDED

Finance Analyst → Finance Reports → READ
Finance Analyst → Finance Reports → WRITE PROHIBITED

CURRENT

Finance Analyst → Finance Reports → READ, WRITE
```

## Setup

### Prerequisites

- A Lamatic account.
- Access to the AccessLens kit in Lamatic AgentKit.
- A configured generative model supported by your Lamatic environment.

### Model Configuration

Configure the generative model used by the Audit Permissions LLM node. The model configuration is defined in `model-configs/accesslens_audit_generative-model-name.ts`. Set the `generativeModelName` input to the model you want to use for the audit.

### Input Format

AccessLens expects two API inputs: `intended_policy` and `current_access`. Both fields are accepted as strings by the API trigger.

When providing structured policy or access data, serialize each JSON object as a JSON string before sending the request.

Example:

```json
{
  "intended_policy": "{\"roles\":[{\"role\":\"Finance Analyst\",\"resources\":[{\"resource\":\"Finance Reports\",\"permissions\":[\"READ\"],\"prohibited_permissions\":[\"WRITE\"]}]}]}",
  "current_access": "{\"roles\":[{\"role\":\"Finance Analyst\",\"resources\":[{\"resource\":\"Finance Reports\",\"permissions\":[\"READ\",\"WRITE\"]}]}]}"
}
```



### Running the Kit

Run the AccessLens flow through the Lamatic environment after configuring the model. The flow accepts the intended policy and current access through the API request trigger and returns the generated permission drift audit through the API response.

### Deployment

Deploy the kit through your Lamatic environment after configuring the required generative model. The flow can then be invoked through its API endpoint using the expected `intended_policy` and `current_access` inputs.
