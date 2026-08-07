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
   UNIVERSAL_CRM_AI_COPILOT=your_flow_id_here
   LAMATIC_PROJECT_ID=your_project_id_here
   LAMATIC_API_KEY=your_api_key_here
   LAMATIC_API_URL=https://api.lamatic.ai
   ```

4. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser.
