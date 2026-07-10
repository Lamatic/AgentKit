#  IssuePilot – GitHub Issue Planning Agent

IssuePilot is an AI-powered planning workflow built for **Lamatic AgentKit**.

It transforms GitHub issues into structured engineering implementation plans, helping development teams understand, estimate, and execute work before coding begins.

---

##  Why IssuePilot?

GitHub issues often contain incomplete requirements and unstructured descriptions.

IssuePilot converts them into:

-  Business Goals
-  Functional Requirements
-  Technical Implementation Plan
-  Backend / Frontend / Database Tasks
-  Risks & Sprint Blockers
-  Testing Strategy
-  Timeline Estimation
-  Acceptance Criteria
-  Definition of Done

Instead of asking "How do we implement this?", engineering teams receive a structured execution plan.

---

# Workflow

```text
GitHub Issue
      │
      ▼
Planning Agent
      │
      ▼
Engineering Review
      │
      ▼
Markdown Formatter
      │
      ▼
Engineering Report
```

---

# Features

- Structured engineering planning
- Functional requirement extraction
- Technical approach recommendations
- Sprint readiness evaluation
- Risk analysis
- Acceptance criteria generation
- Definition of Done generation
- Markdown engineering reports

---

# Repository Structure

```
github-issue-planning-agent/
│
├── agent.md
├── README.md
├── lamatic.config.ts
│
├── constitutions/
├── evaluation/
├── examples/
├── flows/
├── model-configs/
├── prompts/
├── schemas/
└── scripts/
```

---

# Example Input

## Title

Add Google OAuth Login

## Description

Users should be able to sign in using Google.

Existing email/password authentication should continue working.

Automatically create new users on first login.

---

# Example Output

IssuePilot produces:

- Business Goal
- Functional Requirements
- Technical Plan
- Backend Tasks
- Frontend Tasks
- Database Tasks
- Testing Plan
- Deployment Tasks
- Risks
- Sprint Readiness
- Acceptance Criteria
- Definition of Done
- Markdown Engineering Report

---

# Use Cases

- Sprint Planning
- Issue Refinement
- Backlog Grooming
- Engineering Documentation
- Technical Discovery
- Development Planning

---

# Project Structure

## Prompts

Contains reasoning prompts for:

- Planning Agent
- Engineering Review Agent
- Formatter Agent

---

## Schemas

Defines the structured output contract shared between agents.

---

## Evaluation

Golden test cases used to validate planning quality.

---

## Examples

Example GitHub issues demonstrating expected planning output.

---

# Design Principles

IssuePilot follows these principles:

- Understand before building.
- Never hallucinate missing requirements.
- Prefer maintainable solutions.
- Make assumptions explicit.
- Produce implementation-ready engineering plans.

---

# Built With

- Lamatic AgentKit
- Gemini 2.5 Flash
- Structured JSON Output
- Markdown Reports

---

# Future Improvements

- Repository context retrieval
- Automatic effort estimation
- GitHub Projects integration
- Jira export
- Sprint story generation

---

# License

MIT

---

Built for the **Lamatic AgentKit Challenge**.