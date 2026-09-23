# SQL Performance Tuner Agent Contract

Contract version: `1.0`

This document defines the boundary between Lamatic and the deterministic SQLite
runtime. Lamatic owns diagnosis, strategy selection, adaptation, and final
explanation. The application owns database access, safety enforcement,
execution, equivalence checking, measurement, and winner selection.

## Strategist input

The application calls `sql-tuner-strategist` before every experiment with:

- `contractVersion`: always `1.0`.
- `originalQuery`: the validated read-only SQL query.
- `schema`: table, column, primary-key, and index metadata.
- `baseline`: the original query, query plan, complete bounded result digest,
  and repeated benchmark.
- `experiments`: ordered evidence from every attempted candidate.
- `attemptedStrategies`: the strategy used by each experiment, in the same
  order as the evidence.
- `remainingExperiments`: the unused portion of the five-experiment budget.

Raw table rows are never sent to Lamatic.

Each evidence item records the candidate's strategy, SQL, hypothesis, expected
plan change, actual plan and benchmark when available, verdict, failure class,
and a compact observation. Failure classes are `safety`, `equivalence`,
`performance`, or `execution`; successful evaluations use `none`.

## Strategist output

Lamatic returns exactly one action.

### Experiment action

An experiment contains:

- `action`: `create_index` or `rewrite_query`.
- `strategy`: `covering_index`, `filter_first_index`,
  `grouping_first_index`, `partial_index`, `query_rewrite`, or
  `revise_failed_candidate`.
- `hypothesis`: a falsifiable performance claim.
- `expectedPlanChange`: the observable plan change that would support it.
- `indexSql` or `sql`: exactly one candidate statement.
- `adaptation.learnedFromEvidence`: what prior measurements imply.
- `adaptation.differsFromPrevious`: why this candidate is not a repetition.
- `adaptation.respondsToExperiment`: the prior experiment number that prompted
  the pivot, when applicable.
- `stopConditions`: operator-facing criteria for ending this line of inquiry.
  The runtime records these in the evidence trail while independently enforcing
  safety, equivalence, and the `1.10x` threshold.

### Conclusion action

A conclusion contains:

- `action` and `strategy`: both `conclude`.
- `conclusionCode`: `winner_found`, `budget_exhausted`,
  `no_safe_distinct_experiment`, or `insufficient_evidence`.
- `reasoning`: why another experiment is not worthwhile.
- `evidenceUsed`: experiment numbers supporting the decision.

The runtime rejects malformed output, duplicate SQL or identical index column
ordering, unknown identifiers, and unsafe operations. Different index column
orders remain distinct because order changes SQLite access behavior. A model
decision is a proposal, never proof.

## Adaptation rules

The strategist must obey these behavioral rules:

1. Never repeat SQL or an equivalent index column ordering already attempted.
2. After two consecutive unsuccessful index strategies, pivot to a query
   rewrite, revise a failed candidate using new evidence, or conclude.
3. After a safety rejection, explain the violated constraint and avoid the same
   unsupported SQL shape.
4. After a non-equivalent rewrite, preserve the original result semantics in
   the next proposal or stop attempting rewrites.
5. Treat improvements below `1.10x` as measurement noise, not a win.
6. Do not claim a speedup or equivalent result unless supplied by measured
   evidence.
7. Conclude when the budget is exhausted or no safe, distinct, falsifiable
   experiment remains.

## Reviewer contract

After deterministic winner selection, the application calls
`sql-tuner-reviewer` once with the original query, baseline, complete evidence,
the deterministic outcome, and the winning experiment number when one exists.

The reviewer returns a headline, evidence summary, recommendation, limitations,
and the experiment numbers it cited. It cannot select or replace the winner,
change verdicts, invent measurements, or convert an unsuccessful run into a
success.

## Acceptance criteria

Phase 1 is complete when the contracts reject inconsistent budgets, mismatched
strategy history, and reviewer outputs that contradict deterministic winner
selection.

The complete agent is ready for submission only when a Live Lamatic run proves:

1. Lamatic is called before each experiment and once for final review.
2. A failed or slower result changes the next decision or causes a justified
   conclusion.
3. Every displayed speedup, plan, and equivalence claim comes from the SQLite
   runtime.
4. Unsafe and non-equivalent candidates cannot win.
5. Removing Lamatic removes diagnosis, adaptive strategy selection, and final
   evidence explanation; the remaining application is only an execution tool.
