\# AccessLens — Permission Drift Auditor



AccessLens is a Lamatic AgentKit that detects authorization drift by comparing an organization's \*\*intended access policy\*\* against its \*\*current access state\*\*.



Instead of asking whether a permission is inherently dangerous, AccessLens asks a more practical security question:



> \*\*Does the access that exists today still match the access that was intended?\*\*



\## The Problem



Access-control systems change constantly.



People change roles, permissions are added or removed, resources move between scopes, and access relationships can gradually diverge from the authorization model an organization intended to maintain.



Manually comparing policy definitions with IAM/RBAC exports is tedious and error-prone.



AccessLens turns that comparison into a repeatable audit.



\## What AccessLens Detects



\### Excess Access



Permissions that currently exist but are not intended.



```text

INTENDED

Finance Analyst → Finance Reports → READ



CURRENT

Finance Analyst → Finance Reports → READ, WRITE

