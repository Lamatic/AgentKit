Based on the following feature flag inventory from repository {{triggerNode_1.output.repoUrl}}, generate a cleanup plan.

Flag inventory (JSON):
{{triggerNode_1.output.flags}}

Optional flag status mapping (which flags are active, always-on, experiment-completed, or archived):
{{triggerNode_1.output.flagStatusMapping}}

For each stale or removable flag, provide:
- flagName
- currentStatus (derived from status mapping if provided, otherwise inferred from usage)
- removalRisk (low/medium/high)
- estimatedEffort (files count + lines count)
- deprecationTimeline (immediate/short-term/medium-term/long-term)
- recommendedActions (array of specific steps)
- filesToModify (array of file paths)

Return ONLY valid JSON. Do not include explanatory text.