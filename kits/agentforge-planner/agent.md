# agentforge-planner

## Overview

agentforge-planner is an AI-powered planning assistant built using Lamatic AgentKit. It helps students, developers, startup founders, and hackathon teams transform software project ideas into structured implementation roadmaps.

Instead of generating generic suggestions, the agent analyzes a project idea and produces a practical development plan covering architecture, technology recommendations, implementation strategy, testing, deployment, and project feasibility.

---

## Purpose

The primary objective of this agent is to reduce the time required to plan software projects by providing:

- Clear project understanding
- Recommended technology stack
- System architecture guidance
- AI/ML integration suggestions
- Development roadmap
- Deployment recommendations
- Overall project evaluation

---

## Workflow

The agent follows this execution flow:

1. Accept a software project idea from the user.
2. Analyze the project requirements.
3. Recommend suitable technologies and frameworks.
4. Design a high-level system architecture.
5. Suggest AI models (when applicable).
6. Recommend database and API design.
7. Generate a phased implementation roadmap.
8. Provide testing and deployment guidance.
9. Return a final project evaluation.

---

## Guardrails

The agent is designed to:

- Provide educational and planning guidance only.
- Avoid generating harmful or unsafe software recommendations.
- Recommend practical and production-ready technologies.
- Produce structured, easy-to-follow responses.
- Encourage best software engineering practices.

---

## Integration

This AgentKit uses:

- Lamatic Flow
- Gemini Language Model
- Externalized Prompt Files
- Lamatic Constitutions
- Model Configuration References

The flow is exported from Lamatic Studio and follows the standard AgentKit project structure.