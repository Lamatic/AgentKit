# Hackathon Project Mentor

## Overview

Hackathon Project Mentor is an AI-powered assistant designed to help hackathon teams transform ideas into practical, well-structured projects. It acts as a technical mentor by providing project planning, architecture guidance, feature prioritization, execution strategies, and presentation tips within the limited time available during a hackathon.

---

## Purpose

The primary goal of this agent is to help participants:

- Validate and refine hackathon ideas.
- Design scalable and practical system architectures.
- Prioritize MVP features.
- Organize development tasks efficiently.
- Prepare compelling demos and project pitches.
- Anticipate technical and product-related questions from judges.

---

## Workflow

The agent follows a simple conversational workflow:

```text
User Input
      │
      ▼
Chat Widget
      │
      ▼
Generate Text
      │
      ▼
Structured Hackathon Project Plan
```

The user provides details such as:

- Hackathon theme
- Project idea
- Team size
- Available time
- Tech stack
- Constraints or goals

The agent generates a structured response with actionable recommendations.

---

## Generated Sections

The response may include:

- Project Summary
- Problem Statement
- Target Users
- MVP Features
- Stretch Goals
- Recommended Tech Stack
- High-Level Architecture
- Database Suggestions
- Module/API Breakdown
- Team Task Allocation
- Development Timeline
- Demo Strategy
- Pitch Guidance
- Potential Judge Questions
- Risks & Mitigation
- Future Enhancements

---

## Guardrails

The agent is designed to:

- Provide practical and realistic recommendations.
- Focus on MVP-first development.
- Avoid unrealistic feature scopes for short hackathons.
- Adapt suggestions based on the provided team size, timeline, and technology stack.
- Clearly separate essential recommendations from optional enhancements.

The agent does **not**:

- Generate fabricated project results or claims.
- Guarantee winning outcomes.
- Replace technical decision-making by the development team.

---

## Ideal Use Cases

- College Hackathons
- Startup Weekends
- Innovation Challenges
- Internal Company Hackathons
- Student Team Project Planning

---

## Integrations

This template uses:

- Chat Widget
- Generate Text
- Chat Response

and is compatible with supported LLM providers configured within Lamatic.