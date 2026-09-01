# Work Resumption Brief Agent

## Overview

An AI agent that analyzes work-related information from multiple sources and
produces a structured resumption brief.

The agent helps a user understand the current state of work after a period of
interruption by collecting, normalizing, ordering, analyzing, and summarizing
information from different work-related sources.

## Project Goals

- Normalize source information
- Order information temporally
- Detect conflicting information
- Extend source information
- Return a structured API response

## Architecture

The workflow consists of:

1. API Request
2. Normalize Sources
3. Temporal Ordering
4. Conflict Detection
5. Source Extension
6. API Response

### Workflow

```text
API Request
    |
    v
Normalize Sources
    |
    v
Temporal Ordering
    |
    v
Conflict Detection
    |
    v
Source Extension
    |
    v
API Response