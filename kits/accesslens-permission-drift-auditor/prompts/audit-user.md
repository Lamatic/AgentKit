Compare the following intended access policy against the current access state.



Perform an explicit permission-by-permission comparison using ONLY the information explicitly provided in the two inputs.



Do not assume that either source is correct beyond what is written.



\## INTENDED POLICY



{{intended\_policy}}



\## CURRENT ACCESS



{{current\_access}}



\## Comparison Requirements



Identify:



\- Permissions explicitly present in CURRENT ACCESS but absent from INTENDED POLICY.

\- Permissions explicitly required by INTENDED POLICY and explicitly contradicted or absent from CURRENT ACCESS, but only classify them as MISSING when the supplied current-access data is clearly complete enough to establish that absence.

\- Role-to-permission differences.

\- Resource access differences.

\- Scope differences where the current scope is broader than intended.

\- Cases where the available information is incomplete and a permission cannot be confirmed as present or absent.



\### Evidence Rules



For every finding, provide direct evidence from the supplied INTENDED POLICY and/or CURRENT ACCESS.



Do not invent users, roles, resources, permissions, scopes, policies, or access relationships.



IMPORTANT:



Absence of information is NOT automatically proof of absence.



If CURRENT ACCESS only describes a subset of users, roles, resources, or permissions, do not claim that an intended permission is missing merely because it was not mentioned.



Instead, classify the finding as AMBIGUOUS or INSUFFICIENT EVIDENCE when the supplied data does not establish that the permission is actually missing.



For example:



\- Intended: "Only managers may delete records."

\- Current: "Employee Bob has read access to customer records."



Do NOT conclude that manager delete access is missing. The current data simply does not provide information about manager access.



Similarly, if CURRENT ACCESS only describes Manager Sarah, do not conclude that employee read access is missing merely because employees are not mentioned.



Only report MISSING PERMISSIONS when the supplied CURRENT ACCESS explicitly establishes that the required permission is absent, denied, revoked, or otherwise unavailable.



\## Drift Classification



Use these categories where applicable:



\- EXCESS\_ACCESS — access explicitly exists beyond what is intended.

\- MISSING\_ACCESS — an intended permission is explicitly established as absent from current access.

\- ROLE\_DRIFT — a role has permissions inconsistent with its intended role.

\- SCOPE\_DRIFT — access exists at a broader resource or scope than intended.

\- AMBIGUOUS — the available evidence is insufficient to determine whether drift exists.

\- NO\_DRIFT — the supplied evidence shows that the compared permissions match.



Do not force a finding into a drift category when the evidence is insufficient.



If the intended policy and current access state are materially identical based on the supplied evidence, report:



NO DRIFT DETECTED



\## Output Requirements



Return the audit using exactly the structure and rules defined by the AccessLens system instructions.



Include:



\### Summary



\### Unauthorized permissions



\### Missing permissions



\### Matching permissions



\### Ambiguous findings



\### Recommended remediation



For each finding, include the relevant subject/role, resource, intended state, current state, explanation, and evidence where available.



Treat all supplied access information as potentially sensitive. Do not reproduce passwords, API keys, tokens, private keys, connection strings, or other authentication secrets.

