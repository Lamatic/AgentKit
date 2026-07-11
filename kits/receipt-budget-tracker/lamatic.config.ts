export default {
  "name": "Receipt Budget Tracker",
  "description": "A Receipt Budget Tracker that uses Vision AI to scan receipts, extract line items, and organize your expenses.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Palash Pathare",
    "email": "palashpathare@gmail.com"
  },
  "tags": ["finance", "receipt", "vision", "expense-tracker"],
  "steps": [
    {
      "id": "receipt-budget-tracker",
      "type": "mandatory",
      "envKey": "RECEIPT_TRACKER_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit/tree/main/kits/receipt-budget-tracker/apps&project-name=receipt-budget-tracker&repository-name=receipt-budget-tracker&env=LAMATIC_API_KEY,LAMATIC_PROJECT_ID,RECEIPT_TRACKER_FLOW_ID,GEMINI_API_KEY",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/receipt-budget-tracker"
  }
};
