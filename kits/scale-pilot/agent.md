# ScalePilot

## Agent Overview

ScalePilot is an AI-powered Software Architecture Review Assistant built with Lamatic. It helps developers evaluate their existing software architecture by analyzing natural language descriptions, identifying missing information, and generating a structured Architecture Evolution Report with recommendations for scalability, reliability, and performance.

## Purpose

The goal of ScalePilot is to simplify early-stage architecture reviews. Instead of manually inspecting architecture documents or making assumptions, the agent gathers the required context, asks follow-up questions when necessary, and provides actionable insights to improve the overall system design.

## Flow Description

1. **Architecture Input** – The user describes their existing software architecture in natural language.
2. **Architecture Parsing** – The flow extracts key architectural components such as frontend, backend, database, infrastructure, deployment, caching, and expected scale.
3. **Missing Information Detection** – If essential details are missing, the agent asks follow-up questions instead of generating incomplete recommendations.
4. **Architecture Analysis** – Once sufficient information is available, the architecture is evaluated for potential bottlenecks, risks, and improvement opportunities.
5. **Report Generation** – The agent generates a structured Architecture Evolution Report containing observations, risks, and recommended improvements.

## Guardrails

- The agent only analyzes the information provided by the user.
- Missing architectural details are collected through follow-up questions instead of assumptions.
- Recommendations are based on the supplied architecture description.
- The workflow is intended for architecture analysis and planning, not production deployment automation.

## Integration Reference

To run this agent, configure the following environment variables:

- `LAMATIC_PROJECT_API_KEY`
- `LAMATIC_PROJECT_ENDPOINT`
- `LAMATIC_PROJECT_ID`
- `LAMATIC_FLOW_ID`