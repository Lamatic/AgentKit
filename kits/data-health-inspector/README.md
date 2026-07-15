# Data Health Inspector

This Lamatic AgentKit template provides an automated workflow to inspect datasets for quality issues, structural inconsistencies, and anomalies.

## What it does
The **Data Health Inspector** template takes dataset samples as input and processes them using a configured LLM to generate a comprehensive data quality report. It helps data teams save time by automatically flagging issues like missing values, unexpected data types, and potential outliers before data enters production pipelines.

## Prerequisites
- A [Lamatic.ai](https://lamatic.ai) account.
- Basic understanding of Lamatic Studio flows.

## Setup Instructions
1. Import this template into your Lamatic Studio project.
2. Configure the LLM node with your preferred model and API credentials (if applicable).
3. Deploy the flow.

## Usage
Send a JSON payload containing dataset summaries or sample rows to the flow's endpoint. The flow will return a structured JSON response identifying any anomalies and offering recommendations for cleanup.
