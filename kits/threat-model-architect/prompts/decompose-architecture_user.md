Current intake session_state:
{{triggerNode_1.output.session_state}}

Normalize this into a security architecture model for STRIDE analysis.

If the input is a JSON string, parse it mentally before producing output. Preserve stated facts, add reasonable inferred data flows only when they follow directly from the described stack, and list missing information explicitly.

Do not echo the input. Enrich it.

If the parsed input contains frontend, API/backend, database, auth, payments, or storage components, you must produce non-empty `external_actors`, `trust_boundaries`, `data_flows`, `entry_points`, and `security_assumptions`.
