# Instruction: Work Resumption Brief Agent

## Problem Statement

Developers lose significant time reconstructing context after interruptions.
This agent automates that reconstruction using temporal reasoning and evidence collection.

## Approach

The Work Resumption Brief Agent uses an 8-component pipeline:

**Component 1:** Parser — Normalize all source types (commits, PRs, issues, TODOs, meeting notes)

**Component 2:** Temporal Ordering — Establish chronology with deterministic tie-breaking

**Component 3:** Entity Resolution + Conflict Detection — Match entity mentions and detect contradictions

**Component 4:** Evidence Collector — Calculate confidence scores (0.30 sources + 0.40 recency + 0.30 consistency)

**Component 5:** State Reconstructor — Categorize work state (COMPLETE, IN_PROGRESS, BLOCKED, PENDING, UNCERTAIN)

**Component 6:** Blocker Identifier — Identify obstacles preventing progress and assess downstream impact

**Component 7:** Action Prioritizer — Generate and rank next actions (0.50 blocking + 0.30 impact + 0.20 urgency)

**Component 8:** Brief Generator — Format the output as a structured work-resumption brief and API response

## Current Pipeline

The implemented pipeline processes work events through the following stages:

1. Parser — Normalize source inputs into a common event model.
2. Temporal Ordering — Establish the chronological order of events.
3. Entity Resolution + Conflict Detection — Resolve entity references and identify contradictions.
4. Evidence Collection — Collect supporting evidence and calculate confidence.
5. State Reconstruction — Reconstruct the current work state.
6. Blocker Identification — Identify blockers and downstream impact.
7. Action Prioritization — Generate and rank recommended next actions.
8. Brief Generation — Produce the structured work-resumption brief and API response.

## Evaluation

The evaluation framework contains 7 scenarios covering core functionality and edge cases.

The evaluation measures the implemented behavior using explicit scenario criteria and reports the resulting scores.

The evaluation scenarios include:

- Contradictory Sources
- Outdated Decision
- Insufficient Evidence
- Multiple Blockers
- Competing Actions
- No Clear Action
- False Conflict Detection

## Supported Input Sources

The parser supports work-related information from multiple source types, including:

- Commits
- Pull request comments
- Issues
- TODOs
- Meeting notes

## Core Principles

The system is designed around evidence rather than unsupported assumptions.

The agent should distinguish between:

- Confirmed information
- Conflicting information
- Incomplete evidence
- Uncertain conclusions

The central principle is:

> Never manufacture certainty when the available evidence does not support it.

## Output

The generated work-resumption brief provides structured information about:

- Current work state
- Conflicts
- Evidence
- Blockers
- Recommended actions
- Confidence

The system should surface uncertainty when available evidence is insufficient or contradictory.

## Scope

The Work Resumption Brief Agent is responsible for reconstructing interrupted development work from provided source information.

It does not:

- Automatically modify source repositories or project files
- Automatically execute recommended actions
- Claim certainty when evidence is insufficient
- Perform production-scale distributed processing
- Depend on LLM-based reasoning for the core deterministic pipeline

## Validation

The project uses automated unit tests, end-to-end tests, and scenario-based evaluation to validate the implemented pipeline.

Changes to the implementation should be verified with the available test suite and evaluation scenarios before being considered complete.
