# Instruction: Work Resumption Brief Agent

## Problem Statement

Developers lose significant time reconstructing context after interruptions.
This agent automates that reconstruction using temporal reasoning and evidence collection.

## Approach

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