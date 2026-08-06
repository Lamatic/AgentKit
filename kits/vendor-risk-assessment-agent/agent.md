# Vendor Risk Assessment Agent

## Overview

This AgentKit provides an AI-powered workflow for enterprise third-party vendor due diligence.

It consists of three coordinated agents:

1. Vendor Information Extraction
2. Vendor Risk Assessment
3. Risk Recommendation Generation

The workflow transforms unstructured vendor questionnaires into structured vendor profiles, evaluates security, compliance, financial, operational, and legal risks, and produces actionable recommendations.

## Inputs

- Vendor questionnaire
- Security documentation
- Compliance information

## Outputs

- Structured vendor profile
- Risk assessment
- Executive recommendations

## Guardrails

- Never invent vendor information.
- Base assessments only on extracted evidence.
- Recommendations must be supported by the assessment.
- Return structured JSON at every stage.