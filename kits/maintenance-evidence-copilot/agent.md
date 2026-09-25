# Maintenance Evidence Copilot

## Overview

Maintenance Evidence Copilot is a supervised synthetic-maintenance demonstration. It turns one API maintenance event into a bounded assessment for the drive-end rolling-element bearing on `MTR-101`.

## Flow

`triage-maintenance-event` runs deterministic evidence preparation, structured evidence synthesis, and a final guard/assembly step. The final guard preserves deterministic telemetry and priority, forces `rootCauseConfirmed` to `false`, allowlists source IDs, and blocks unsafe autonomous instructions.

## Application boundary

The included Next.js app calls only the deployed `triage-maintenance-event` flow. It offers three fixed scenarios and formats a local CMMS-style draft only after explicit human approval. It has no authentication, persistence, retrieval, external integrations, or second AI call.

## Required configuration

The app requires `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL`, and `TRIAGE_MAINTENANCE_EVENT_FLOW_ID` in `apps/.env.local`.

## Guardrails

- Possible explanations are visibly unconfirmed.
- The assessment is read-only before approval.
- Approval creates a local draft only; it does not send a handoff or work order.
- Root cause remains unconfirmed and physical work must follow approved isolation procedures.
