import dotenv from "dotenv";
import { Client } from "@notionhq/client";

dotenv.config();

// ✅ Load environment variables (matching your .env exactly)
const NOTION_API_KEY = process.env.NOTION_API_KEY;
let DATABASE_ID = process.env.DATABASE_ID;

if (!NOTION_API_KEY) {
  throw new Error("❌ NOTION_API_KEY is missing in your .env file!");
}
if (!DATABASE_ID) {
  throw new Error("❌ DATABASE_ID is missing in your .env file!");
}

// ✅ Clean DATABASE_ID (remove dashes if present)
DATABASE_ID = DATABASE_ID.replace(/-/g, '');

// Optional: check ID length (Notion database IDs are 32 chars)
if (DATABASE_ID.length !== 32) {
  throw new Error(
    "❌ Database_Id seems invalid. It should be a 32-character Notion database ID (no dashes)."
  );
}

// ✅ Initialize Notion client
const notion = new Client({ auth: NOTION_API_KEY });

// ✅ Step 1: Test connection to your Notion database
async function testNotionConnection() {
  try {
    // Use non-null assertion directly to satisfy TypeScript
    const res: any = await notion.databases.retrieve({
      database_id: DATABASE_ID!,
    });

    const dbTitle = res?.title?.[0]?.plain_text || "Untitled Database";
    console.log("✅ Connected to Notion DB:", dbTitle);
  } catch (err: any) {
    console.error("❌ Notion connection failed:", err.message);
    if (err.code === "unauthorized") {
      console.error(
        "⚠️ Your Notion_Api_Key might be invalid or the integration does not have access to the database."
      );
    }
  }
}

// Run the test immediately
testNotionConnection();

// ✅ Step 2: Handle queries dynamically
export async function handleQuery(query: string) {
  if (query.toLowerCase().includes("list databases")) {
    const res = await notion.search({
      filter: { property: "object", value: "database" } as any,
    });

    return res.results.map((db: any) => ({
      name: db?.title?.[0]?.plain_text || "Untitled DB",
      id: db.id,
    }));
  }

  if (query.toLowerCase().includes("create page")) {
    // Use non-null assertion directly for TypeScript
    const res = await notion.pages.create({
      parent: { database_id: DATABASE_ID! },
      properties: {
        // Cast to any to satisfy strict TypeScript types
        Name: {
          title: [{ text: { content: "New Task from Assistant AgentKit" } }],
        } as any,
        Priority: { select: { name: "High" } } as any,
      },
    });

    return { success: true, pageId: res.id };
  }

  return { message: "Command not recognized." };
}
