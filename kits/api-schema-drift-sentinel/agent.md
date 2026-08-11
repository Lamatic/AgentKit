# API Schema Drift Sentinel

## Overview
API Schema Drift Sentinel detects breaking changes between OpenAPI specifications and produces grounded migration guidance.

## Purpose
The goal of this kit is to prevent breaking API drift by combining deterministic AST diffing with an AI reasoning layer.

## Flows
### 1. Analyze Schema Drift
- **Flow ID / Env key mapping:** `analyze-schema-drift` (configured via `LAMATIC_DRIFT_FLOW_ID`)
