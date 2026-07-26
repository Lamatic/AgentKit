# Incident

## Alert
{{triggerNode_1.output.alertText}}

## Runbook context
{{codeNode_runbooks.output.runbooks}}

## Recent repository activity
{{codeNode_changes.output.recentChanges}}

## Prior hypotheses for this incident (empty on first investigation)
{{memoryRetrieveNode_prior.output.memories}}

---

Produce the ranked hypotheses. If the "Prior hypotheses" section is non-empty, this is a follow-up: revise the existing ranking in light of the alert and evidence above, and state what changed in each hypothesis's reasoning.
