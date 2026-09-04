# Work Resumption Brief Agent

> Evidence-grounded temporal state reconstruction for interrupted development work

## Problem

Software development does not stop when a developer becomes unavailable. During an interruption, project information continues to change across multiple sources such as commits, issues, decisions, blockers, code changes, and action items.

When the developer returns, reconstructing the current state of the work manually can be difficult and time-consuming.

### What Problem Does It Solve?

The Work Resumption Brief Agent reconstructs the state of a software project after a period of interruption.

It processes work-related events from multiple sources, establishes their temporal order, resolves references to the same entities, detects conflicts and blockers, identifies actions, and produces a structured work-resumption brief.

### Why Is It Important?

Without an automated reconstruction process, a developer may need to:

- Read large numbers of project updates
- Determine which information is current
- Identify outdated decisions
- Compare conflicting sources
- Find unresolved blockers
- Determine what actions remain
- Reconstruct the sequence of events manually

This increases the time required to resume development and increases the risk of acting on outdated or incomplete information.

### Real-World Pain Points

Common situations include:

- A developer returns after several days away from a project.
- A decision was changed after an earlier message.
- Multiple sources contain contradictory information.
- Several blockers are active simultaneously.
- Different sources refer to the same project entity using different names.
- Several possible actions exist with different priorities.
- Available evidence is incomplete.
- The system must avoid presenting uncertain information as fact.

---

# Solution

The Work Resumption Brief Agent provides an evidence-grounded pipeline for reconstructing the current state of interrupted development work.

Instead of simply summarizing individual messages, the system processes the information as a temporal state-reconstruction problem.

## How It Solves the Problem

The agent:

1. Accepts work-related source information.
2. Normalizes the incoming data.
3. Resolves references to project entities.
4. Orders events temporally.
5. Detects contradictions and conflicts.
6. Identifies blockers and actions.
7. Extends source information when additional context is required.
8. Produces a structured API response containing the reconstructed state.

## What Makes It Different?

The system is designed around **evidence rather than unsupported assumptions**.

The agent distinguishes between:

- Known information
- Conflicting information
- Missing information
- Derived information
- Uncertain information

The central principle is:

> **Never manufacture certainty when the available evidence does not support it.**

---

# Key Features

- Multi-source work-event processing
- Source normalization
- Temporal event ordering
- Entity resolution
- Conflict detection
- Contradictory-source detection
- Outdated-decision detection
- Blocker identification
- Action identification
- Action prioritization
- Confidence scoring
- Source extension
- Structured API response
- Evaluation framework
- End-to-end testing
- Evidence-grounded output
- Explicit handling of insufficient evidence

---

# Architecture

The system is organized as an eight-component processing pipeline.

```text
                    ┌─────────────────────┐
                    │    API Request      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Multi-Source Input  │
                    │      Parser         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Source Normalization│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Entity Resolution   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Temporal Ordering   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Conflict Detection  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Source Extension    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Structured API      │
                    │      Response       │
                    └─────────────────────┘