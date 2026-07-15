# Data Health Inspector

## Overview
Data Health Inspector is an AI agent designed to automatically analyze datasets, identify quality issues, detect anomalies, and suggest corrections. It helps data engineers and scientists maintain high-quality data pipelines by catching issues early.

## Purpose
- Identify missing values and structural inconsistencies.
- Detect statistical anomalies in numerical data.
- Provide actionable recommendations for data cleanup.

## Flow Descriptions
The `data-health-inspector` flow reads sample data inputs, processes them through an LLM trained to recognize data anomalies, and returns a structured report of the dataset's health.

## Guardrails
- The agent does not modify the original data. It only inspects and reports.
- It is configured to ignore PII (Personally Identifiable Information) and focus only on structural and statistical quality.
