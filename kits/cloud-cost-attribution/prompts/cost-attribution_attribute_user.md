Period: {{codeNode_redact.output.periodLabel}} ({{codeNode_redact.output.currency}})

Anomalies (attribute each one, using only its own candidateEvents list):

{{codeNode_redact.output.redactedAnomalies}}

Return one attribution result per anomaly above, keyed by `anomalyId`, choosing
`causeEventId` only from that anomaly's own `candidateEvents` (or `null`).
