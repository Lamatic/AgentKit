## Demo

[![SnapKart Demo](https://img.youtube.com/vi/Y33eiVSYIjc/maxresdefault.jpg)](https://youtu.be/Y33eiVSYIjc)

> Turn your shop WhatsApp number into an AI-powered order desk. Click to watch the full demo.
# SnapKart

> Turn your shop WhatsApp number into an AI-powered order desk.

India kirana stores take orders over WhatsApp in unstructured Hinglish. Orders get missed. Items get confused. Owners spend evenings reconciling chat threads manually.

SnapKart solves this. It connects to your shop WhatsApp number via Twilio, classifies every incoming message by intent, extracts structured line items from Hinglish, matches them against your product catalog using hybrid vector search, logs clean orders to Airtable, and pings the shop owner on Slack with a live dashboard.

## What it does

| Customer sends | SnapKart does |
|---|---|
| bhaiya 2 surf excel chota wala aur 1 kg chini bhej do | Classifies as new_order, extracts 2 items, confirms in Hinglish, logs to Airtable, pings Slack |
| surf excel kitne ka hai? | Classifies as inquiry, searches catalog, replies with real price and stock status |
| kal wala doodh kharab tha | Classifies as complaint, apologizes, escalates to Slack |
| Kese ho ap | Classifies as chitchat, greets warmly, invites an order |

## Flows

### order-intake
The main WhatsApp agent triggered by Twilio webhook on every incoming message.

Nodes used:
- AI: Classifier, Generate JSON schema-enforced, Generate Text
- Data: Memory Retrieve, Hybrid Search, VectorDB
- Logic: Branch, Condition, Code, Variables
- Apps: Twilio, Airtable, Slack

### catalog-indexer
Indexes the shop product catalog into the vector database on demand.

## Setup

### Prerequisites
- Lamatic.ai account
- Twilio account with WhatsApp sandbox
- Airtable account
- Slack workspace
- Gemini API key for embeddings
- Groq API key for LLM inference

### 1. Deploy the flows
Import both flows into your Lamatic project. Configure credentials:
- Kirana: Groq API key
- Sales Call Copilot: Gemini API key
- twilio-kirana: Twilio Account SID and Auth Token
- airtable-kirana: Airtable PAT via API node
- slack-kirana: Slack OAuth

### 2. Set up Airtable
Create a base called Kirana Copilot with a table Orders:

| Field | Type |
|---|---|
| phone | Single line text |
| items | Long text |
| total | Number |
| status | Single select: pending, confirmed, delivered |
| created | Created time |

### 3. Index your catalog
Send a POST request to the catalog-indexer webhook:

```json
{
  "items": [
    {
      "name": "Surf Excel 500g",
      "aliases": "surf excel chota wala, surf chota",
      "unit": "packet",
      "price": 45,
      "stock": true
    }
  ]
}
```

### 4. Configure Twilio
Twilio Console, Messaging, WhatsApp Sandbox, set When a message comes in to your order-intake webhook URL with POST method.

### 5. Run the dashboard

```bash
cd apps
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Dashboard pages

| Page | What it does |
|---|---|
| /orders | Live order feed from Airtable. Confirm or mark delivered. Auto-refreshes every 20 seconds. |
| /simulate | Send any Hinglish message and see the agent respond without WhatsApp. |
| /catalog | Edit and push your product catalog to the vector index. |

## Cost per conversation

| Step | Cost |
|---|---|
| Classification | ~$0.000175 |
| Extraction order | ~$0.00043 |
| Catalog search | ~$0.000002 |
| Reply generation | ~$0.000085 |
| Total per message | ~$0.0007 |

500 customer messages per day costs approximately 30 rupees per month.

## Tradeoffs

- Twilio sandbox for demo. Production needs approved WhatsApp Business number from Meta.
- Single-tenant catalog. One vector index per shop.
- Hinglish handled via prompt design, not fine-tuning.
- Memory nodes wired but LLM extraction inactive. Returning customer recognition is a roadmap feature.
- Total calculation deferred. Price-aware totaling requires Loop over matched catalog items.