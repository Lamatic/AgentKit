# ScalePilot

## About This Flow

ScalePilot is an AI-powered Software Architecture Review Assistant built with Lamatic.ai. It analyzes software architectures described in natural language, identifies missing architectural information, asks follow-up questions when required, and generates a structured Architecture Evolution Report with actionable recommendations.

This template is designed for software engineers, architects, startups, and development teams who want to evaluate and improve their existing system architecture.

---

## Flow Components

This workflow consists of the following nodes:

- Chat Trigger
- Generate JSON
- Condition
- Generate Text (Follow-up Questions)
- Generate Text (Architecture Evolution Report)
- Chat Response

These nodes work together to collect architectural information, validate completeness, and generate a comprehensive architecture review.

---

## Files Included

This template includes:

- `flows/` – Exported Lamatic flow definition
- `prompts/` – Prompt templates used by the LLM nodes
- `model-configs/` – Model configuration files
- `constitutions/` – AI behavior and guardrail definitions
- `lamatic.config.ts` – Template metadata
- `agent.md` – Agent overview and capabilities
- `README.md` – Documentation

---

## Features

- Analyze software architectures from natural language
- Extract key architectural components
- Detect missing architectural information
- Ask intelligent follow-up questions
- Identify scalability risks and bottlenecks
- Generate structured Architecture Evolution Reports
- Built using Lamatic AgentKit

---

## Usage

1. Import this template into your Lamatic workspace.
2. Configure your preferred AI model and required credentials.
3. Deploy the flow from Lamatic Studio.
4. Test the flow using the Chat Trigger.
5. Integrate the deployed flow into your application if required.

---

## Example

### Input

```text
We have a React frontend, Node.js backend, PostgreSQL database, and around 5,000 users. The application becomes slow during flash sales.
```

### Output

If required information is missing, ScalePilot asks follow-up questions such as:

- Which cloud provider are you using?
- Are you using a caching layer?
- Is the application containerized?
- Are background jobs handled through a message queue?

Once sufficient information is available, the assistant generates a comprehensive Architecture Evolution Report containing:

- Architecture Summary
- Strengths
- Risks and Bottlenecks
- Scalability Recommendations
- Security Recommendations
- Infrastructure Improvements
- Suggested Next Steps

---

## Use Cases

ScalePilot can be used for:

- Software architecture reviews
- System design validation
- Technical due diligence
- Scalability assessments
- Cloud migration planning
- Engineering design discussions

---

## Support

For questions or improvements:

- Review the Lamatic documentation.
- Open an issue in the AgentKit repository.
- Contribute enhancements through a Pull Request.

---

## Tags

software-architecture, system-design, ai, architecture-review

---

*Built with Lamatic AgentKit.*