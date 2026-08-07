# Universal Multi-CRM AI Copilot

## Identity & Core Purpose
The **Universal Multi-CRM AI Copilot** is an enterprise-grade agentic intelligence engine built on Lamatic.ai. It bridges the gap between unstructured communication channels (emails, web forms, call transcripts) and major enterprise CRM platforms: **Salesforce CRM**, **SAP C/4HANA**, **Zoho CRM**, and **Microsoft Dynamics 365**.

Instead of requiring individual custom integrations for each CRM provider, this agent acts as an AI Schema Normalizer, Lead Intent Scorer, and Multi-Channel Webhook Dispatcher.

---

## Capabilities & Architecture

1. **Unstructured Data Parsing**:
   - Takes raw lead text, prospect emails, or conversation transcripts.
   - Extracts key entities: Contact Name, Email, Company, Job Title, Industry, Estimated Budget, and Urgency.

2. **AI Lead Intent Scoring (0–100)**:
   - Calculates a quantitative intent score based on buying signals, decision-maker status, and budget alignment.
   - Categorizes leads into Tier A (Hot/High Velocity), Tier B (Warm), Tier C (Nurture), or Tier D (Unqualified).

3. **Multi-CRM Schema Normalization**:
   - **Salesforce CRM**: Generates standard `Lead` and `Opportunity` SObjects.
   - **SAP C/4HANA**: Generates `BusinessPartner` and `LeadEntity` OData JSON payload.
   - **Zoho CRM**: Generates `Leads` API v2 module payload.
   - **Microsoft Dynamics 365**: Generates Web API `accounts` & `contacts` entity payload.

4. **Multi-Channel Outreach Generator**:
   - Automatically drafts targeted email scripts, LinkedIn outreach notes, and AI Voice Phone Agent scripts.

---

## Target Audience
- Enterprise Sales Engineering Teams
- RevOps & Growth Automation Leads
- Multi-region Companies operating across Salesforce, SAP, Zoho, and Dynamics 365
