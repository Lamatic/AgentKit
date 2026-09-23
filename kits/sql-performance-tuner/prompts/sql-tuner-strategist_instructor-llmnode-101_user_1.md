Original query:

```sql
{{triggerNode_1.output.originalQuery}}
```

Schema:

```json
{{triggerNode_1.output.schema}}
```

Baseline:

```json
{{triggerNode_1.output.baseline}}
```

Previous experiments:

```json
{{triggerNode_1.output.experiments}}
```

Attempted strategies:

```json
{{triggerNode_1.output.attemptedStrategies}}
```

Remaining experiments: `{{triggerNode_1.output.remainingExperiments}}`

Evidence analyst diagnosis:

- Likely bottleneck: `{{InstructorLLMNode_100.output.bottleneck}}`
- Lessons from evidence: `{{InstructorLLMNode_100.output.evidenceLessons}}`
- Strategies to avoid: `{{InstructorLLMNode_100.output.strategiesToAvoid}}`
- Recommended direction: `{{InstructorLLMNode_100.output.recommendedDirection}}`
- Analyst reasoning: `{{InstructorLLMNode_100.output.reasoning}}`

Select one safe, distinct, falsifiable next action or conclude.
