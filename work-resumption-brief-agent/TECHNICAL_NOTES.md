# Technical Notes

## Architecture Overview

The Work Resumption Brief Agent currently uses a deterministic processing
pipeline to transform mixed development sources into a structured work
resumption brief.

The current implementation does not depend on an LLM for the core pipeline.

The pipeline is designed to be:

- Deterministic
- Evidence-grounded
- Reproducible
- Testable
- Resilient to invalid individual inputs
- Independent of paid or external AI API keys

The current processing flow is:

1. Input parsing
2. Temporal ordering
3. Entity resolution
4. Conflict detection
5. Evidence collection
6. State reconstruction
7. Blocker identification
8. Action prioritization
9. Brief generation

Each stage receives structured data from the previous stage and produces
structured output for the next stage.

---

## Deterministic Core

The core components intentionally use deterministic processing.

The current implementation does not contain an LLM-based reasoning stage.

The pipeline uses explicit parsing, ordering, entity matching, evidence
aggregation, confidence calculations, state classification, blocker
detection, prioritization, and brief generation.

This makes the core processing reproducible for the same input data.

---

## Input Parsing

The parser normalizes supported source types into `NormalizedEvent`
objects.

Supported sources include:

- Commits
- Pull request comments
- GitHub issues
- TODOs
- Meeting notes

Input records are validated during parsing.

Invalid individual records are logged and skipped so that valid records
from other sources can continue through the pipeline.

The parser therefore prevents a malformed source record from unnecessarily
stopping processing of otherwise usable evidence.

---

## Temporal Ordering

Events are normalized and ordered chronologically.

Timestamp values are converted into timezone-aware `datetime` values before
being compared.

The temporal ordering stage also detects significant gaps between
consecutive events.

These gaps can provide additional context when reconstructing interrupted
work.

The ordering operation is deterministic: the same valid input timestamps
produce the same chronological ordering.

---

## Entity Resolution

Entity resolution associates related events and evidence with the same
logical work item.

The implementation uses deterministic matching strategies rather than
LLM-generated entity names.

This allows downstream components to operate on stable entity identifiers
and reduces unsupported entity associations.

Where a canonical entity map is available, downstream state reconstruction
can use those canonical entity names instead of extracting entity names
from free-form conclusions.

---

## Conflict Detection

The conflict detection stage identifies contradictory evidence associated
with the same entity.

Examples include evidence indicating that a task is complete while other
evidence indicates that the same task remains unresolved.

Conflicts are preserved as explicit structured data rather than silently
discarded.

Downstream state reconstruction can use these conflicts when determining
whether the current state should be represented as uncertain.

The system does not resolve contradictory evidence by inventing an
unsupported conclusion.

---

## Evidence Collection

Evidence collection combines available information for each logical
entity.

Evidence remains associated with its originating source identifiers so
that resulting work states can remain traceable to the original inputs.

Confidence is calculated using deterministic scoring rules based on the
available evidence.

The evidence collector does not generate unsupported evidence when
information is missing.

When evidence is incomplete, the resulting confidence can be reduced
rather than replaced with fabricated certainty.

---

## State Reconstruction

State reconstruction converts collected evidence into `WorkState` objects.

Possible states include:

- `COMPLETE`
- `IN_PROGRESS`
- `BLOCKED`
- `UNCERTAIN`
- `PENDING`

The state is determined from available evidence, confidence, and detected
conflicts.

If evidence contains supported blocking or unresolved conditions, the
entity can be classified as `BLOCKED`.

If conflicting evidence remains unresolved, the entity can be classified
as `UNCERTAIN`.

Confidence is calculated from the available evidence rather than from
assumptions about the work.

The implementation does not claim certainty when the available evidence
does not support it.

---

## Blocker Identification

The blocker identification stage analyzes reconstructed states and
evidence to identify conditions that may prevent progress.

Blockers are derived from the available structured evidence and detected
state information.

The component does not invent blockers that are not supported by the
input evidence.

The resulting blockers can be passed to the action prioritization stage
to help determine the most useful next action.

---

## Action Prioritization

The action prioritizer converts reconstructed work states and identified
blockers into prioritized next actions.

Priority is determined from the available deterministic signals.

The purpose of prioritization is to identify the most useful next
concrete task while preserving the relationship between the action and
the evidence supporting it.

The prioritizer does not require an external AI model or paid API key.

---

## Brief Generation

The brief generator produces the final structured resumption brief.

The brief summarizes information produced by the preceding deterministic
pipeline.

The output can contain:

