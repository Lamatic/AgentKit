# Data Health Inspector

This Lamatic AgentKit template provides an automated, massive enterprise-grade 16-Stage Data Quality Pipeline to inspect datasets for quality issues, structural inconsistencies, and anomalies.

## What it does

The **Data Health Inspector** template takes a dataset URL as input and processes the data through a modular 9-node architecture (covering 16 stages of data quality checks). It helps data teams save time by automatically flagging issues like missing values, unexpected data types, and potential outliers before data enters production pipelines.

### The 9-Node Architecture

1. **Trigger**: Receives the dataset URL via an API request.
2. **Extract Node**: Natively parses and extracts the CSV data.
3. **Validation & Schema Profiler**: Validates the dataset size and extracts the column schema.
4. **Type Inference & Consistency**: Automatically infers column data types (STRING, NUMBER, BOOLEAN, DATE) and checks for whitespace inconsistencies.
5. **Completeness, Uniqueness, Validity**: Checks for missing values, exact row duplicates, skewed data, and invalid type formats.
6. **Statistical Profiler**: Calculates descriptive stats (min, max, IQR outliers) and Pearson correlation matrices for numerical columns.
7. **Issue, Severity & Score Engines**: Mathematically calculates a total health score and status based on weighted defect points.
8. **AI Interpretation Layer**: Processes the profiled metrics through a configured LLM (via Fetch) to generate a narrative summary, readiness assessment, risks, and recommendations.
9. **JSON Report Generator**: Returns the structured JSON response containing the final health metrics and AI-generated findings.

## Prerequisites

- A [Lamatic.ai](https://lamatic.ai) account.
- Basic understanding of Lamatic Studio flows.

## Setup Instructions

1. Import this template into your Lamatic Studio project.
2. Configure the AI Interpretation Node with your preferred LLM and API credentials (if applicable).
3. Deploy the flow.

## Usage

Send a JSON payload containing the `dataset_url` string to the flow's endpoint. The flow will extract the CSV, run it through the 16-stage pipeline, and return a structured JSON response identifying any anomalies and offering recommendations for cleanup.
