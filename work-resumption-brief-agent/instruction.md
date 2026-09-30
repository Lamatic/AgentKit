# Instruction: Work Resumption Brief Agent

## Problem Statement

Developers lose significant time reconstructing context after interruptions.
This agent automates that reconstruction using temporal reasoning and evidence collection.

## Approach

## Approach
8-component pipeline:

**Component 1:** Parser — Normalize all source types (commits, PRs, issues, TODOs, meeting notes)
**Component 2:** Temporal Ordering — Establish chronology with deterministic tie-breaking
**Component 3:** Entity Resolution + Conflict Detection — Match entity mentions, detect contradictions
**Component 4:** Evidence Collector — Calculate confidence scores (0.30 sources + 0.40 recency + 0.30 consistency)
**Component 5:** State Reconstructor — Categorize work state (COMPLETE, IN_PROGRESS, BLOCKED, PENDING, UNCERTAIN)
**Component 6:** Blocker Identifier — Identify obstacles preventing progress
**Component 7:** Action Prioritizer — Generate and rank next actions (0.50 blocking + 0.30 impact + 0.20 urgency)
**Component 8:** Brief Generator — Format output as human-readable brief

## Evaluation
7 scenarios test core functionality and edge cases with honest measured scores (not inflated).









The Day 1 workflow consists of:

1. API Request
2. Normalize Sources
3. Temporal Ordering
4. Conflict Detection
5. Source Extension
6. API Response

The system is designed to process work information, preserve source context,
identify temporal relationships and conflicts, and return a structured response.

## Evidence Principle

The agent must use available evidence and must not fabricate information.

If required information is missing, the system should represent the missing
information explicitly rather than creating unsupported certainty.

## Evaluation

The project will later evaluate:

1. Contradictory sources
2. Outdated information
3. Insufficient evidence
4. Multiple blockers
5. Competing actions
6. No clear action
7. False conflicts and synonym handling