- Current work state
- Open decisions
- Blockers
- Prioritized next actions
- Risks and assumptions
- Suggested first concrete task

The generated brief is based on structured results produced by the
pipeline.

The current implementation does not require an LLM to generate or
validate the core pipeline result.

---

## Error Handling Principle

The project follows the following principle:

> Component failures reduce confidence; they do not justify fabricated
> certainty.

The pipeline handles failures as follows.

### Parser Failure

An invalid source record is logged and skipped while valid records
continue to be processed.

### Missing Evidence

Missing evidence does not result in fabricated information.

The resulting state may have reduced confidence or remain pending when
there is insufficient information to establish a stronger state.

### Conflicting Evidence

Conflicting information is preserved as structured conflict data.

When conflicting evidence remains unresolved, the state can be represented
as `UNCERTAIN` rather than forcing an unsupported conclusion.

### Empty Input

When there is no usable input, the pipeline can return an appropriate
empty or fallback result instead of inventing work activity.

---

## Evidence-Grounded Design

The pipeline is designed so that meaningful states, blockers, and
recommended actions are derived from structured evidence available to the
system.

The design therefore favors:

- Explicit source identifiers
- Deterministic transformations
- Confidence scoring
- Conflict preservation
- Conservative state classification
- Graceful handling of missing data

This approach keeps the output traceable to the information supplied to
the pipeline.

For the same valid input, deterministic processing should produce
reproducible results.

---

## Current AI/LLM Scope

The current Work Resumption Brief Agent implementation does not contain an
LLM-based reasoning component.

The current implementation is a deterministic pipeline.

No current component should be interpreted as performing:

- LLM reasoning
- LLM-generated entity resolution
- LLM-based schema validation
- Model-generated fallback behavior
- LLM-generated evidence
- Model-based state reconstruction

The current pipeline does not require a paid AI API key or an external
LLM service for its core processing.

This documentation intentionally describes only functionality implemented
in the current system.

---

## Future LLM Integration

LLM-based functionality may be considered as a future enhancement.

A future implementation could use an LLM for tasks such as:

- Higher-level interpretation of evidence
- More flexible natural-language summarization
- Improved action wording
- Semantic reasoning across heterogeneous sources
- Natural-language explanation of conflicts

If an LLM is introduced in the future, it should operate on top of the
deterministic evidence pipeline rather than replace evidence traceability.

A future LLM integration should include:

- Explicit input and output schemas
- Response validation
- Safe fallback behavior
- Evidence references
- Handling of invalid model responses
- Tests covering malformed model output
- Clear separation between model-generated interpretation and deterministic
  source data

These capabilities are future design considerations and are not part of
the current implementation unless they are explicitly implemented and
tested.

---

## Design Principles

### 1. Evidence Over Assumptions

The system should prefer available evidence over inferred or fabricated
information.

### 2. Determinism

Core transformations should produce reproducible results for the same
inputs.

### 3. Traceability

Important output should remain connected to its originating evidence.

### 4. Graceful Degradation

Failure of one input or component should not unnecessarily discard valid
information from other sources.

### 5. Conservative Confidence

When evidence is insufficient or contradictory, the system should reduce
confidence or represent uncertainty rather than claim certainty.

### 6. Explicit Conflicts

Contradictory evidence should be preserved so that downstream processing
can represent uncertainty instead of silently choosing one unsupported
interpretation.

### 7. Testability

Each processing stage should be independently testable, with end-to-end
tests validating the complete pipeline.

### 8. No Fabricated Evidence

The system should not create evidence, activity, blockers, decisions, or
work states that are not supported by the available input.

---

## Testing Strategy

The project uses unit and integration tests to validate the deterministic
pipeline.

Tests cover areas including:

- Input parsing
- Invalid input handling
- Timestamp processing
- Temporal ordering
- Entity resolution
- Conflict detection
- Evidence collection
- State reconstruction
- Blocker identification
- Action prioritization
- Brief generation
- End-to-end pipeline behavior

The test suite is the source of truth for implemented behavior.

Documentation should not claim functionality that is not implemented and
tested.

Changes to the deterministic pipeline should be accompanied by appropriate
tests to verify that existing behavior remains intact.

---

## Current Processing Pipeline

The current implementation can be represented as:

```text
Input Sources
     |
     v
Input Parsing
     |
     v
Temporal Ordering
     |
     v
Entity Resolution
     |
     v
Conflict Detection
     |
     v
Evidence Collection
     |
     v
State Reconstruction
     |
     v
Blocker Identification
     |
     v
Action Prioritization
     |
     v
Brief Generation
     |
     v
Structured Resumption Brief