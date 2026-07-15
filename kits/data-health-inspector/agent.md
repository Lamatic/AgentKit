# Data Health Inspector

## Overview

Data Health Inspector is an AI agent designed to automatically analyze datasets, identify quality issues, detect anomalies, and suggest corrections. It helps data engineers and scientists maintain high-quality data pipelines by catching issues early.

## Purpose

- Identify missing values and structural inconsistencies.
- Detect statistical anomalies in numerical data.
- Provide actionable recommendations for data cleanup.

## Flow Descriptions

The `data-health-inspector` flow extracts CSV data and processes it through a series of custom Code Nodes to mathematically detect data anomalies and calculate health scores. It then passes these metrics to an AI interpretation node to generate a narrative summary and actionable recommendations, returning a complete structured JSON report.

## Guardrails

- The agent does not modify the original data. It only inspects and reports.
- It is configured to ignore PII (Personally Identifiable Information) and focus only on structural and statistical quality.
