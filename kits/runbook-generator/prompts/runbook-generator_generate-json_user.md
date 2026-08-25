Convert the following operational notes into a structured runbook.

Optional context:
- Service name: {{triggerNode_1.output.service_name}}
- Environment: {{triggerNode_1.output.environment}}

Operational notes:
{{triggerNode_1.output.notes}}

Produce a complete runbook with:
- a clear title and purpose
- audience (who should run this)
- prechecks before acting
- ordered steps with action, expected_result, optional commands, and risk
- validation checks after the procedure
- rollback / undo steps when applicable
- assumptions you had to make
- missing_info the operator still needs
- warnings for safety or redaction issues
