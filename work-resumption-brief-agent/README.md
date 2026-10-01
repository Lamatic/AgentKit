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

The implemented system uses an 8-component processing pipeline:

1. **Parser** — Normalizes supported source types into a common event representation.

2. **Temporal Ordering** — Establishes chronological ordering with deterministic ordering rules.

3. **Entity Resolution + Conflict Detection** — Resolves references to the same entities and identifies contradictions.

4. **Evidence Collection** — Collects supporting evidence and calculates confidence.

5. **State Reconstruction** — Reconstructs the current state of work.

6. **Blocker Identification** — Identifies blockers and assesses downstream impact.

7. **Action Prioritization** — Generates and ranks candidate next actions.

8. **Brief Generation** — Produces the structured work-resumption brief and API response.

The components operate as a staged pipeline. Some components perform multiple related processing operations, so individual operations such as source normalization, conflict detection, action generation, and confidence calculation are not counted as additional pipeline components.

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
- Compound entity resolution
- Conflict detection
- Contradictory-source detection
- Outdated-decision handling
- Blocker identification
- Downstream impact assessment
- Evidence collection
- Confidence scoring
- Action generation
- Action prioritization
- Structured work-resumption brief generation
- Structured API response
- Scenario-based evaluation
- Automated unit testing
- End-to-end testing
- Evidence-grounded output
- Explicit handling of insufficient evidence

---

# Feature Scope

## In Scope

The current implementation supports:

- Processing commits
- Processing pull request comments
- Processing GitHub issues
- Processing TODO items
- Processing meeting notes
- Normalizing different source formats into a common event model
- Chronological ordering of work events
- Entity resolution across different source descriptions
- Compound entity resolution
- Contradiction and conflict detection
- Current work-state reconstruction
- Blocker identification
- Downstream impact assessment
- Evidence collection
- Confidence scoring
- Action generation
- Action prioritization
- Structured work-resumption brief generation
- API response formatting
- Handling insufficient or conflicting evidence
- Automated unit testing
- End-to-end testing
- Scenario-based evaluation

## Out of Scope

The current implementation does not include:

- Live synchronization with GitHub, Slack, Discord, or other external services
- Automatic modification of source repositories or project files
- Automatic execution of recommended actions
- Full semantic embedding-based entity resolution
- LLM-based reasoning or response generation
- Production-scale distributed processing
- Real-time notifications
- Visualization dashboards
- Multi-language processing

Potential extensions are described in the **Future Work / Roadmap** section.

---

# Supported Sources

The input parser supports the following source types:

- Commits
- Pull request comments
- GitHub issues
- TODO items
- Meeting notes

Each supported source is normalized into a common event representation before downstream processing.

---

# Architecture

The system uses a staged processing pipeline in which work events are progressively transformed into a structured work-resumption brief.

The implemented architecture follows the 8-component pipeline described above.

```text
+------------------------+
|      API Request       |
+-----------+------------+
            |
            v
+------------------------+
|  Multi-Source Parser   |
|  Source Normalization  |
+-----------+------------+
            |
            v
+------------------------+
|   Temporal Ordering    |
+-----------+------------+
            |
            v
+------------------------+
| Entity Resolution +    |
| Conflict Detection     |
+-----------+------------+
            |
            v
+------------------------+
|  Evidence Collection   |
+-----------+------------+
            |
            v
+------------------------+
|  State Reconstruction  |
+-----------+------------+
            |
            v
+------------------------+
| Blocker Identification |
+-----------+------------+
            |
            v
+------------------------+
| Action Generation +    |
| Action Prioritization  |
+-----------+------------+
            |
            v
+------------------------+
|   Brief Generation     |
|   Structured API       |
|       Response         |
+------------------------+
```
