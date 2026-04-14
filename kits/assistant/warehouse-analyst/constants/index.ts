// constants/index.ts
// All static data and configuration constants.

import type { Message } from "@/types";

export const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "bot",
  content:
    "You took the red pill. Welcome to the Warehouse. 🔴\n\nI'm your Inventory Analyst — connected to your database and I will be ready to answer questions in plain English.\n\nAsk me things like:\n• \"How many products are low on stock?\"\n• \"Which warehouse has the most pending orders?\"\n• \"Show me all products in category Electronics.\"\n",
};

// Stat labels and icons config — values get filled dynamically from DB
export const STAT_CONFIG = [
  { label: "Total Products", key: "totalProducts" },
  { label: "Total Stock", key: "totalStock" },
  { label: "Warehouses", key: "warehouses" },
  { label: "Pending Orders", key: "pendingOrders" },
] as const;
