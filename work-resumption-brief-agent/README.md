# Work Resumption Brief Agent

## Overview

An AI agent that analyzes work-related information from multiple sources and produces a structured resumption brief.

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

## Project Structure

```text
src/
├── config.py
├── logger.py
├── models.py
└── components/
    ├── input_parser/
    ├── source_normalizer/
    ├── temporal_ordering/
    ├── conflict_detection/
    ├── source_extension/
    └── api_response/

tests/