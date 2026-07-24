# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Open-source maintainers and contributors investigating terminal or CLI issues that describe a symptom without reliable reproduction steps.

## Product Purpose

Isolate turns a public GitHub issue into repeatable, machine-verifiable reproduction evidence inside a disposable sandbox. Success means a maintainer can distinguish an observed bug from an unsupported agent claim and reuse the recorded commands and evidence.

## Positioning

The AI investigates and proposes probes, while an independent deterministic runtime executes assertions and exclusively owns the final reproduction classification.

## Operating Context

The primary workflow begins with a public GitHub issue URL, uses a Lamatic agent for investigation, executes commands in Daytona, and returns a report containing candidate runs, a negative control, stdout, stderr, exit codes, and durations.

## Capabilities and Constraints

- Public GitHub repositories only.
- Initial scope is Node.js, TypeScript, Bun, and terminal/CLI failures.
- Sandboxes are private, disposable, and time bounded.
- No fix generation, publishing, repository credentials, pushes, or pull requests.
- A reproduced outcome requires two passing candidate runs and a rejecting control.
- Issue content and repository content are untrusted input.

## Brand Commitments

The product name is Isolate. Product language must separate investigation from verification and avoid implying that an LLM can certify its own result.

## Evidence on Hand

- A production MCP runtime at `https://isolate-agentkit.vercel.app/api/mcp`.
- A controlled public CLI testbed and vague GitHub issue.
- A completed Daytona reproduction with two candidate passes and a rejecting control.

## Product Principles

- Proof over advice.
- Deterministic certification over model confidence.
- Visible evidence over hidden reasoning.
- Safe, disposable execution by default.
- Honest blocked and not-reproduced outcomes.

## Accessibility & Inclusion

The web workflow must remain usable by keyboard, preserve readable terminal output, expose status without color alone, and adapt to narrow mobile screens.
