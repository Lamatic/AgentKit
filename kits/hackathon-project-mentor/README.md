# Hackathon Project Mentor

An AI-powered Hackathon Project Mentor built with Lamatic that helps teams transform hackathon ideas into well-structured, execution-ready projects. It provides project planning, architecture guidance, feature prioritization, team task allocation, demo strategy, and pitch preparation to maximize success during time-constrained hackathons.

---

## Features

- 💡 Refines hackathon ideas into practical project plans
- 🏗️ Generates high-level system architecture
- 📋 Prioritizes MVP and stretch features
- 👥 Suggests team task allocation
- 📅 Creates development timelines based on hackathon duration
- 🗄️ Recommends database design and module breakdown
- 🎤 Provides demo strategy and pitch guidance
- ❓ Generates potential judge questions
- ⚠️ Identifies implementation risks and mitigation strategies

---

## Workflow

```text
Chat Widget
      │
      ▼
Generate Text
      │
      ▼
Chat Response
```

---

## Example Input

```text
Hackathon Theme:
Smart Cities

Idea:
Build an AI-powered traffic optimization platform.

Team Size:
4 Members

Duration:
36 Hours

Tech Stack:
React, FastAPI, PostgreSQL, Gemini API
```

---

## Example Output

The agent generates a structured project plan including:

- Project Summary
- Problem Statement
- Target Users
- MVP Features
- Bonus Features
- Recommended Tech Stack
- System Architecture
- Database Suggestions
- Module Breakdown
- Team Task Allocation
- Development Timeline
- Demo Strategy
- Pitch Tips
- Possible Judge Questions
- Risks & Mitigation
- Future Enhancements

---

## Use Cases

- College Hackathons
- Startup Weekends
- Innovation Challenges
- Internal Company Hackathons
- Student Project Planning

---

## Tech Stack

- Lamatic
- Groq (LLM Provider)
- Llama 3.3 70B (or compatible LLM)

---

## Setup

### Prerequisites

- A Lamatic account
- Access to Lamatic Studio
- A configured LLM provider (e.g., Groq)
- A supported language model (e.g., Llama 3.3 70B)

### Steps

1. Import or open the Hackathon Project Mentor flow in Lamatic Studio.
2. Configure your preferred LLM provider and model.
3. Deploy the flow.
4. Open the chat interface.
5. Provide your hackathon theme, project idea, team size, timeline, and tech stack.
6. Review the generated project plan, architecture, roadmap, and pitch guidance.

## License

This project is contributed as an AgentKit Template.