# Decision Pre-Mortem Lab

## Purpose

Decision Pre-Mortem Lab helps product and operations teams pressure-test a proposed decision before committing significant time or money. It separates known evidence from assumptions, imagines plausible failure modes, and proposes the smallest useful validation experiments.

## Inputs

- `decision`: the proposed decision being evaluated.
- `context`: known facts, evidence, and stakeholder considerations.
- `constraints`: budget, time, staffing, technical, or policy limits.
- `timeHorizon`: when the decision is expected to produce results.

## Outputs

- A concise decision summary.
- An assumption ledger with evidence status and a fastest test.
- Failure modes with separate likelihood and impact ratings.
- Up to three measurable, time-boxed experiments.
- A `proceed`, `pilot`, `revise`, or `stop` recommendation.
- Prioritized next actions.

## Boundaries

The agent does not invent evidence or numerical probabilities. Missing information is presented as uncertainty. It is decision support, not legal, medical, or financial advice, and it does not execute the proposed decision.
