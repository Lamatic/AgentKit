# AI Database Release Planner

## Overview

AI Database Release Planner is a multi-agent AI system built with Lamatic AgentKit for analyzing SQL database migrations and producing a final release report.

The project is designed to help teams review database changes before release, with a focus on understanding the migration, assessing runtime behavior, choosing a deployment strategy, and deciding whether the release should proceed.

## Problem Statement

SQL migration scripts can be difficult to evaluate quickly and consistently, especially when a release may affect production availability, locking behavior, rollback complexity, or data safety.

This project organizes that review into a structured agent pipeline so the migration can be analyzed step by step before a release decision is made.

## Features

- Migration Understanding Agent for SQL schema analysis.
- Behavior Analysis Agent for PostgreSQL runtime behavior assessment.
- Deployment Strategy Agent for release planning recommendations.
- Release Decision Agent for approval and rollback guidance.
- Structured JSON contracts between every pipeline stage.
- Multi-agent workflow built with Lamatic AgentKit.

## Architecture

The project is implemented as a Lamatic AgentKit workflow with a clear, sequential agent chain.

The system follows a sequential multi-agent architecture where each agent performs a single responsibility and appends its analysis to a structured JSON output. This separation of concerns improves maintainability, traceability, and extensibility.

Each agent receives the previous agent's JSON output, appends its own analysis, and passes the enriched result to the next stage.

![Architecture](assets/diagrams/architecture.svg)

Current stack information reflected in the project is:

- Lamatic AgentKit
- React
- TypeScript
- JSON Schema

## Agent Pipeline

```text
SQL Migration
↓
Migration Understanding Agent
↓
Behavior Analysis Agent
↓
Deployment Strategy Agent
↓
Release Decision & Rollback Advisor
↓
Final Release Report
```

## Project Structure

```text
production-database-release-planner/
├── apps/
├── assets/
│   ├── diagrams/
│   └── screenshots/
├── docs/
├── examples/
│   ├── input/
│   └── expected-output/
├── flows/
├── prompts/
├── schemas/
│   ├── migration-understanding.schema.json
│   ├── behavior-analysis.schema.json
│   ├── deployment-strategy.schema.json
│   └── release-plan.schema.json
├── lamatic.config.ts
└── README.md
```

## Example Workflow

1. Provide an SQL migration input file in examples/input/.
2. Run the migration through the agent pipeline.
3. Review the generated outputs and release recommendation.
4. Compare the result with the reference output in examples/expected-output/.

## Documentation

Available documentation:

- docs/architecture.md
- docs/pipeline.md
- docs/design-decisions.md
- docs/roadmap.md

Examples directory:

```text
examples/
├── input/
└── expected-output/
```

## Status

🚧 Active Development

Current focus:

- Refining agent prompts
- Improving evaluation accuracy
- Expanding migration test cases
- Enhancing documentation

## Future Work

- Support additional database engines beyond PostgreSQL.
- Expand migration pattern coverage.
- Improve agent evaluation accuracy.
- Add automated schema validation.
- Introduce policy-based release approval.
- Support additional database engines (MySQL, SQLite, SQL Server).
- Integrate automated migration validation and policy enforcement.

## License

MIT