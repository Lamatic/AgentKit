# Technical Notes

## Confidence Scoring

The agent calculates confidence using three weighted signals:

confidence = 100 x (
    0.30 x (num_sources / 3) +
    0.40 x recency_score +
    0.30 x consistency_score
)

### Confidence Factors

- Source count (0.30): Multiple independent sources increase confidence.
- Recency (0.40): Recent evidence receives the highest weight.
- Consistency (0.30): Unresolved conflicts reduce confidence.

## Why Deterministic Core + LLM Reasoning?

- Deterministic: Parsing, temporal ordering, entity resolution, and evidence collection are reproducible, fast, and predictable.
- LLM + Validation: State reasoning can use LLM reasoning while schema validation prevents invalid or fabricated outputs.
- Result: Combines deterministic processing with reasoning while maintaining evidence-grounded behavior.

## Golden Rule Implementation

> Component failures reduce confidence; never fabricate certainty.

The pipeline follows this principle:

- Parser fails: Skip the affected source and continue with available evidence.
- Evidence missing: Confidence is reduced and the state can be marked LOW confidence.
- Conflict unresolved: State is represented as UNCERTAIN.
- LLM returns invalid schema: Use the fallback brief rather than accepting invalid output.

This prevents the system from presenting uncertain information as fact.

## Entity Resolution

Entity resolution uses layered matching:

1. Exact matching
2. Normalized matching
3. Semantic/synonym matching
4. Compound entity recognition

Examples include resolving variations such as:

- resume parser
- resume-parser
- Resume parsing

to the same logical entity where the evidence supports that relationship.

## Temporal Reasoning

Events from different sources are ordered using their timestamps.

When contradictory claims are found, newer evidence is treated as authoritative for the resolution. The system preserves the conflicting claims and their timestamps rather than silently discarding the earlier evidence.

## Blocker Impact Assessment

Blocked work is evaluated for downstream impact.

Known dependency relationships are used to identify affected downstream tasks. High-impact blockers are explicitly represented in the generated brief.

## Evaluation

The project includes 7 evaluation scenarios covering:

- Contradictory sources
- Outdated decisions
- Insufficient evidence
- Multiple blockers
- Competing actions
- No clear action
- False conflict detection

### Actual Evaluation Results

The current measured evaluation score is:

100.0% across 7 scenarios

The results are reported from the latest verified evaluation run.

See:

- evaluation/evaluation_report.md
- evaluation/results.json

for the detailed evaluation results.

## Testing

The project currently has:

73 automated tests passing.

The test suite covers individual components as well as end-to-end pipeline behavior.

## Design Principle

The primary design principle is:

> Evidence should determine confidence, and uncertainty should be represented rather than hidden.

The system is designed to help developers resume interrupted work without presenting unsupported conclusions as certain facts.
