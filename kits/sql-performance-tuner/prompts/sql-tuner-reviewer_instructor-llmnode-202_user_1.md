Original query:

```sql
{{triggerNode_1.output.originalQuery}}
```

Baseline:

```json
{{triggerNode_1.output.baseline}}
```

Experiments:

```json
{{triggerNode_1.output.experiments}}
```

Deterministic outcome: `{{triggerNode_1.output.deterministicOutcome}}`

Winning experiment number: `{{triggerNode_1.output.winningExperimentNumber}}`

Evidence synthesizer draft:
```json
{{InstructorLLMNode_201.output}}
```

Write the final reviewer explanation without contradicting the deterministic
outcome.
