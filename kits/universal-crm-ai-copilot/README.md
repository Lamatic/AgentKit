# Universal Multi-CRM AI Copilot

Deploy an AI-powered CRM Lead Intelligence & Dispatch Engine in minutes with Lamatic.ai. Transform raw emails, web forms, and voice notes into normalized payloads for **Salesforce**, **SAP C/4HANA**, **Zoho CRM**, and **Microsoft Dynamics 365**.

---

## ✨ Features
- ⚡ **Multi-CRM Payload Normalization**: Generates native API JSON payloads for Salesforce, SAP, Zoho, and MS Dynamics 365.
- 🎯 **AI Lead Intent Scoring**: Calculates an intent score (0–100) and lead tier (A/B/C/D).
- ✉️ **Multi-Channel Outreach**: Auto-drafts Email, LinkedIn, and Voice Agent scripts.
- 🚀 **Next.js Studio UI**: Live multi-tab dashboard for payload inspection and cURL generation.

---

## 🛠️ Setup Instructions

1. Clone the repository and navigate to the app directory:
   ```bash
   cd kits/universal-crm-ai-copilot/apps
   ```

2. Copy the `.env.example` file:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Lamatic credentials in `.env.local`:
   ```env
   UNIVERSAL_CRM_AI_COPILOT=6f844470-e9cb-48a0-93b6-870669c77790
   LAMATIC_PROJECT_ID=e304d4a0-c07b-43ff-b653-18e0a838f7b3
   LAMATIC_API_KEY=lt-776a06294e47d6a9b2d953791390a8ea
   LAMATIC_API_URL=https://api.lamatic.ai
   ```

4. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser.
