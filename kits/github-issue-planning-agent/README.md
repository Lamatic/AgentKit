# IssuePilot – GitHub Issue Planning Agent

IssuePilot is an AI-powered planning workflow built for **Lamatic AgentKit**.

It transforms GitHub issues into structured engineering implementation plans, helping development teams understand, estimate, and execute work before coding begins.

---

## Why IssuePilot?

GitHub issues often contain incomplete requirements and unstructured descriptions.

IssuePilot converts them into:

- Business Goals
- Functional Requirements
- Technical Implementation Plan
- Backend / Frontend / Database Tasks
- Risk Analysis
- Sprint Blockers
- Testing Strategy
- Timeline Estimation
- Acceptance Criteria
- Definition of Done

Instead of asking **"How do we implement this?"**, engineering teams receive a structured execution plan before writing code.

---

# Prerequisites

Before using IssuePilot, ensure you have:

- A Lamatic.ai account
- Access to Lamatic Studio
- A configured LLM credential
- A GitHub issue to analyze

---

# Installation

1. Clone the AgentKit repository.

```bash
git clone https://github.com/Lamatic/AgentKit.git
```

2. Navigate to the kit.

```bash
cd kits/github-issue-planning-agent
```

3. Import or configure the flow in Lamatic Studio.

4. Configure your preferred LLM credential.

5. Save and deploy the workflow.

---

# Inputs

IssuePilot accepts:

| Field | Required | Description |
|-------|----------|-------------|
| issue_title | ✅ | GitHub issue title |
| issue_description | ✅ | Detailed issue description |
| labels | Optional | GitHub labels |
| tech_stack | Optional | Technologies used |
| repository_context | Optional | Additional repository information |

---

# Outputs

IssuePilot generates:

- Structured JSON implementation plan
- Engineering review
- Sprint readiness assessment
- Markdown engineering report

---

# Workflow

```text
GitHub Issue
      │
      ▼
Planning Agent
      │
      ▼
Engineering Review Agent
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
- Technical implementation planning
- Risk analysis
- Sprint blocker detection
- Sprint readiness evaluation
- Acceptance criteria generation
- Definition of Done generation
- Markdown engineering reports
- Structured JSON output

---

# Repository Structure

```text
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

Automatically create a new account during the first successful login.

---

# Example Output

IssuePilot produces:

- Business Goal
- Functional Requirements
- Missing Information
- Clarifying Questions
- Technical Approach
- Alternative Approach
- Backend Tasks
- Frontend Tasks
- Database Tasks
- Testing Tasks
- Deployment Tasks
- Timeline Estimate
- Risk Analysis
- Sprint Blockers
- Acceptance Criteria
- Definition of Done
- Sprint Readiness
- Confidence Score
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

Contains prompt templates for:

- Planning Agent
- Engineering Review Agent
- Markdown Formatter

---

## Schemas

Defines the structured JSON contract shared between every stage of the workflow.

---

## Evaluation

Contains golden test cases used to validate planning quality and output consistency.

---

## Examples

Provides real GitHub issue examples demonstrating expected planning behavior.

---

# Design Principles

IssuePilot follows these engineering principles:

- Understand before building.
- Never hallucinate requirements.
- Ask before assuming.
- Prefer maintainable solutions.
- Explain engineering trade-offs.
- Produce implementation-ready plans.

---

# Built With

- Lamatic AgentKit
- Gemini 2.5 Flash
- Structured JSON Schema
- Markdown Reports

---

# Future Improvements

- Repository context retrieval
- Automatic effort estimation
- GitHub Projects integration
- Jira export
- Sprint story generation
- Repository-aware planning

---

# License

MIT

---

Built for the **Lamatic AgentKit Challenge**.
