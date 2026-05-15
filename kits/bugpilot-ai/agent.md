# bugpilot-debugger

## Agent Overview

BugPilot Debugger is an AI-powered debugging assistant designed to help developers quickly identify, understand, and fix programming errors.

The agent accepts:

- Programming language
- Error message / stack trace
- Code snippet

and returns:

- Root cause analysis
- Beginner-friendly explanation
- Severity assessment
- Step-by-step debugging solution
- Corrected code example
- Prevention tips

The system is built using:

- Lamatic AI workflows
- Next.js frontend
- GraphQL API integration
- Groq / Gemini language models

---

# Purpose

The goal of BugPilot Debugger is to reduce debugging time for developers by providing fast, accurate, and educational bug analysis.

The agent is intended for:

- Students
- Junior developers
- Full-stack developers
- Backend engineers
- Frontend engineers
- Interview preparation
- Learning debugging best practices

---

# Flow Description

The project uses a Lamatic workflow consisting of three main nodes.

## 1. API Request Node

Receives incoming payload data from the frontend application.

Expected payload:

```json
{
  "language": "JavaScript",
  "error": "Cannot read properties of undefined",
  "codeSnippet": "const items = data.map(item => item.name)"
}
```
