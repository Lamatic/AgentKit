# Notion Assistant AgentKit

A Notion Assistant AgentKit to query and manage your Notion workspace.

---

## Folder Structure

/actions                  # Orchestrator / agent actions
/templates/notionassistant # This agent's folder
/lamatic-config.json       # Agent configuration
/package.json              # Scripts & dependencies
/README.md                 # This documentation

---

## Setup

### 1. Configure Environment Variables

Create a `.env` file in the **project root** (`AgentKit/.env`) with your configuration:

NOTION_API_KEY=your_notion_secret_key
DATABASE_ID=your_database_id

> Make sure the Notion integration has access to the database you want to use.

---

### 2. Install Dependencies

```bash
cd templates/notionassistant
npm install
```

---

### 3. Run Locally

```bash
npm run dev
```

You should see:

✅ Connected to Notion DB: Tasks

---

## Example Queries

**List databases**

```javascript
await handleQuery("list databases");
```

**Create a new page**

```javascript
await handleQuery("create page");
```

Pages are created in the database specified in your `.env`.

---

## Dependencies

- `@notionhq/client` → Notion SDK  
- `dotenv` → Load environment variables  
- `lamatic` → Lamatic AgentKit support  
- `ts-node` → Run TypeScript files directly  
- `typescript` → TypeScript support  

---

## Contributing

Follow `CONTRIBUTING.md` guidelines. Make sure:

- `.env` is never committed  
- All changes are tested locally  
- Pull request includes updated `README.md` and `lamatic-config.json`

---

## Author

Meghana-2124
