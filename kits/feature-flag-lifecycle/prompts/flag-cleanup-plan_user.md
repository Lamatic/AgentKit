Based on the following feature flag inventory from repository {{triggerNode_1.output.repoUrl}}, generate a cleanup plan.

Flag inventory (JSON):
{{triggerNode_1.output.flags}}

Optional flag status mapping (which flags are active, always-on, experiment-completed, or archived):
{{triggerNode_1.output.flagStatusMapping}}

Group the inventory records by `type` and `flagName` before planning. The same flag may have multiple records (declaration, usage, and/or multiple files). Emit **one cleanup item per grouped flag**, aggregating all distinct file paths into `filesToModify` and deduplicating context snippets.

For each grouped stale or removable flag, provide:
- flagName
- currentStatus (derived from status mapping if provided, otherwise inferred from usage)
- removalRisk (low/medium/high)
- estimatedEffort (files count + lines count)
- deprecationTimeline (immediate/short-term/medium-term/long-term)
- recommendedActions (array of specific steps)
- filesToModify (array of file paths — one entry per distinct file where the flag appears)

Return ONLY valid JSON. Do not include explanatory text.
