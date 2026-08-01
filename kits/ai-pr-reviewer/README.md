# AI PR Code Reviewer & Security Auditor

An agentic workflow built on **Lamatic.ai AgentKit** designed to automate Pull Request reviews. This agent acts as a first line of defense in CI/CD pipelines by analyzing code snippets or git diffs for security vulnerabilities and performance improvements.

## The Problem
Manual code reviews are time-consuming, and senior engineers often waste hours pointing out basic linting errors or missing security checks. 

## The Solution (This Agent)
By integrating this AgentKit flow into a webhook or CI pipeline, development teams get instant, structured feedback on their code before a human ever looks at it.

## Features
- **Security Audit:** Flags OWASP top 10 vulnerabilities (e.g., SQL injection, hardcoded secrets).
- **Code Optimization:** Suggests specific refactors for time/space complexity.
- **Structured JSON Output:** Returns actionable data that can be parsed directly into GitHub PR comments.

## Workflow Structure
1. **Trigger:** Receives raw code or a git diff.
2. **Review Node (LLM):** A highly constrained prompt evaluates the code against strict engineering standards.
3. **Formatting Node:** Outputs a structured JSON payload with `vulnerabilities`, `refactor_suggestions`, and a `pass_fail` boolean.
