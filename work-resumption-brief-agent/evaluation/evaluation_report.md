# Work Resumption Brief Agent — Evaluation Report

## Evaluation Summary

The evaluation suite was executed using:

```text
python -m evaluation.run_scenarios
| Scenario                 | Status | Score | States | Conflicts | Blockers | Actions | Confidence |
| ------------------------ | ------ | ----: | -----: | --------: | -------: | ------: | ---------: |
| Contradictory Sources    | PASS   |   1.0 |      1 |         1 |        0 |       2 |       85.0 |
| Outdated Decision        | PASS   |   1.0 |      1 |         0 |        1 |       1 |      100.0 |
| Insufficient Evidence    | PASS   |   1.0 |      1 |         0 |        0 |       1 |       40.0 |
| Multiple Blockers        | PASS   |   1.0 |      4 |         0 |        3 |       4 |       55.0 |
| Competing Actions        | PASS   |   1.0 |      5 |         0 |        0 |       5 |       40.0 |
| No Clear Action          | PASS   |   1.0 |      1 |         0 |        0 |       1 |        0.0 |
| False Conflict Detection | PASS   |   1.0 |      1 |         0 |        0 |       0 |       90.0 |
