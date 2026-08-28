# AccessLens — Permission Drift Auditor

## Overview

AccessLens is a security analysis agent that detects permission drift by comparing two explicit sources of truth:

1. **Intended Policy** — the permissions that should exist.
2. **Current Access** — the permissions that currently exist.

It identifies meaningful differences between these states and produces an evidence-based permission audit containing:

- Drift findings
- Drift categories
- Risk levels
- Evidence for each finding
- Recommended remediation
- Coverage statistics
- Uncertain or incomplete areas

AccessLens does not modify permissions, accounts, roles, resources, or policies.

It is an analysis and recommendation system intended to help security and engineering teams identify access-control changes that no longer match their intended authorization model.

---

## Problem

Permission systems change continuously.

Users change roles, permissions are added or removed, resources move between scopes, and access relationships can gradually diverge from the authorization state that was originally intended.

Traditional access reviews often require manually comparing policy definitions with exported IAM/RBAC state. Small but important differences can therefore be difficult to identify consistently.

AccessLens turns this comparison into a repeatable audit.

The key question it answers is:

> **Does the access that exists today still match the access that was intended?**

---

## Core Workflow

```text
                INTENDED POLICY
                      │
                      │
                      ▼
               ┌──────────────┐
               │              │
               │  AccessLens  │
               │    Audit     │
               │              │
               └──────────────┘
                      ▲
                      │
                      │
                CURRENT ACCESS
                      │
                      ▼
              Explicit Comparison
                      │
                      ▼
              Drift Classification
                      │
              ┌───────┴────────┐
              ▼                ▼
        Risk Assessment   Evidence Analysis
              │                │
              └───────┬────────┘
                      ▼
                 Remediation
                      │
                      ▼
                 Audit Report