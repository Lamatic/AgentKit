# ScalePilot

## Overview

ScalePilot is an AI-powered Software Architecture Review Assistant built with Lamatic.ai. It analyzes software architectures described in natural language, identifies missing architectural information, asks follow-up questions when required, and generates a structured Architecture Evolution Report with actionable recommendations.

The flow is implemented as a **single-flow** AgentKit template that guides users through architecture analysis without making assumptions about incomplete system designs.

---

## Purpose

The goal of ScalePilot is to simplify software architecture reviews by helping engineering teams evaluate their existing systems before scaling or redesigning them.

Instead of requiring detailed architecture documents, the agent understands natural language descriptions, collects any missing information through follow-up questions, and generates practical recommendations for improving scalability, reliability, performance, and maintainability.

Because this project is a template, it can be adapted to different software architectures, technology stacks, and deployment environments while keeping the same overall review workflow.

---

## Flows

### ScalePilot

- **Flow identifier:** `scale-pilot`
- **Node chain:**

```
Chat Trigger
    |
Generate JSON
    |
Condition
   /        \
Follow-up   Architecture Report
Questions
   \        /
 Chat Response
```

### Trigger

- **Invocation:** Chat/API Trigger
- **Trigger node:** Chat Trigger

### Expected Input

A natural language description of an existing software architecture, for example:

- Frontend technology
- Backend technology
- Database
- Infrastructure
- Deployment strategy
- User scale
- Performance challenges
- Caching
- Background jobs
- Cloud provider

---

### What It Does

1. Receives the user's architecture description.
2. Extracts important architectural components into structured JSON.
3. Detects whether essential architectural information is missing.
4. If information is incomplete, generates targeted follow-up questions.
5. If sufficient information is available, analyzes the architecture.
6. Generates a structured Architecture Evolution Report containing observations, risks, bottlenecks, and recommendations.

---

### When to Use This Flow

Use ScalePilot when you need to:

- Review an existing software architecture.
- Identify scalability bottlenecks.
- Detect missing architectural information.
- Prepare for system redesigns.
- Evaluate architecture before scaling.
- Generate architecture review reports automatically.

---

### Output

Depending on the available information, the flow returns either:

#### Follow-up Questions

A concise list of questions requesting only the missing architectural details.

OR

#### Architecture Evolution Report

A structured report including:

- Architecture Summary
- Current Strengths
- Risks & Bottlenecks
- Scalability Recommendations
- Reliability Improvements
- Performance Suggestions
- Infrastructure Recommendations
- Next Steps

---

### Dependencies

- LLM Provider
- Prompt templates in `prompts/`
- Model configuration in `model-configs/`
- AI constitutions in `constitutions/`

---

## Flow Interaction

This project contains a single flow (`scale-pilot`).

All architecture review requests are routed directly through this flow, which handles architecture parsing, completeness validation, follow-up generation, and report generation in a single request/response cycle.

---

## Guardrails

### Prohibited Tasks

- Must not fabricate architectural details.
- Must not assume missing infrastructure components.
- Must not generate misleading recommendations based on incomplete information.
- Must not produce harmful or unsafe guidance.

### Input Constraints

- Input should describe a software architecture.
- Incomplete architectures should trigger follow-up questions.
- User input should be treated as the only source of architectural information.

### Output Constraints

- Recommendations must be based only on the provided architecture.
- Reports should remain structured and professional.
- Missing information should never be guessed.

---

## Environment Setup

Before deploying the template:

- Configure your preferred LLM provider.
- Configure the required model credentials.
- Import the template into Lamatic Studio.
- Deploy the flow.

---

## Quickstart

1. Import the ScalePilot template into your Lamatic workspace.
2. Configure your preferred AI model.
3. Deploy the flow.
4. Test using the Chat Trigger.
5. Integrate the deployed flow with your application if required.

---

## Common Failure Modes

| Symptom | Likely Cause | Suggested Fix |
|----------|--------------|---------------|
| Repeated follow-up questions | Insufficient architecture information | Provide additional architectural details |
| Generic recommendations | Architecture description lacks important components | Include deployment, infrastructure, caching, and scale information |
| Incomplete report | Missing required architecture fields | Answer the follow-up questions before requesting the report |

---

## Notes

- Project type: `template`
- Flow: `scale-pilot`
- Version: `1.0.0`
- Author: **Samakcha Mishra**
- Tags: `software-architecture`, `system-design`, `ai`, `architecture-review`