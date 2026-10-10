# Work Resumption Brief Agent - Evaluation Report

## Evaluation Summary

The evaluation suite was executed using:

```text
python -m evaluation.run_scenarios
```


| Scenario | Status | Score | States | Conflicts | Blockers | Actions | Confidence |
|---|---|---:|---:|---:|---:|---:|---:|
| Contradictory Sources | PARTIAL | 0.5 | 1 | 1 | 0 | 2 | 61.0 |
| Outdated Decision | PASS | 1.0 | 1 | 0 | 1 | 2 | 66.0 |
| Insufficient Evidence | PASS | 1.0 | 1 | 0 | 0 | 1 | 48.0 |
| Multiple Blockers | PASS | 1.0 | 4 | 0 | 3 | 4 | 61.0 |
| Competing Actions | PASS | 1.0 | 5 | 0 | 0 | 5 | 56.0 |
| No Clear Action | PASS | 1.0 | 1 | 0 | 0 | 1 | 0.0 |
| False Conflict Detection | PARTIAL | 0.6666666666666666 | 1 | 0 | 0 | 0 | 66.0 |

### Overall Score

**0.880952380952381 (88.10%)**
